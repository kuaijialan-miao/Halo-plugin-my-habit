<script setup lang="ts">
/**
 * Day 15: 打卡按钮组件
 * 展示连续打卡天数 + 打卡/取消打卡交互 + 当天打卡状态
 */
import { ref, computed, watchEffect } from 'vue'
import { checkInApi } from '../api'
import type { Habit } from '../api/types'

const props = defineProps<{
  habit: Habit
}>()

const checkedInToday = ref(false)
const streak = ref(0)
const loading = ref(false)

async function refreshState() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const checkins = await checkInApi.list(props.habit.spec.name)
    checkedInToday.value = checkins.some(
      c => c.spec.checkDate === today
    )
    const streakResult = await checkInApi.streak(props.habit.spec.name)
    streak.value = streakResult.streak
  } catch { /* 后端未就绪 */ }
}

watchEffect(() => { refreshState() })

async function toggle() {
  if (loading.value) return
  loading.value = true
  try {
    if (checkedInToday.value) {
      // 查找今天的打卡记录并删除
      const today = new Date().toISOString().slice(0, 10)
      const checkins = await checkInApi.list(props.habit.spec.name)
      const todayCheckin = checkins.find(c => c.spec.checkDate === today)
      if (todayCheckin) {
        await checkInApi.delete(todayCheckin.metadata.name)
      }
      checkedInToday.value = false
    } else {
      await checkInApi.create({
        spec: {
          habitName: props.habit.spec.name,
          checkDate: new Date().toISOString().slice(0, 10),
          note: '',
          createdAt: new Date().toISOString(),
        },
      } as any)
      checkedInToday.value = true
    }
    // 刷新连续天数
    const streakResult = await checkInApi.streak(props.habit.spec.name)
    streak.value = streakResult.streak
  } catch (e) {
    console.error('Toggle check-in failed:', e)
  } finally {
    loading.value = false
  }
}

const streakLabel = computed(() => {
  if (streak.value === 0) return ''
  return `连续 ${streak.value} 天`
})
</script>

<template>
  <button
    class="checkin-btn"
    :class="{ checked: checkedInToday, loading }"
    :disabled="loading"
    @click="toggle"
  >
    <span class="checkin-icon">{{ checkedInToday ? '✅' : '○' }}</span>
    <span class="checkin-text">{{ checkedInToday ? '已打卡' : '打卡' }}</span>
    <span v-if="streakLabel" class="streak-badge">{{ streakLabel }}</span>
  </button>
</template>

<style scoped>
.checkin-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 20px; border: 2px solid #ddd;
  background: #fafafa; cursor: pointer; font-size: 14px;
  transition: all .2s; color: #666;
}
.checkin-btn:hover { border-color: var(--halo-color-primary, #4A90D9); color: var(--halo-color-primary, #4A90D9); }
.checkin-btn.checked {
  background: #e8f5e9; border-color: #4CAF50; color: #2E7D32;
}
.checkin-btn.loading { opacity: .6; pointer-events: none; }
.checkin-icon { font-size: 18px; }
.checkin-text { font-weight: 500; }
.streak-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  background: var(--halo-color-primary, #4A90D9); color: #fff;
}
.checked .streak-badge { background: #4CAF50; }
</style>
