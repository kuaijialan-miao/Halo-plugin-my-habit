<!--
  Pomodoro.vue — 番茄钟页面（Day 13 更新）

  变更：
  - 从占位页面升级为完整的 PomodoroTimer 组件集成
  - 接入 API 持久化（创建/完成番茄记录）
  - 展示历史番茄记录列表
-->

<template>
  <div class="pomodoro-page">
    <div class="page-header">
      <h2>番茄钟</h2>
      <p class="subtitle">番茄工作法 — 专注 25 分钟，休息 5 分钟</p>
    </div>

    <!-- 番茄钟计时器 -->
    <PomodoroTimer @focus-complete="onFocusComplete" />

    <!-- 今日统计 -->
    <div v-if="todayStats" class="today-summary">
      <div class="summary-card">
        <span class="summary-value">{{ todayStats.focusCount }}</span>
        <span class="summary-label">今日番茄</span>
      </div>
      <div class="summary-card">
        <span class="summary-value">{{ todayStats.totalFocusMinutes }}</span>
        <span class="summary-label">专注分钟</span>
      </div>
    </div>

    <!-- 历史番茄列表 -->
    <div class="history-section">
      <h3>最近番茄记录</h3>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="recentPomodoros.length === 0" class="empty">
        还没有番茄记录，开始你的第一个番茄吧！
      </div>
      <div v-else class="history-list">
        <div
          v-for="pomo in recentPomodoros"
          :key="pomo.metadata.name"
          class="history-item"
        >
          <div class="history-mode" :class="modeClass(pomo.spec.mode)">
            {{ modeLabel(pomo.spec.mode) }}
          </div>
          <div class="history-time">
            {{ formatTime(pomo.spec.startTime) }}
          </div>
          <div class="history-duration" v-if="pomo.spec.duration">
            {{ Math.floor(pomo.spec.duration / 60) }}分钟
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PomodoroTimer from '../components/PomodoroTimer.vue'
import { pomodoroApi } from '../api/pomodoro'
import type { Pomodoro, PomodoroTodayStats } from '../api/types'

const todayStats = ref<PomodoroTodayStats | null>(null)
const recentPomodoros = ref<Pomodoro[]>([])
const loading = ref(false)

const modeLabels: Record<string, string> = {
  FOCUS: '专注',
  SHORT_BREAK: '短休',
  LONG_BREAK: '长休',
}

const modeColors: Record<string, string> = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short-break',
  LONG_BREAK: 'long-break',
}

function modeLabel(mode: string): string {
  return modeLabels[mode] || mode
}

function modeClass(mode: string): string {
  return modeColors[mode] || ''
}

function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

async function loadTodayStats() {
  try {
    const stats = await pomodoroApi.todayStats()
    todayStats.value = stats
  } catch {
    // 后端不可用，静默处理
  }
}

async function loadRecentPomodoros() {
  loading.value = true
  try {
    const list = await pomodoroApi.list()
    recentPomodoros.value = list.slice(0, 10)
  } catch {
    recentPomodoros.value = []
  }
  loading.value = false
}

function onFocusComplete() {
  // 刷新今日统计和记录列表
  loadTodayStats()
  loadRecentPomodoros()
}

onMounted(() => {
  loadTodayStats()
  loadRecentPomodoros()
})
</script>

<style scoped>
.pomodoro-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 22px;
  color: #333;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.today-summary {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: center;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f8f8;
  border-radius: 12px;
  padding: 12px 24px;
  min-width: 80px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #e74c3c;
  line-height: 1.2;
}

.summary-label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.history-section {
  margin-top: 32px;
}

.history-section h3 {
  font-size: 15px;
  color: #333;
  margin: 0 0 12px;
}

.loading, .empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 24px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #fafafa;
  border-radius: 8px;
  font-size: 13px;
}

.history-mode {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  min-width: 36px;
  text-align: center;
}

.history-mode.focus {
  background: #fde8e8;
  color: #c0392b;
}

.history-mode.short-break {
  background: #d5f5e3;
  color: #1e8449;
}

.history-mode.long-break {
  background: #d6eaf8;
  color: #2471a3;
}

.history-time {
  color: #555;
  flex: 1;
}

.history-duration {
  color: #999;
  font-size: 12px;
}
</style>
