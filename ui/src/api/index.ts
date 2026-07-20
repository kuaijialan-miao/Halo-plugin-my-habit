const BASE_URL = '/apis/api.plugin.halo.run/v1alpha1/plugins/plugin-habit-tracker/api'
const REQUEST_TIMEOUT_MS = 15000

/**
 * Day 38: 统一请求封装 + 超时控制
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const resp = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: controller.signal,
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`HTTP ${resp.status}: ${err}`)
    }
    if (resp.status === 204) return undefined as T
    return resp.json()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('timeout: 请求超时，请重试')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}
