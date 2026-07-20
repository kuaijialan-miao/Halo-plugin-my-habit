<script setup lang="ts">
/**
 * Day 19: 统计页面数据可视化
 * - 本周/本月打卡统计
 * - 习惯打卡热力图（内联，复用 HeatmapCalendar 逻辑）
 * - 番茄钟趋势（7天/30天柱状图）
 * - 总览数字卡片
 */
import { ref, computed, onMounted } from 'vue'
import { habitApi, checkInApi, pomodoroApi, taskApi } from '../api'
import type { Habit, Pomodoro, Task } from '../api/types'

const loading = ref(true)
const habits = ref<Habit[]>([])
const pomodoros = ref<Pomodoro[]>([])
const tasks = ref<Task[]>([])

// 周打卡热力图数据
interface DayCell {
  date: string
  weekday: string
  count: number
  level: number
}

const weekCells = ref<DayCell[]>([])
const weekStats = ref({ total: 0, bestDay: '', bestCount: 0 })

// 番茄趋势数据
interface PomodoroDay {
  date: string
  count: number
  minutes: number
}

const pomodoroWeek = ref<PomodoroDay[]>([])
const pomodoroMonth = ref<PomodoroDay[]>([])

// 总体统计
const totalStats = ref({
  totalHabits: 0,
  totalCheckins: 0,
  totalFocus: 0,
  totalFocusMin: 0,
  totalTasks: 0,
  completedTasks: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    const [h, p, t] = await Promise.all([
      habitApi.list(),
      pomodoroApi.list(),
      taskApi.list(),
    ])
    habits.value = h
    pomodoros.value = p
    tasks.value = t

    await loadWeekData()
    await loadPomodoroTrends()
    computeTotals()
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    loading.value = false
  }
})

async function loadWeekData() {
  // 本周 7 天打卡汇总
  const today = new Date()
  const cells: DayCell[] = []
  const weekNames = ['日', '一', '二', '三', '四', '五', '六']

  // 获取所有习惯的所有打卡
  const allCheckins = new Map<string, number>() // date -> count
  for (const habit of habits.value) {
    try {
      const checkins = await checkInApi.list(habit.spec.name)
      for (const c of checkins) {
        const d = c.spec.checkDate
        allCheckins.set(d, (allCheckins.get(d) || 0) + 1)
      }
    } catch {}
  }

  let total = 0
  let bestDay = ''
  let bestCount = 0

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const count = allCheckins.get(dateStr) || 0
    total += count
    if (count > bestCount) {
      bestCount = count
      bestDay = `${d.getMonth() + 1}/${d.getDate()}`
    }
    cells.push({
      date: dateStr,
      weekday: weekNames[d.getDay()],
      count,
      level: count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4,
    })
  }

  weekCells.value = cells
  weekStats.value = { total, bestDay, bestCount }
}

async function loadPomodoroTrends() {
  const today = new Date()
  const dayMap = new Map<string, { count: number; minutes: number }>()

  for (const p of pomodoros.value) {
    if (p.spec.mode !== 'FOCUS' || !p.spec.endTime) continue
    const date = p.spec.startTime.slice(0, 10)
    const entry = dayMap.get(date) || { count: 0, minutes: 0 }
    entry.count++
    entry.minutes += Math.round((p.spec.duration || 1500) / 60)
    dayMap.set(date, entry)
  }

  // 最近 7 天
  const week: PomodoroDay[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const entry = dayMap.get(dateStr)
    week.push({ date: dateStr, count: entry?.count || 0, minutes: entry?.minutes || 0 })
  }
  pomodoroWeek.value = week

  // 最近 30 天
  const month: PomodoroDay[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const entry = dayMap.get(dateStr)
    month.push({ date: dateStr, count: entry?.count || 0, minutes: entry?.minutes || 0 })
  }
  pomodoroMonth.value = month
}

function computeTotals() {
  let checkins = 0
  for (let i = 0; i < 7; i++) {
    checkins += weekCells.value[i]?.count || 0
  }

  totalStats.value = {
    totalHabits: habits.value.length,
    totalCheckins: checkins,
    totalFocus: pomodoros.value.filter(p => p.spec.mode === 'FOCUS' && p.spec.endTime).length,
    totalFocusMin: pomodoros.value
      .filter(p => p.spec.mode === 'FOCUS' && p.spec.endTime)
      .reduce((sum, p) => sum + Math.round((p.spec.duration || 1500) / 60), 0),
    totalTasks: tasks.value.length,
    completedTasks: tasks.value.filter(t => t.spec.status === 'DONE').length,
  }
}

const heatLevelColors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']

const maxPomoCount = computed(() => {
  const all = pomodoroMonth.value.map(d => d.count)
  return Math.max(...all, 1)
})

// 格式化日期标签（月/日）
function formatLabel(dateStr: string): string {
  return dateStr.slice(5)
}

function barHeight(count: number): string {
  return `${Math.round((count / maxPomoCount.value) * 100)}%`
}
</script>

<template>
  <div class="stats-page">
    <h2>数据统计</h2>

    <!-- 总览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="ov-value">{{ totalStats.totalHabits }}</div>
        <div class="ov-label">习惯数</div>
      </div>
      <div class="overview-card">
        <div class="ov-value">{{ totalStats.totalCheckins }}</div>
        <div class="ov-label">本周打卡</div>
      </div>
      <div class="overview-card">
        <div class="ov-value">{{ totalStats.totalFocus }}<span class="unit">次</span></div>
        <div class="ov-label">累计番茄</div>
      </div>
      <div class="overview-card">
        <div class="ov-value">{{ totalStats.totalFocusMin }}<span class="unit">min</span></div>
        <div class="ov-label">累计专注</div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>

    <template v-else>
      <!-- 本周打卡热力图 -->
      <section class="section">
        <h3>本周打卡 <span class="section-badge">{{ weekStats.total }} 次</span></h3>
        <div class="week-heatmap">
          <div
            v-for="cell in weekCells"
            :key="cell.date"
            class="week-cell"
            :style="{ backgroundColor: heatLevelColors[cell.level] }"
            :title="`${cell.date} ${cell.weekday}: ${cell.count} 次`"
          >
            <span class="cell-weekday">{{ cell.weekday }}</span>
            <span class="cell-count">{{ cell.count || '-' }}</span>
          </div>
        </div>
        <p v-if="weekStats.bestDay" class="section-note">
          最佳日：{{ weekStats.bestDay }}，{{ weekStats.bestCount }} 次打卡
        </p>
      </section>

      <!-- 番茄趋势 -->
      <section class="section">
        <h3>番茄钟趋势（近 30 天）</h3>
        <div class="bar-chart">
          <div
            v-for="day in pomodoroMonth"
            :key="day.date"
            class="bar-col"
            :title="`${day.date}: ${day.count} 个番茄 (${day.minutes} min)`"
          >
            <div class="bar" :style="{ height: barHeight(day.count) }">
              <span v-if="day.count > 0" class="bar-label">{{ day.count }}</span>
            </div>
            <span class="bar-date">{{ formatLabel(day.date) }}</span>
          </div>
        </div>
      </section>

      <!-- 本周番茄明细 -->
      <section class="section">
        <h3>本周番茄明细</h3>
        <table class="detail-table" v-if="pomodoroWeek.some(d => d.count > 0)">
          <thead>
            <tr>
              <th>日期</th>
              <th>番茄数</th>
              <th>专注时长</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in pomodoroWeek" :key="day.date" :class="{ empty: day.count === 0 }">
              <td>{{ formatLabel(day.date) }}</td>
              <td>{{ day.count || '-' }}</td>
              <td>{{ day.minutes ? day.minutes + ' min' : '-' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-note">本周暂无番茄记录</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats-page { padding: 24px; max-width: 800px; margin: 0 auto; }
.stats-page h2 { font-size: 22px; color: #333; margin: 0 0 20px; }

.overview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
.overview-card {
  background: var(--halo-bg-secondary, #f5f5f5); border-radius: 12px;
  padding: 16px; text-align: center;
}
.ov-value { font-size: 28px; font-weight: 700; color: var(--halo-color-primary, #4A90D9); }
.unit { font-size: 14px; font-weight: 400; }
.ov-label { font-size: 12px; color: #888; margin-top: 4px; }

.section { margin-bottom: 28px; }
.section h3 { font-size: 16px; color: #444; margin-bottom: 12px; }
.section-badge { font-size: 12px; color: #fff; background: var(--halo-color-primary, #4A90D9); padding: 2px 8px; border-radius: 10px; font-weight: 400; }
.section-note, .empty-note { font-size: 13px; color: #999; margin-top: 8px; }

/* 周热力图 */
.week-heatmap { display: flex; gap: 6px; }
.week-cell {
  flex: 1; height: 64px; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #555; transition: transform .15s;
}
.week-cell:hover { transform: translateY(-2px); }
.cell-weekday { font-size: 11px; }
.cell-count { font-size: 16px; font-weight: 600; }

/* 柱状图 */
.bar-chart {
  display: flex; gap: 2px; align-items: flex-end;
  height: 160px; background: var(--halo-bg-secondary, #f5f5f5);
  border-radius: 8px; padding: 8px 4px; overflow-x: auto;
}
.bar-col {
  flex: 1; min-width: 12px; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end; height: 100%;
}
.bar {
  width: 80%; border-radius: 3px 3px 0 0;
  background: var(--halo-color-primary, #4A90D9);
  min-height: 2px; position: relative; transition: height .3s;
  display: flex; align-items: flex-start; justify-content: center;
}
.bar-label { font-size: 8px; color: #fff; padding-top: 2px; }
.bar-date { font-size: 8px; color: #aaa; margin-top: 4px; transform: rotate(-45deg); white-space: nowrap; }

.detail-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.detail-table th { text-align: left; padding: 8px 12px; color: #888; font-weight: 500; border-bottom: 1px solid #eee; }
.detail-table td { padding: 8px 12px; border-bottom: 1px solid #f5f5f5; }
.detail-table tr.empty { color: #ccc; }

.loading-state { text-align: center; padding: 60px; color: #999; }
</style>
