/**
 * Day 11: Notification 浏览器通知
 *
 * 设计要点：
 * 1. 封装 Notification API，自动请求权限
 * 2. 番茄完成 / 休息完成 时发送桌面通知
 * 3. 支持权限状态查询
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export function getNotificationPermission(): NotificationPermissionState {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionState
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  const result = await Notification.requestPermission()
  return result as NotificationPermissionState
}

export function sendNotification(title: string, options?: NotificationOptions): boolean {
  if (!('Notification' in window)) {
    return false
  }
  if (Notification.permission !== 'granted') {
    return false
  }

  try {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      ...options,
    })
    return true
  } catch {
    return false
  }
}

/** 番茄完成通知 */
export function notifyPomodoroComplete(focusCount: number) {
  return sendNotification('番茄时间到！', {
    body: `专注完成！今日已完成 ${focusCount} 个番茄。休息一下吧~`,
    tag: 'pomodoro-complete',
    requireInteraction: true,
  })
}

/** 休息结束通知 */
export function notifyBreakEnd() {
  return sendNotification('休息结束', {
    body: '休息时间结束，准备开始新的番茄吧！',
    tag: 'break-end',
    requireInteraction: false,
  })
}

/** 长休息结束通知 */
export function notifyLongBreakEnd() {
  return sendNotification('长休息结束', {
    body: '长休息时间结束，精力恢复了吗？继续加油！',
    tag: 'long-break-end',
    requireInteraction: false,
  })
}
