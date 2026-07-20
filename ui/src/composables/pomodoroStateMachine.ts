/**
 * Day 9: 番茄钟状态机 + 三模式切换
 *
 * 设计要点：
 * 1. 5 种状态：IDLE / FOCUS / SHORT_BREAK / LONG_BREAK / PAUSED
 * 2. 事件驱动转换：START_FOCUS / COMPLETE / PAUSE / RESUME / RESET / SKIP
 * 3. 可配置时长：默认 Focus=25min, Short Break=5min, Long Break=15min
 * 4. 长休息触发条件：每完成 4 个 Focus 后自动进入 Long Break
 */

export type PomodoroState = 'IDLE' | 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'PAUSED'

export type PomodoroEvent =
  | 'START_FOCUS'
  | 'COMPLETE'
  | 'PAUSE'
  | 'RESUME'
  | 'RESET'
  | 'SKIP'

export interface PomodoroConfig {
  focusDuration: number    // 秒
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number // 几个 focus 后进入长休息
}

export const DEFAULT_CONFIG: PomodoroConfig = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
}

export interface PomodoroContext {
  state: PomodoroState
  focusCount: number        // 当前轮次已完成的 Focus 数量（重置前）
  totalFocusToday: number   // 今日累计 Focus 数量（不随 reset 清零）
  config: PomodoroConfig
  previousState: PomodoroState | null  // PAUSE 前状态，用于恢复
}

const validTransitions: Record<PomodoroState, Partial<Record<PomodoroEvent, PomodoroState>>> = {
  IDLE: {
    START_FOCUS: 'FOCUS',
  },
  FOCUS: {
    PAUSE: 'PAUSED',
    COMPLETE: 'SHORT_BREAK',  // 动态决定
    RESET: 'IDLE',
    SKIP: 'IDLE',
  },
  SHORT_BREAK: {
    PAUSE: 'PAUSED',
    COMPLETE: 'IDLE',
    RESET: 'IDLE',
    SKIP: 'IDLE',
    START_FOCUS: 'FOCUS',
  },
  LONG_BREAK: {
    PAUSE: 'PAUSED',
    COMPLETE: 'IDLE',
    RESET: 'IDLE',
    SKIP: 'IDLE',
    START_FOCUS: 'FOCUS',
  },
  PAUSED: {
    RESUME: 'FOCUS',   // 动态恢复到 previousState
    RESET: 'IDLE',
  },
}

export function createStateMachine(initialConfig?: Partial<PomodoroConfig>): {
  getContext: () => PomodoroContext
  send: (event: PomodoroEvent) => { success: boolean; newState: PomodoroState; duration: number; mode: string }
  updateConfig: (config: Partial<PomodoroConfig>) => void
} {
  const config = { ...DEFAULT_CONFIG, ...initialConfig }

  const ctx: PomodoroContext = {
    state: 'IDLE',
    focusCount: 0,
    totalFocusToday: 0,
    config,
    previousState: null,
  }

  function getDuration(): number {
    switch (ctx.state) {
      case 'FOCUS': return config.focusDuration
      case 'SHORT_BREAK': return config.shortBreakDuration
      case 'LONG_BREAK': return config.longBreakDuration
      default: return 0
    }
  }

  function send(event: PomodoroEvent): { success: boolean; newState: PomodoroState; duration: number; mode: string } {
    const current = ctx.state
    const transitions = validTransitions[current]

    if (!transitions || !(event in transitions)) {
      return { success: false, newState: current, duration: 0, mode: current }
    }

    let nextState = transitions[event]!

    // 处理动态转换
    if (event === 'COMPLETE' && current === 'FOCUS') {
      ctx.focusCount++
      ctx.totalFocusToday++
      if (ctx.focusCount > 0 && ctx.focusCount % config.longBreakInterval === 0) {
        nextState = 'LONG_BREAK'
      } else {
        nextState = 'SHORT_BREAK'
      }
    }

    if (event === 'RESUME' && current === 'PAUSED') {
      nextState = ctx.previousState || 'FOCUS'
    }

    // 记录 PAUSE 前的状态
    if (event === 'PAUSE') {
      ctx.previousState = current
    }

    // RESET 时重置本轮计数
    if (event === 'RESET') {
      ctx.focusCount = 0
      ctx.previousState = null
    }

    // SKIP 在 FOCUS 状态也重置
    if (event === 'SKIP' && current === 'FOCUS') {
      // SKIP focus: 不增加 focusCount，直接回到 IDLE
    }

    ctx.state = nextState

    // 如果是 COMPLETE 或开始新 Focus，更新 previousState
    if (event === 'COMPLETE' || event === 'RESET') {
      ctx.previousState = null
    }

    return {
      success: true,
      newState: nextState,
      duration: event === 'START_FOCUS' || event === 'COMPLETE' || event === 'RESUME'
        ? getDuration()
        : 0,
      mode: nextState,
    }
  }

  function updateConfig(partial: Partial<PomodoroConfig>) {
    Object.assign(config, partial)
  }

  return {
    getContext: () => ({ ...ctx }),
    send,
    updateConfig,
  }
}
