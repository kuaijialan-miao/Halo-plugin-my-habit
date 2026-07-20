<!--
  Day 12: PomodoroTimer.vue — 完整番茄钟组件

  组件职责：
  1. 集成 ProgressRing + usePomodoro 编排层
  2. 三模式视觉风格（专注红 / 短休绿 / 长休蓝）
  3. 控制按钮组（开始/暂停/继续/跳过/重置）
  4. 今日番茄计数显示
-->

<template>
  <div class="pomodoro-timer">
    <!-- 模式指示器 -->
    <div class="mode-indicator">
      <button
        v-for="mode in modes"
        :key="mode.key"
        :class="['mode-btn', { active: state === mode.key }]"
        @click="switchMode(mode.key)"
      >
        {{ mode.label }}
      </button>
    </div>

    <!-- 进度环 + 倒计时 -->
    <div class="timer-display">
      <ProgressRing
        :progress="progress"
        :size="260"
        :stroke-width="8"
        :color="currentColor"
        :use-gradient="true"
        :gradient-start="currentColor"
        :gradient-end="currentGradientEnd"
        gradient-id="timer-gradient"
      >
        <div class="timer-text">
          <span class="time">{{ formattedTime }}</span>
          <span class="state-label">{{ stateLabel }}</span>
        </div>
      </ProgressRing>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <template v-if="state === 'IDLE'">
        <button class="btn btn-primary" @click="startFocus">
          <span class="btn-icon">▶</span> 开始专注
        </button>
      </template>

      <template v-else-if="state === 'PAUSED'">
        <button class="btn btn-success" @click="resume">
          <span class="btn-icon">▶</span> 继续
        </button>
        <button class="btn btn-warning" @click="skip">
          <span class="btn-icon">⏭</span> 跳过
        </button>
        <button class="btn btn-ghost" @click="reset">
          <span class="btn-icon">⏹</span> 结束
        </button>
      </template>

      <template v-else>
        <button class="btn btn-warning" @click="pause">
          <span class="btn-icon">⏸</span> 暂停
        </button>
        <button class="btn btn-ghost" @click="skip">
          <span class="btn-icon">⏭</span> 跳过
        </button>
      </template>

      <button
        class="btn btn-ghost btn-sm"
        :title="muted ? '取消静音' : '静音'"
        @click="toggleMute"
      >
        <span class="btn-icon">{{ muted ? '🔇' : '🔊' }}</span>
      </button>
    </div>

    <!-- 今日统计 -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-value">{{ totalFocusToday }}</span>
        <span class="stat-label">今日番茄</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ focusCount }} / {{ longBreakInterval }}</span>
        <span class="stat-label">当前轮次</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ProgressRing from './ProgressRing.vue'
import { usePomodoro, type UsePomodoroReturn } from '../composables/usePomodoro'
import type { PomodoroState } from '../composables/pomodoroStateMachine'
import { DEFAULT_CONFIG } from '../composables/pomodoroStateMachine'

const emit = defineEmits<{
  (e: 'focusComplete', count: number): void
  (e: 'stateChange', state: PomodoroState): void
}>()

const longBreakInterval = DEFAULT_CONFIG.longBreakInterval

const pomodoro: UsePomodoroReturn = usePomodoro()

const {
  state,
  progress,
  formattedTime,
  focusCount,
  totalFocusToday,
  startFocus,
  pause,
  resume,
  skip,
  reset,
  toggleMute,
  muted,
} = pomodoro

// 模式配置
const modes = [
  { key: 'FOCUS' as PomodoroState, label: '专注' },
  { key: 'SHORT_BREAK' as PomodoroState, label: '短休' },
  { key: 'LONG_BREAK' as PomodoroState, label: '长休' },
]

const stateColorMap: Record<string, { color: string; end: string; label: string }> = {
  IDLE:      { color: '#e74c3c', end: '#e74c3c', label: '准备就绪' },
  FOCUS:     { color: '#e74c3c', end: '#f39c12', label: '专注中' },
  SHORT_BREAK:{ color: '#27ae60', end: '#2ecc71', label: '短休中' },
  LONG_BREAK: { color: '#2980b9', end: '#3498db', label: '长休中' },
  PAUSED:    { color: '#95a5a6', end: '#bdc3c7', label: '已暂停' },
}

const currentColor = computed(() => stateColorMap[state.value]?.color || '#e74c3c')
const currentGradientEnd = computed(() => stateColorMap[state.value]?.end || '#f39c12')
const stateLabel = computed(() => stateColorMap[state.value]?.label || '')

function switchMode(mode: PomodoroState) {
  if (mode === 'FOCUS' && state.value !== 'FOCUS' && state.value !== 'PAUSED') {
    startFocus()
  }
  // 休息模式由状态机自动切换，手动仅触发专注
}
</script>

<style scoped>
.pomodoro-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
  max-width: 360px;
  margin: 0 auto;
}

.mode-indicator {
  display: flex;
  gap: 4px;
  background: #f0f0f0;
  border-radius: 10px;
  padding: 4px;
}

.mode-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  color: #666;
  transition: all 0.2s;
}

.mode-btn.active {
  background: #fff;
  color: #333;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.timer-display {
  display: flex;
  justify-content: center;
}

.timer-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.time {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.state-label {
  font-size: 12px;
  color: #999;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon {
  font-size: 14px;
}

.btn-primary {
  background: #e74c3c;
  color: #fff;
}
.btn-primary:hover {
  background: #c0392b;
}

.btn-success {
  background: #27ae60;
  color: #fff;
}
.btn-success:hover {
  background: #219a52;
}

.btn-warning {
  background: #f39c12;
  color: #fff;
}
.btn-warning:hover {
  background: #d68910;
}

.btn-ghost {
  background: #f5f5f5;
  color: #666;
}
.btn-ghost:hover {
  background: #e8e8e8;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 16px;
}

.stats {
  display: flex;
  gap: 32px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  width: 100%;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
