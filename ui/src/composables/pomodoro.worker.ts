/**
 * Day 8: Web Worker 倒计时核心 + 偏差补偿
 *
 * 设计要点：
 * 1. 使用 setInterval(100ms) 高频刷新，避免浏览器后台节流导致偏差
 * 2. 每 10 秒执行一次偏差补偿：对比 Date.now() 理论值与实际值，修正 remaining
 * 3. 支持 start / pause / resume / stop 四种控制消息
 * 4. 倒计时归零时自动发送 complete 事件
 */

export interface WorkerMessage {
  type: 'start' | 'pause' | 'resume' | 'stop'
  duration?: number
  mode?: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
}

export interface WorkerResponse {
  type: 'tick' | 'complete' | 'paused' | 'stopped' | 'drift'
  remaining?: number
  total?: number
  mode?: string
  drift?: number
}

const TICK_INTERVAL = 100 // 100ms 刷新间隔
const DRIFT_CHECK_INTERVAL = 10_000 // 每 10 秒偏差补偿
const DRIFT_THRESHOLD = 500 // 偏差超过 500ms 才修正

let timerId: ReturnType<typeof setInterval> | null = null
let remaining = 0
let total = 0
let mode = 'FOCUS'
let running = false
let lastTickReal = 0
let tickCount = 0

function postTick() {
  const msg: WorkerResponse = { type: 'tick', remaining, total, mode }
  self.postMessage(msg)
}

function checkDrift() {
  if (!running) return
  const now = Date.now()
  const expectedElapsed = tickCount * TICK_INTERVAL
  const actualElapsed = now - lastTickReal
  const drift = actualElapsed - expectedElapsed

  if (Math.abs(drift) > DRIFT_THRESHOLD && drift > 0) {
    // 实际时间比计时器走得快（浏览器节流导致），补偿修正
    const driftSeconds = Math.floor(drift / 1000) * 1000
    remaining = Math.max(0, remaining - driftSeconds)
    const driftMsg: WorkerResponse = { type: 'drift', drift: driftSeconds, remaining, total, mode }
    self.postMessage(driftMsg)
  }

  tickCount = 0
  lastTickReal = now
}

function tick() {
  if (!running) return

  tickCount++
  remaining -= TICK_INTERVAL

  if (remaining <= 0) {
    remaining = 0
    running = false
    postTick()
    self.postMessage({ type: 'complete', total, mode } as WorkerResponse)
    stopTimer()
    return
  }

  postTick()

  // 偏差补偿检查
  if (tickCount * TICK_INTERVAL >= DRIFT_CHECK_INTERVAL) {
    checkDrift()
  }
}

function startTimer(durationMs: number, timerMode: string) {
  remaining = durationMs
  total = durationMs
  mode = timerMode
  running = true
  tickCount = 0
  lastTickReal = Date.now()

  if (timerId !== null) {
    clearInterval(timerId)
  }
  timerId = setInterval(tick, TICK_INTERVAL)
  postTick()
}

function stopTimer() {
  running = false
  tickCount = 0
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

function pauseTimer() {
  running = false
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

function resumeTimer() {
  if (remaining <= 0) return
  running = true
  tickCount = 0
  lastTickReal = Date.now()
  timerId = setInterval(tick, TICK_INTERVAL)
  postTick()
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data

  switch (msg.type) {
    case 'start':
      if (msg.duration) {
        startTimer(msg.duration * 1000, msg.mode || 'FOCUS')
      }
      break
    case 'pause':
      pauseTimer()
      self.postMessage({ type: 'paused', remaining, total, mode } as WorkerResponse)
      break
    case 'resume':
      resumeTimer()
      break
    case 'stop':
      stopTimer()
      self.postMessage({ type: 'stopped', remaining, total, mode } as WorkerResponse)
      break
  }
}

// 通知主线程 Worker 已就绪
self.postMessage({ type: 'stopped', remaining: 0, total: 0, mode: 'FOCUS' } as WorkerResponse)
