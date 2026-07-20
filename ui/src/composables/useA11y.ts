/**
 * Day 32: 无障碍访问工具集
 * 提供键盘导航、ARIA 标签生成等辅助功能
 */

/** 生成唯一 ID（用于 aria-labelledby / aria-describedby） */
let idCounter = 0
export function useA11yId(prefix = 'ht'): string {
  return `${prefix}-${++idCounter}-${Date.now().toString(36)}`
}

/** 键盘事件辅助：Enter / Space 触发 click */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' '
}

/** 管理 focus trap（用于弹窗/模态框） */
export function useFocusTrap(containerRef: { value: HTMLElement | null }) {
  function trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const container = containerRef.value
    if (!container) return

    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return { trapFocus }
}

/** ARIA label 快捷生成：role + 内容摘要 */
export function ariaLabel(role: string, content: string): string {
  return `${role}: ${content}`
}
