/**
 * Day 38: 全局错误处理与边界条件加固
 *
 * 设计要点：
 * 1. 统一的 API 错误格式化（后端消息提取）
 * 2. 用户友好的错误提示映射
 * 3. 网络超时 / 离线检测
 * 4. 可重试的错误状态管理
 */

import { ref } from "vue";

export interface ErrorState {
  message: string;
  code?: string;
  retryable: boolean;
}

const defaultErrorMessages: Record<string, string> = {
  "Failed to fetch": "网络连接失败，请检查网络后重试",
  "NetworkError": "网络异常，请稍后重试",
  "timeout": "请求超时，请重试",
  "500": "服务器内部错误，请稍后重试",
  "404": "请求的资源不存在",
  "400": "请求参数有误",
  "401": "认证失败，请重新登录",
  "403": "没有访问权限",
};

/**
 * 从原始错误中提取用户可读的错误信息
 */
export function normalizeError(err: unknown): ErrorState {
  if (err instanceof Error) {
    const msg = err.message || err.toString();

    // 尝试匹配已知模式
    for (const [pattern, friendlyMsg] of Object.entries(defaultErrorMessages)) {
      if (msg.includes(pattern)) {
        return { message: friendlyMsg, retryable: pattern !== "404" && pattern !== "400" };
      }
    }

    // 尝试提取后端返回的错误消息
    const jsonMatch = msg.match(/\{.*"message"\s*:\s*"([^"]+)".*\}/);
    if (jsonMatch) {
      return { message: jsonMatch[1], retryable: true };
    }

    // 兜底
    return { message: msg.length > 100 ? msg.slice(0, 100) + "..." : msg, retryable: true };
  }

  if (typeof err === "string") {
    return { message: err, retryable: true };
  }

  return { message: "发生未知错误", retryable: false };
}

/**
 * 检测是否为网络相关错误
 */
export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === "Failed to fetch") return true;
  if (err instanceof Error && err.name === "AbortError") return false; // 用户主动取消不算网络错误
  return !navigator.onLine;
}

/**
 * 可重试的错误状态组合式函数
 * 用于视图级错误展示和重试
 */
export function useRetryableError() {
  const error = ref<ErrorState | null>(null);

  function setError(err: unknown) {
    error.value = normalizeError(err);
  }

  function clearError() {
    error.value = null;
  }

  return { error, setError, clearError };
}
