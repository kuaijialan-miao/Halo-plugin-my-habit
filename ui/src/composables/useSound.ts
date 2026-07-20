/**
 * Day 11: WebAudio 音效
 *
 * 设计要点：
 * 1. 使用 Web Audio API 程序化生成音效，无需外部音频文件
 * 2. 三种音效：开始提示音 / 完成提示音（铃声） / 滴答声
 * 3. 懒初始化 AudioContext（用户首次交互后）
 * 4. 支持静音开关
 */

let audioCtx: AudioContext | null = null
let muted = false

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  // 恢复被浏览器挂起的 AudioContext
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  delay: number = 0
) {
  if (muted) return
  const ctx = getContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay)

  gain.gain.setValueAtTime(0, ctx.currentTime + delay)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration)
}

/** 开始专注的提示音：短促上升音 */
export function playStartSound() {
  playTone(440, 0.1, 'sine', 0.2)
  setTimeout(() => playTone(660, 0.15, 'sine', 0.25), 80)
  setTimeout(() => playTone(880, 0.2, 'sine', 0.3), 160)
}

/** 番茄完成提示音：三声铃响 */
export function playCompleteSound() {
  const frequencies = [784, 988, 1175] // G5, B5, D6
  frequencies.forEach((freq, i) => {
    playTone(freq, 0.3, 'triangle', 0.25, i * 0.25)
  })
}

/** 休息完成提示音：柔和两声 */
export function playBreakEndSound() {
  playTone(660, 0.2, 'sine', 0.2, 0)
  setTimeout(() => playTone(880, 0.3, 'sine', 0.3), 150)
}

/** 滴答声（倒计时最后 5 秒） */
export function playTickSound() {
  playTone(1000, 0.05, 'square', 0.1)
}

/** 暂停音效 */
export function playPauseSound() {
  playTone(330, 0.15, 'triangle', 0.15)
  setTimeout(() => playTone(262, 0.2, 'triangle', 0.15), 120)
}

export function setMuted(val: boolean) {
  muted = val
}

export function isMuted(): boolean {
  return muted
}

/** 确保 AudioContext 在用户交互后被激活 */
export function initAudio() {
  getContext()
}
