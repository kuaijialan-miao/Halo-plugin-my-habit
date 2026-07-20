<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { habitApi, checkInApi, pomodoroApi, taskApi } from '../api'

const habitCount = ref(0)
const todayCheckins = ref(0)
const todayFocusMin = ref(0)
const taskCount = ref(0)

onMounted(async () => {
  try {
    const [habits, checkins, pomodoros, tasks] = await Promise.all([
      habitApi.list(),
      checkInApi.list(),
      pomodoroApi.list(),
      taskApi.list(),
    ])
    habitCount.value = habits.length
    todayCheckins.value = checkins.length
    todayFocusMin.value = pomodoros
      .filter(p => p.spec.mode === 'FOCUS' && p.spec.endTime)
      .reduce((sum) => sum + 25, 0)
    taskCount.value = tasks.filter(t => t.spec.status !== 'DONE').length
  } catch { /* 后端未就绪 */ }
})
</script>

<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value">{{ habitCount }}</div>
        <div class="stat-label">进行中的习惯</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ todayCheckins }}</div>
        <div class="stat-label">今日打卡</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">{{ todayFocusMin }}<span class="unit">min</span></div>
        <div class="stat-label">今日专注</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-value">{{ taskCount }}</div>
        <div class="stat-label">待办任务</div>
      </div>
    </div>
    <div class="quick-links">
      <h3>快捷入口</h3>
      <div class="link-grid">
        <router-link to="/habit-tracker/pomodoro" class="link-card">
          <span class="link-icon">🍅</span><span>开始番茄钟</span>
        </router-link>
        <router-link to="/habit-tracker/habits" class="link-card">
          <span class="link-icon">📋</span><span>打卡签到</span>
        </router-link>
        <router-link to="/habit-tracker/tasks" class="link-card">
          <span class="link-icon">📝</span><span>管理任务</span>
        </router-link>
        <router-link to="/habit-tracker/stats" class="link-card">
          <span class="link-icon">📊</span><span>查看统计</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 24px; max-width: 960px; margin: 0 auto; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.stat-card {
  background: var(--ht-bg-secondary, #f5f5f5); border-radius: 12px;
  padding: 20px; text-align: center;
}
.stat-icon { font-size: 28px; margin-bottom: 8px; }
.stat-value { font-size: 32px; font-weight: 700; color: var(--ht-primary, #4A90D9); }
.unit { font-size: 14px; font-weight: 400; margin-left: 4px; }
.stat-label { font-size: 13px; color: var(--ht-text-tertiary, #888); margin-top: 4px; }
.quick-links h3 { font-size: 18px; margin-bottom: 12px; color: var(--ht-text, #333); }
.link-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.link-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: var(--ht-bg-secondary, #f5f5f5); border-radius: 10px; padding: 20px 12px;
  text-decoration: none; color: var(--ht-text-secondary, #666); transition: transform .15s;
}
.link-card:hover { transform: translateY(-2px); background: var(--ht-bg-hover, #f0f0f0); }
.link-icon { font-size: 32px; }
</style>
