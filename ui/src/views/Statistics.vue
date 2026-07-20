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
    await loadTrendData()
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

async function loadTrendData() {
  const today = new Date()
  const dayMap = new Map<string, number>()

  // 汇总所有习惯近 30 天的打卡
  for (const habit of habits.value) {
    try {
      const checkins = await checkInApi.list(habit.spec.name)
      for (const c of checkins) {
        const d = c.spec.checkDate
        dayMap.set(d, (dayMap.get(d) || 0) + 1)
      }
    } catch {}
  }

  const data: TrendPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    data.push({ date: dateStr, count: dayMap.get(dateStr) || 0 })
  }
  trend30Days.value = data
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

// ========== SVG 折线趋势图 (Day 23) ==========

interface TrendPoint {
  date: string
  count: number
}

const trend30Days = ref<TrendPoint[]>([])

const chartConfig = computed(() => {
  const data = trend30Days.value
  if (!data.length) return null

  const W = 740
  const H = 180
  const PAD_L = 36
  const PAD_R = 12
  const PAD_T = 12
  const PAD_B = 28
  const PLOT_W = W - PAD_L - PAD_R
  const PLOT_H = H - PAD_T - PAD_B

  const maxVal = Math.max(...data.map(d => d.count), 1)
  const yMax = Math.ceil(maxVal * 1.2) || 5

  const points = data.map((d, i) => {
    const x = PAD_L + (i / (data.length - 1)) * PLOT_W
    const y = PAD_T + PLOT_H - (d.count / yMax) * PLOT_H
    return { x, y, ...d }
  })

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  // 生成 Y 轴刻度
  const yTicks = [0, Math.round(yMax / 2), yMax]

  // 生成 X 轴标签（每 5 天一个）
  const xLabels = data
    .map((d, i) => ({ label: d.date.slice(5), index: i }))
    .filter((_, i) => i % 5 === 0 || i === data.length - 1)

  return { W, H, PAD_L, PAD_R, PAD_T, PAD_B, PLOT_W, PLOT_H, points, polyline, yTicks, xLabels, yMax }
})

const chartHover = ref<{ x: number; y: number; date: string; count: number } | null>(null)

function showTooltip(pt: TrendPoint & { x: number; y: number }) {
  chartHover.value = { x: pt.x, y: pt.y, date: pt.date, count: pt.count }
}
function hideTooltip() {
  chartHover.value = null
}

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
      <!-- 打卡趋势折线图 (Day 23) -->
      <section class="section" v-if="chartConfig">
        <h3>打卡趋势（近 30 天）</h3>
        <div class="trend-chart">
          <svg
            :viewBox="`0 0 ${chartConfig.W} ${chartConfig.H}`"
            class="trend-svg"
            @mouseleave="hideTooltip"
          >
            <!-- 网格线 -->
            <line
              v-for="tick in chartConfig.yTicks"
              :key="'grid-' + tick"
              :x1="chartConfig.PAD_L"
              :x2="chartConfig.W - chartConfig.PAD_R"
              :y1="chartConfig.PAD_T + chartConfig.PLOT_H - (tick / chartConfig.yMax) * chartConfig.PLOT_H"
              :y2="chartConfig.PAD_T + chartConfig.PLOT_H - (tick / chartConfig.yMax) * chartConfig.PLOT_H"
              class="grid-line"
            />
            <!-- Y 轴刻度 -->
            <text
              v-for="tick in chartConfig.yTicks"
              :key="'y-' + tick"
              :x="chartConfig.PAD_L - 6"
              :y="chartConfig.PAD_T + chartConfig.PLOT_H - (tick / chartConfig.yMax) * chartConfig.PLOT_H + 4"
              class="y-label"
            >{{ tick }}</text>

            <!-- 折线 -->
            <polyline
              :points="chartConfig.polyline"
              class="trend-line"
            />

            <!-- 数据点 -->
            <circle
              v-for="(pt, idx) in chartConfig.points"
              :key="'dot-' + idx"
              :cx="pt.x"
              :cy="pt.y"
              r="3"
              class="trend-dot"
              :class="{ 'has-value': pt.count > 0 }"
              @mouseenter="showTooltip(pt)"
            />

            <!-- Tooltip -->
            <g v-if="chartHover">
              <rect
                :x="chartHover.x - 36"
                :y="chartHover.y - 32"
                width="72"
                height="22"
                rx="4"
                class="tooltip-bg"
              />
              <text
                :x="chartHover.x"
                :y="chartHover.y - 16"
                class="tooltip-text"
              >{{ chartHover.date }}: {{ chartHover.count }}次</text>
            </g>

            <!-- X 轴标签 -->
            <text
              v-for="xl in chartConfig.xLabels"
              :key="'xl-' + xl.index"
              :x="chartConfig.PAD_L + (xl.index / (chartConfig.points.length - 1)) * chartConfig.PLOT_W"
              :y="chartConfig.H - 6"
              class="x-label"
            >{{ xl.label }}</text>
          </svg>
        </div>
      </section>

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
.stats-page h2 { font-size: 22px; color: var(--ht-text, #333); margin: 0 0 20px; }

.overview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
.overview-card {
  background: var(--ht-bg-secondary, #f5f5f5); border-radius: 12px;
  padding: 16px; text-align: center;
}
.ov-value { font-size: 28px; font-weight: 700; color: var(--ht-primary, #4A90D9); }
.unit { font-size: 14px; font-weight: 400; }
.ov-label { font-size: 12px; color: var(--ht-text-tertiary, #888); margin-top: 4px; }

.section { margin-bottom: 28px; }
.section h3 { font-size: 16px; color: var(--ht-text-secondary, #444); margin-bottom: 12px; }
.section-badge { font-size: 12px; color: #fff; background: var(--ht-primary, #4A90D9); padding: 2px 8px; border-radius: 10px; font-weight: 400; }
.section-note, .empty-note { font-size: 13px; color: var(--ht-text-muted, #999); margin-top: 8px; }

/* 周热力图 */
.week-heatmap { display: flex; gap: 6px; }
.week-cell {
  flex: 1; height: 64px; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--ht-text-secondary, #555); transition: transform .15s;
}
.week-cell:hover { transform: translateY(-2px); }
.cell-weekday { font-size: 11px; }
.cell-count { font-size: 16px; font-weight: 600; }

/* 柱状图 */
.bar-chart {
  display: flex; gap: 2px; align-items: flex-end;
  height: 160px; background: var(--ht-bg-secondary, #f5f5f5);
  border-radius: 8px; padding: 8px 4px; overflow-x: auto;
}
.bar-col {
  flex: 1; min-width: 12px; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end; height: 100%;
}
.bar {
  width: 80%; border-radius: 3px 3px 0 0;
  background: var(--ht-primary, #4A90D9);
  min-height: 2px; position: relative; transition: height .3s;
  display: flex; align-items: flex-start; justify-content: center;
}
.bar-label { font-size: 8px; color: #fff; padding-top: 2px; }
.bar-date { font-size: 8px; color: var(--ht-text-muted, #aaa); margin-top: 4px; transform: rotate(-45deg); white-space: nowrap; }

.detail-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.detail-table th { text-align: left; padding: 8px 12px; color: var(--ht-text-tertiary, #888); font-weight: 500; border-bottom: 1px solid var(--ht-border, #eee); }
.detail-table td { padding: 8px 12px; border-bottom: 1px solid var(--ht-border, #f5f5f5); color: var(--ht-text, #333); }
.detail-table tr.empty { color: var(--ht-text-muted, #ccc); }

.loading-state { text-align: center; padding: 60px; color: var(--ht-text-muted, #999); }

/* SVG 折线图 (Day 23) */
.trend-chart {
  background: var(--ht-bg-secondary, #f5f5f5);
  border-radius: 10px;
  padding: 12px; overflow-x: auto;
}
.trend-svg {
  width: 100%; height: auto; display: block;
}
.grid-line {
  stroke: var(--ht-border, #e0e0e0);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}
.y-label {
  font-size: 10px; fill: var(--ht-text-muted, #999);
  text-anchor: end;
}
.x-label {
  font-size: 9px; fill: var(--ht-text-muted, #999);
  text-anchor: middle;
}
.trend-line {
  fill: none;
  stroke: var(--ht-primary, #4A90D9);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.trend-dot {
  fill: var(--ht-bg-secondary, #f5f5f5);
  stroke: var(--ht-primary, #4A90D9);
  stroke-width: 2;
  cursor: pointer;
  transition: r .15s;
}
.trend-dot:hover { r: 5; }
.trend-dot.has-value {
  fill: var(--ht-primary, #4A90D9);
  stroke: var(--ht-primary, #4A90D9);
}
.tooltip-bg {
  fill: var(--ht-text, #333);
  opacity: .85;
}
.tooltip-text {
  font-size: 10px; fill: #fff;
  text-anchor: middle;
}
</style>
