/**
 * Day 22: 主题系统
 * - 支持 light / dark / auto 三种模式
 * - 通过 CSS 自定义属性 + data-theme 属性全局切换
 * - 自动监听系统主题变化（auto 模式）
 * - 持久化到 localStorage
 */
import { ref, watch, onMounted } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_KEY = 'habit-tracker-theme'
const STYLE_ID = 'habit-theme-styles'

const theme = ref<ThemeMode>('auto')
const resolvedTheme = ref<'light' | 'dark'>('light')

let styleEl: HTMLStyleElement | null = null
let mediaQuery: MediaQueryList | null = null

function injectGlobalStyles() {
  if (styleEl) return
  styleEl = document.createElement('style')
  styleEl.id = STYLE_ID
  document.head.appendChild(styleEl)
}

function updateStyleSheet(isDark: boolean) {
  if (!styleEl) injectGlobalStyles()

  const css = isDark ? getDarkStyles() : getLightStyles()
  styleEl!.textContent = css
}

function getLightStyles(): string {
  return `
    :root,
    [data-theme="light"] {
      --ht-bg: #ffffff;
      --ht-bg-secondary: #f5f5f5;
      --ht-bg-hover: #f0f0f0;
      --ht-bg-card: #ffffff;
      --ht-text: #333333;
      --ht-text-secondary: #666666;
      --ht-text-tertiary: #888888;
      --ht-text-muted: #999999;
      --ht-border: #eeeeee;
      --ht-border-light: #ddd;
      --ht-shadow: rgba(0, 0, 0, 0.05);
      --ht-primary: #4A90D9;
      --ht-primary-light: #e3f2fd;
      --ht-success: #4CAF50;
      --ht-danger: #f44336;
      --ht-warning: #ff9800;
      --ht-heat-0: #ebedf0;
      --ht-heat-1: #c6e48b;
      --ht-heat-2: #7bc96f;
      --ht-heat-3: #239a3b;
      --ht-heat-4: #196127;
      color-scheme: light;
    }
  `
}

function getDarkStyles(): string {
  return `
    :root,
    [data-theme="dark"] {
      --ht-bg: #1a1a2e;
      --ht-bg-secondary: #16213e;
      --ht-bg-hover: #0f3460;
      --ht-bg-card: #16213e;
      --ht-text: #e4e4e7;
      --ht-text-secondary: #a1a1aa;
      --ht-text-tertiary: #71717a;
      --ht-text-muted: #52525b;
      --ht-border: #27272a;
      --ht-border-light: #3f3f46;
      --ht-shadow: rgba(0, 0, 0, 0.3);
      --ht-primary: #60a5fa;
      --ht-primary-light: #1e3a5f;
      --ht-success: #34d399;
      --ht-danger: #f87171;
      --ht-warning: #fbbf24;
      --ht-heat-0: #1e293b;
      --ht-heat-1: #0f3460;
      --ht-heat-2: #1a5276;
      --ht-heat-3: #2471a3;
      --ht-heat-4: #3498db;
      color-scheme: dark;
    }

    /* Dark mode overrides for hardcoded Halo components */
    [data-theme="dark"] .halo-page,
    [data-theme="dark"] .dashboard,
    [data-theme="dark"] .stats-page,
    [data-theme="dark"] .settings-page,
    [data-theme="dark"] .tasks-page,
    [data-theme="dark"] .habits-page,
    [data-theme="dark"] .pomodoro-page {
      background: var(--ht-bg, #1a1a2e);
      color: var(--ht-text, #e4e4e7);
    }

    /* Form elements in dark mode */
    [data-theme="dark"] input,
    [data-theme="dark"] select,
    [data-theme="dark"] textarea {
      background: #0f3460;
      color: var(--ht-text, #e4e4e7);
      border-color: var(--ht-border-light, #3f3f46);
    }

    [data-theme="dark"] input::placeholder {
      color: var(--ht-text-muted, #52525b);
    }

    /* Scrollbar dark mode */
    [data-theme="dark"] ::-webkit-scrollbar {
      background: var(--ht-bg-secondary, #16213e);
    }
    [data-theme="dark"] ::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 6px;
    }
  `
}

function applyTheme() {
  const isDark = resolvedTheme.value === 'dark'
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  updateStyleSheet(isDark)
}

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(): 'light' | 'dark' {
  if (theme.value === 'auto') {
    return getSystemPreference()
  }
  return theme.value
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      theme.value = saved as ThemeMode
    }
  } catch {}
  resolvedTheme.value = resolveTheme()
  applyTheme()
}

function setTheme(mode: ThemeMode) {
  theme.value = mode
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {}
  resolvedTheme.value = resolveTheme()
  applyTheme()
}

function toggleTheme() {
  const next = resolvedTheme.value === 'dark' ? 'light' : 'dark'
  setTheme(next)
}

function setupSystemListener() {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (theme.value === 'auto') {
      resolvedTheme.value = resolveTheme()
      applyTheme()
    }
  }
  mediaQuery.addEventListener('change', handler)
}

export function useTheme() {
  onMounted(() => {
    injectGlobalStyles()
    loadTheme()
    setupSystemListener()
  })

  watch(theme, () => {
    resolvedTheme.value = resolveTheme()
    applyTheme()
  })

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }
}

/**
 * Standalone init for app entry point (non-component context).
 * Call once at app bootstrap to apply persisted theme before any component mounts.
 */
export function initTheme() {
  injectGlobalStyles()
  loadTheme()
  setupSystemListener()
}
