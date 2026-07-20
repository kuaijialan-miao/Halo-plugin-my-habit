<script setup lang="ts">
/**
 * Day 16: 日历热力图组件
 * 展示习惯全年的打卡热力图（类似 GitHub contribution graph）
 */
import { ref, computed, watch, onMounted } from 'vue'
import { checkInApi } from '../api'

const props = defineProps<{
  habitName: string
}>()

interface HeatmapCell {
  date: string
  dayOfWeek: number
  weekIndex: number
  count: number
  level: number // 0-4
}

const cells = ref<HeatmapCell[]>([])
const loading = ref(false)

// 展示最近 52 周（约一年）
const TOTAL_WEEKS = 52
const DAYS_PER_WEEK = 7

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const weekDayLabels = ['', '一', '', '三', '', '五', '']

async function loadData() {
  loading.value = true
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // 往前推 364 天（52 周），从今天开始倒推
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - TOTAL_WEEKS * DAYS_PER_WEEK + 1)

    // 构建日期到周索引的映射
    const dateMap = new Map<string, { dayOfWeek: number; weekIndex: number }>()
    const cursor = new Date(startDate)
    for (let w = 0; w < TOTAL_WEEKS; w++) {
      for (let d = 0; d < DAYS_PER_WEEK; d++) {
        const dateStr = formatDate(cursor)
        // 跳过未来日期
        if (cursor.getTime() <= today.getTime()) {
          dateMap.set(dateStr, { dayOfWeek: d, weekIndex: w })
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    // 加载打卡数据
    const checkins = await checkInApi.list(props.habitName)
    const countMap = new Map<string, number>()
    for (const c of checkins) {
      const d = c.spec.checkDate
      countMap.set(d, (countMap.get(d) || 0) + 1)
    }

    // 构建 cells
    const result: HeatmapCell[] = []
    for (const [date, pos] of dateMap) {
      const count = countMap.get(date) || 0
      result.push({
        date,
        dayOfWeek: pos.dayOfWeek,
        weekIndex: pos.weekIndex,
        count,
        level: getLevel(count),
      })
    }
    cells.value = result
  } catch {
    cells.value = []
  } finally {
    loading.value = false
  }
}

// 按列（周）组织
const weeks = computed(() => {
  const cols: HeatmapCell[][] = Array.from({ length: TOTAL_WEEKS }, () => [])
  for (const cell of cells.value) {
    cols[cell.weekIndex][cell.dayOfWeek] = cell
  }
  return cols
})

// 月份标签
const monthLabels = computed(() => {
  const labels: { label: string; weekIndex: number }[] = []
  let lastMonth = ''
  for (const cell of cells.value) {
    if (cell.dayOfWeek === 0) {
      const month = cell.date.slice(5, 7)
      if (month !== lastMonth) {
        lastMonth = month
        labels.push({ label: `${parseInt(month)}月`, weekIndex: cell.weekIndex })
      }
    }
  }
  return labels
})

const levelColors = [
  'var(--halo-bg-secondary, #ebedf0)',
  '#c6e48b',
  '#7bc96f',
  '#239a3b',
  '#196127',
]

onMounted(() => { loadData() })

watch(() => props.habitName, () => { loadData() })
</script>

<template>
  <div class="heatmap-wrapper">
    <div v-if="loading" class="heatmap-loading">加载中...</div>
    <div v-else-if="cells.length === 0" class="heatmap-empty">暂无打卡数据</div>
    <div v-else class="heatmap-container">
      <div class="heatmap-header">
        <span
          v-for="(ml, i) in monthLabels"
          :key="i"
          class="month-label"
          :style="{ gridColumn: ml.weekIndex + 2 }"
        >{{ ml.label }}</span>
      </div>
      <div class="heatmap-body">
        <div class="day-labels">
          <span v-for="(label, i) in weekDayLabels" :key="i" class="day-label">{{ label }}</span>
        </div>
        <div class="heatmap-grid">
          <div
            v-for="(col, wi) in weeks"
            :key="wi"
            class="heatmap-col"
          >
            <div
              v-for="(cell, di) in col"
              :key="di"
              class="heatmap-cell"
              :style="{ backgroundColor: levelColors[cell?.level || 0] }"
              :title="cell ? `${cell.date}: ${cell.count} 次` : ''"
            ></div>
          </div>
        </div>
      </div>
      <div class="heatmap-legend">
        <span>少</span>
        <span
          v-for="(color, i) in levelColors"
          :key="i"
          class="legend-cell"
          :style="{ backgroundColor: color }"
        ></span>
        <span>多</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-wrapper { margin-top: 12px; }
.heatmap-loading, .heatmap-empty {
  text-align: center; color: var(--ht-text-muted, #999); font-size: 13px; padding: 20px;
}
.heatmap-container { overflow-x: auto; }
.heatmap-header {
  display: grid;
  grid-template-columns: 30px repeat(52, 1fr);
  margin-bottom: 2px;
}
.month-label { font-size: 11px; color: var(--ht-text-tertiary, #888); }
.heatmap-body { display: flex; gap: 2px; }
.day-labels { display: flex; flex-direction: column; gap: 3px; width: 24px; padding-top: 1px; }
.day-label { font-size: 10px; color: var(--ht-text-muted, #aaa); line-height: 12px; height: 12px; }
.heatmap-grid { display: flex; gap: 3px; }
.heatmap-col { display: flex; flex-direction: column; gap: 3px; }
.heatmap-cell {
  width: 12px; height: 12px; border-radius: 2px;
  transition: transform .1s;
}
.heatmap-cell:hover { transform: scale(1.3); }
.heatmap-legend {
  display: flex; align-items: center; gap: 3px; justify-content: flex-end;
  font-size: 11px; color: var(--ht-text-tertiary, #888); margin-top: 8px;
}
.legend-cell { width: 12px; height: 12px; border-radius: 2px; }
</style>
