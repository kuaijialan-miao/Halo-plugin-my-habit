<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { habitApi, checkInApi } from '../api'
import type { Habit } from '../api/types'

const habits = ref<Habit[]>([])
const streaks = ref<Record<string, number>>({})

onMounted(async () => {
  try {
    habits.value = await habitApi.list()
    const results = await Promise.allSettled(
      habits.value.map(h => checkInApi.streak(h.spec.name))
    )
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') streaks.value[habits.value[i].spec.name] = r.value.streak
    })
  } catch { /* 后端未就绪 */ }
})

function toggleCheckIn(habit: Habit) {
  // TODO: Week 3 实现完整打卡交互
}
</script>

<template>
  <div class="page-placeholder">
    <div class="placeholder-icon">📋</div>
    <h2>习惯打卡</h2>
    <p class="desc">坚持每日打卡，培养自律习惯</p>
    <p v-if="habits.length" class="habit-preview">
      已创建 {{ habits.length }} 个习惯
    </p>
    <p class="hint">即将在 Week 3 实现完整功能</p>
  </div>
</template>

<style scoped>
.page-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; color: #888;
}
.placeholder-icon { font-size: 64px; margin-bottom: 16px; }
h2 { font-size: 22px; color: #333; margin-bottom: 8px; }
.desc { font-size: 14px; margin-bottom: 8px; }
.habit-preview { font-size: 14px; color: var(--halo-color-primary, #4A90D9); margin-bottom: 8px; }
.hint { font-size: 12px; color: #bbb; }
</style>
