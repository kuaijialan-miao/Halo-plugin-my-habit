/**
 * Day 12: 番茄钟核心编排 composable
 *
 * 职责：
 * 1. 管理 Web Worker 生命周期（创建、消息通信、销毁）
 * 2. 驱动状态机（createStateMachine）
 * 3. 触发音效和通知（useSound / useNotification）
 * 4. 暴露响应式状态给 UI 组件
 */

import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue'
import type { WorkerResponse } from './pomodoro.worker'
import {
  createStateMachine,
  type PomodoroState,
  type PomodoroEvent,
  type PomodoroConfig,
  DEFAULT_CONFIG,
} from './pomodoroStateMachine'
import {
  playStartSound,
  playCompleteSound,
  playBreakEndSound,
  playTickSound,
  playPauseSound,
  initAudio,
  setMuted,
  isMuted,
} from './useSound'
import {
  requestNotificationPermission,
  notifyPomodoroComplete,
  notifyBreakEnd,
  notifyLongBreakEnd,
} from './useNotification'

export interface UsePomodoroReturn {
  // 状态
  state: ComputedRef<PomodoroState>
  remainingSeconds: Ref<number>
  totalSeconds: Ref<number>
  progress: ComputedRef<number>
  formattedTime: ComputedRef<string>
  focusCount: ComputedRef<number>
  totalFocusToday: ComputedRef<number>

  // 动作
  startFocus: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  skip: () => void
  reset: () => void

  // 配置
  updateConfig: (config: Partial<PomodoroConfig>) => void
  toggleMute: () => boolean
  muted: Ref<boolean>
}

export function usePomodoro(initialConfig?: Partial<PomodoroConfig>): UsePomodoroReturn {
  const sm = createStateMachine(initialConfig)

  const remainingSeconds = ref(0)
  const totalSeconds = ref(0)
  const currentMode = ref<PomodoroState>('IDLE')
  const focusCount = ref(0)
  const totalFocusToday = ref(0)
  const muted = ref(false)

  let worker: Worker | null = null
  let tickBeforeComplete = false // 最后 5 秒已触发滴答声

  function createWorker() {
    // 使用 URL 方式创建 Worker，兼容 Vite IIFE 构建
    const workerCode = `
      ${workerBlobCode()}
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    return new Worker(URL.createObjectURL(blob))
  }

  function initWorker() {
    if (worker) {
      worker.terminate()
    }
    worker = createWorker()

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data

      switch (msg.type) {
        case 'tick':
          if (msg.remaining !== undefined) {
            remainingSeconds.value = Math.ceil(msg.remaining / 1000)
            totalSeconds.value = Math.ceil((msg.total || 0) / 1000)

            // 最后 5 秒滴答声
            const secs = remainingSeconds.value
            if (secs <= 5 && secs > 0 && !tickBeforeComplete) {
              tickBeforeComplete = true
              playTickSound()
            }
            if (secs > 5) {
              tickBeforeComplete = false
            }
          }
          break

        case 'complete':
          handleComplete()
          break

        case 'drift':
          if (msg.remaining !== undefined) {
            remainingSeconds.value = Math.ceil(msg.remaining / 1000)
            totalSeconds.value = Math.ceil((msg.total || 0) / 1000)
          }
          break

        case 'paused':
        case 'stopped':
          break
      }
    }

    worker.onerror = (err) => {
      console.error('[Pomodoro Worker Error]', err)
    }
  }

  function handleComplete() {
    const ctx = sm.getContext()
    const completedState = ctx.state

    if (completedState === 'FOCUS') {
      playCompleteSound()
      const result = sm.send('COMPLETE')

      const newCtx = sm.getContext()
      focusCount.value = newCtx.focusCount
      totalFocusToday.value = newCtx.totalFocusToday
      currentMode.value = result.newState

      // 通知
      notifyPomodoroComplete(newCtx.totalFocusToday)

      // 自动进入休息
      if (result.duration > 0) {
        startTimer(result.duration, result.mode)
      }
    } else if (completedState === 'SHORT_BREAK' || completedState === 'LONG_BREAK') {
      playBreakEndSound()
      const result = sm.send('COMPLETE')

      focusCount.value = sm.getContext().focusCount
      totalFocusToday.value = sm.getContext().totalFocusToday
      currentMode.value = result.newState

      // 通知
      if (completedState === 'LONG_BREAK') {
        notifyLongBreakEnd()
      } else {
        notifyBreakEnd()
      }

      // 回到 IDLE，等待用户开始下一个番茄
      remainingSeconds.value = 0
      totalSeconds.value = 0
    }
  }

  function startTimer(durationSeconds: number, mode: string) {
    remainingSeconds.value = durationSeconds
    totalSeconds.value = durationSeconds
    tickBeforeComplete = false

    if (!worker) {
      initWorker()
    }
    worker!.postMessage({
      type: 'start',
      duration: durationSeconds,
      mode,
    })
  }

  function startFocus() {
    initAudio()
    requestNotificationPermission()

    if (currentMode.value === 'PAUSED') {
      resume()
      return
    }

    const result = sm.send('START_FOCUS')
    if (!result.success) return

    currentMode.value = result.newState
    focusCount.value = sm.getContext().focusCount
    totalFocusToday.value = sm.getContext().totalFocusToday

    playStartSound()

    if (result.duration > 0) {
      startTimer(result.duration, result.mode)
    }
  }

  function pause() {
    const result = sm.send('PAUSE')
    if (!result.success) return

    currentMode.value = result.newState
    playPauseSound()

    if (worker) {
      worker.postMessage({ type: 'pause' })
    }
  }

  function resume() {
    const result = sm.send('RESUME')
    if (!result.success) return

    currentMode.value = result.newState

    if (result.duration > 0 && remainingSeconds.value > 0) {
      // RESUME 后重新启动定时器
      totalSeconds.value = result.duration
      if (worker) {
        worker.postMessage({
          type: 'start',
          duration: remainingSeconds.value,
          mode: result.mode,
        })
      } else {
        startTimer(remainingSeconds.value, result.mode)
      }
    }
  }

  function stop() {
    sm.send('RESET')
    currentMode.value = 'IDLE'
    focusCount.value = sm.getContext().focusCount
    remainingSeconds.value = 0
    totalSeconds.value = 0
    tickBeforeComplete = false

    if (worker) {
      worker.postMessage({ type: 'stop' })
      worker.terminate()
      worker = null
    }
  }

  function skip() {
    const ctx = sm.getContext()
    if (ctx.state === 'FOCUS') {
      // 跳过一个 focus：发完成事件但不计入
      sm.send('SKIP')
    } else {
      sm.send('SKIP')
    }

    const newCtx = sm.getContext()
    currentMode.value = newCtx.state
    focusCount.value = newCtx.focusCount
    totalFocusToday.value = newCtx.totalFocusToday
    remainingSeconds.value = 0
    totalSeconds.value = 0

    if (worker) {
      worker.postMessage({ type: 'stop' })
      worker.terminate()
      worker = null
    }
  }

  function reset() {
    stop()
  }

  function updateConfig(config: Partial<PomodoroConfig>) {
    sm.updateConfig(config)
  }

  function toggleMute(): boolean {
    muted.value = !muted.value
    setMuted(muted.value)
    return muted.value
  }

  const progress = computed(() => {
    if (totalSeconds.value <= 0) return 0
    return 1 - remainingSeconds.value / totalSeconds.value
  })

  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60)
    const secs = remainingSeconds.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  onUnmounted(() => {
    if (worker) {
      worker.terminate()
      worker = null
    }
  })

  return {
    state: computed(() => currentMode.value),
    remainingSeconds,
    totalSeconds,
    progress,
    formattedTime,
    focusCount: computed(() => focusCount.value),
    totalFocusToday: computed(() => totalFocusToday.value),

    startFocus,
    pause,
    resume,
    stop,
    skip,
    reset,

    updateConfig,
    toggleMute,
    muted,
  }
}

/** 内联 Worker 代码（避免 Vite IIFE 构建的 Worker 路径问题） */
function workerBlobCode(): string {
  // 直接内联 pomodoro.worker.ts 的核心逻辑
  return `
const TICK_INTERVAL = 100;
const DRIFT_CHECK_INTERVAL = 10000;
const DRIFT_THRESHOLD = 500;

let timerId = null;
let remaining = 0;
let total = 0;
let mode = 'FOCUS';
let running = false;
let lastTickReal = 0;
let tickCount = 0;

function postTick() {
  self.postMessage({ type: 'tick', remaining, total, mode });
}

function checkDrift() {
  if (!running) return;
  const now = Date.now();
  const expectedElapsed = tickCount * TICK_INTERVAL;
  const actualElapsed = now - lastTickReal;
  const drift = actualElapsed - expectedElapsed;
  if (Math.abs(drift) > DRIFT_THRESHOLD && drift > 0) {
    const driftSeconds = Math.floor(drift / 1000) * 1000;
    remaining = Math.max(0, remaining - driftSeconds);
    self.postMessage({ type: 'drift', drift: driftSeconds, remaining, total, mode });
  }
  tickCount = 0;
  lastTickReal = now;
}

function tick() {
  if (!running) return;
  tickCount++;
  remaining -= TICK_INTERVAL;
  if (remaining <= 0) {
    remaining = 0;
    running = false;
    postTick();
    self.postMessage({ type: 'complete', total, mode });
    if (timerId) { clearInterval(timerId); timerId = null; }
    return;
  }
  postTick();
  if (tickCount * TICK_INTERVAL >= DRIFT_CHECK_INTERVAL) {
    checkDrift();
  }
}

self.onmessage = function(e) {
  var msg = e.data;
  switch (msg.type) {
    case 'start':
      remaining = msg.duration * 1000;
      total = msg.duration * 1000;
      mode = msg.mode || 'FOCUS';
      running = true;
      tickCount = 0;
      lastTickReal = Date.now();
      if (timerId) clearInterval(timerId);
      timerId = setInterval(tick, TICK_INTERVAL);
      postTick();
      break;
    case 'pause':
      running = false;
      if (timerId) { clearInterval(timerId); timerId = null; }
      self.postMessage({ type: 'paused', remaining, total, mode });
      break;
    case 'resume':
      if (remaining > 0) {
        running = true;
        tickCount = 0;
        lastTickReal = Date.now();
        timerId = setInterval(tick, TICK_INTERVAL);
        postTick();
      }
      break;
    case 'stop':
      running = false;
      tickCount = 0;
      if (timerId) { clearInterval(timerId); timerId = null; }
      remaining = 0;
      total = 0;
      self.postMessage({ type: 'stopped', remaining, total, mode });
      break;
  }
};
`
}
