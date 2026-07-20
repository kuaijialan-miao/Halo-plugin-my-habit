<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { habitApi, checkInApi, pomodoroApi, taskApi } from '../api'
import type { Habit } from '../api/types'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import { useRetryableError, isNetworkError } from '../composables/useErrorHandler'

const loading = ref(true)
const { error, setError, clearError } = useRetryableError()
const habitCount = ref(0)
const todayCheckins = ref(0)
const todayFocusMin = ref(0)
const taskCount = ref(0)

// Day 24: 今日习惯快捷打卡
const habits = ref<Habit[]>([])
const todayCheckMap = ref<Record<string, boolean>>({})
const checkingIn = ref<Record<string, boolean>>({})

const todayStr = computed(() => {
  const d = new Date()
  return d.toISOString().slice(0, 10)
})

async function loadDashboard() {
  loading.value = true
  clearError()
  try {
    const [habitsList, checkins, pomodoros, tasks] = await Promise.all([
      habitApi.list(),
      checkInApi.list(),
      pomodoroApi.list(),
      taskApi.list(),
    ])
    habitCount.value = habitsList.length
    todayCheckins.value = checkins.length
    todayFocusMin.value = pomodoros
      .filter(p => p.spec.mode === 'FOCUS' && p.spec.endTime)
      .reduce((sum) => sum + 25, 0)
    taskCount.value = tasks.filter(t => t.spec.status !== 'DONE').length

    // Day 24: 加载今日打卡状态
    habits.value = habitsList
    for (const h of habitsList) {
      const exists = checkins.some(c => c.spec.habitName === h.spec.name && c.spec.checkDate === todayStr.value)
      todayCheckMap.value[h.spec.name] = exists
    }
  } catch (err) {
    setError(err)
    // 网络错误时保留骨架屏 UI，不吞掉错误信息
  } finally { loading.value = false }
}

onMounted(loadDashboard)

async function toggleCheckIn(habit: Habit) {
  const name = habit.spec.name
  if (checkingIn.value[name]) return
  checkingIn.value[name] = true
  try {
    if (todayCheckMap.value[name]) {
      // 找到今日打卡记录并删除
      const allCheckins = await checkInApi.list(name)
      const todayRecord = allCheckins.find(c => c.spec.checkDate === todayStr.value)
      if (todayRecord) {
        await checkInApi.delete(todayRecord.metadata.name)
      }
      todayCheckMap.value[name] = false
      todayCheckins.value = Math.max(0, todayCheckins.value - 1)
    } else {
      await checkInApi.create({ spec: { habitName: name, checkDate: todayStr.value, note: '', createdAt: new Date().toISOString() } })
      todayCheckMap.value[name] = true
      todayCheckins.value++
    }
  } finally {
    checkingIn.value[name] = false
  }
}
</script>

<template>
  <div class="dashboard">
    <!-- Day 31: 骨架屏加载状态 -->
    <template v-if="loading">
      <div class="stats-grid">
        <SkeletonLoader type="card" v-for="i in 4" :key="i" />
      </div>
      <SkeletonLoader type="list" :rows="3" />
    </template>

    <!-- Day 38: 错误状态 + 重试 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">&#9888;</div>
      <p class="error-msg">{{ error.message }}</p>
      <button v-if="error.retryable" class="retry-btn" @click="loadDashboard">重试</button>
    </div>

    <template v-else>
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

    <!-- Day 24: 今日习惯快捷打卡 -->
    <div class="quick-checkins" v-if="habits.length">
      <h3>今日打卡</h3>
      <div class="checkin-grid">
        <button
          v-for="h in habits"
          :key="h.spec.name"
          class="checkin-chip"
          :class="{ checked: todayCheckMap[h.spec.name], loading: checkingIn[h.spec.name] }"
          :style="{ '--habit-color': h.spec.color || '#4A90D9' }"
          :disabled="checkingIn[h.spec.name]"
          @click="toggleCheckIn(h)"
        >
          <span class="chip-icon">{{ h.spec.icon || '✅' }}</span>
          <span class="chip-name">{{ h.spec.name }}</span>
          <span class="chip-status">{{ todayCheckMap[h.spec.name] ? '✓' : '+' }}</span>
        </button>
      </div>
    </div>

    <div class="quick-links">
      <h3>快捷入口</h3>
      <nav class="link-grid" aria-label="功能快捷入口">
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
      </nav>
    </div>
    </template>
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

/* Day 24: 快捷打卡 */
.quick-checkins { margin-bottom: 28px; }
.quick-checkins h3 { font-size: 18px; margin-bottom: 12px; color: var(--ht-text, #333); }
.checkin-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.checkin-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px;
  border: 2px solid var(--ht-border-light, #ddd);
  background: var(--ht-bg, #fff);
  cursor: pointer; font-size: 14px;
  color: var(--ht-text-secondary, #666);
  transition: all .2s;
}
.checkin-chip:hover { border-color: var(--habit-color); }
.checkin-chip.checked {
  background: color-mix(in srgb, var(--habit-color) 15%, var(--ht-bg, #fff));
  border-color: var(--habit-color);
  color: var(--habit-color);
}
.checkin-chip.loading { opacity: .5; pointer-events: none; }
.chip-icon { font-size: 16px; }
.chip-name { font-weight: 500; }
.chip-status {
  font-size: 14px; font-weight: 700; margin-left: 2px;
}
.checked .chip-status { color: var(--habit-color); }

/* Day 38: 错误状态 */
.error-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--ht-text-secondary, #666);
}
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--ht-warning, #e6a23c);
}
.error-msg {
  font-size: 15px;
  margin-bottom: 20px;
}
.retry-btn {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 6px;
  border: 1px solid var(--ht-primary, #4A90D9);
  background: var(--ht-bg, #fff);
  color: var(--ht-primary, #4A90D9);
  cursor: pointer;
  font-size: 14px;
  transition: all .2s;
}
.retry-btn:hover {
  background: var(--ht-primary, #4A90D9);
  color: #fff;
}
</style>
