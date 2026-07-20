<script setup lang="ts">
/**
 * Day 15-16: 习惯打卡页面
 * - 习惯列表 + 打卡按钮 + 连续天数
 * - 日历热力图
 */
import { ref, onMounted } from 'vue'
import { habitApi, checkInApi } from '../api'
import type { Habit } from '../api/types'
import CheckInButton from '../components/CheckInButton.vue'
import HeatmapCalendar from '../components/HeatmapCalendar.vue'

const habits = ref<Habit[]>([])
const loading = ref(true)
const selectedHabit = ref<string>('')
const showCreate = ref(false)
const newHabit = ref({ name: '', icon: '📋', color: '#4A90D9', targetDays: 30 })

const iconOptions = ['📋', '🏃', '📚', '💧', '🧘', '🎯', '✍️', '💤', '🍎', '💪', '🎨', '🎵']
const colorOptions = ['#4A90D9', '#E91E63', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B']

onMounted(async () => {
  await loadHabits()
})

async function loadHabits() {
  loading.value = true
  try {
    habits.value = await habitApi.list()
    if (habits.value.length > 0 && !selectedHabit.value) {
      selectedHabit.value = habits.value[0].spec.name
    }
  } catch {
    habits.value = []
  } finally {
    loading.value = false
  }
}

async function createHabit() {
  if (!newHabit.value.name.trim()) return
  try {
    await habitApi.create({
      spec: {
        name: newHabit.value.name.trim(),
        icon: newHabit.value.icon,
        color: newHabit.value.color,
        targetDays: newHabit.value.targetDays,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any)
    showCreate.value = false
    newHabit.value = { name: '', icon: '📋', color: '#4A90D9', targetDays: 30 }
    await loadHabits()
  } catch (e) {
    console.error('Failed to create habit:', e)
  }
}

function selectIcon(icon: string) {
  newHabit.value.icon = icon
}

function selectColor(color: string) {
  newHabit.value.color = color
}

const currentHabit = computed(() =>
  habits.value.find(h => h.spec.name === selectedHabit.value) || null
)

function selectHabit(name: string) {
  selectedHabit.value = name
}
</script>

<template>
  <div class="habits-page">
    <!-- 顶部操作栏 -->
    <div class="habits-header">
      <h2>习惯打卡</h2>
      <button class="btn-create" @click="showCreate = !showCreate">
        {{ showCreate ? '取消' : '+ 新建习惯' }}
      </button>
    </div>

    <!-- 新建习惯表单 -->
    <div v-if="showCreate" class="create-form">
      <div class="form-row">
        <input
          v-model="newHabit.name"
          type="text"
          placeholder="习惯名称，如：每日阅读"
          class="name-input"
          @keyup.enter="createHabit"
        />
        <button class="btn-save" @click="createHabit" :disabled="!newHabit.name.trim()">
          创建
        </button>
      </div>
      <div class="form-row">
        <label class="form-label">图标</label>
        <div class="icon-picker">
          <button
            v-for="icon in iconOptions"
            :key="icon"
            class="icon-option"
            :class="{ active: newHabit.icon === icon }"
            @click="selectIcon(icon)"
          >{{ icon }}</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">颜色</label>
        <div class="color-picker">
          <button
            v-for="color in colorOptions"
            :key="color"
            class="color-option"
            :class="{ active: newHabit.color === color }"
            :style="{ backgroundColor: color }"
            @click="selectColor(color)"
          ></button>
        </div>
      </div>
    </div>

    <!-- 习惯列表 -->
    <div v-if="loading" class="loading-state">加载中...</div>

    <template v-else-if="habits.length > 0">
      <div class="habit-tabs">
        <button
          v-for="habit in habits"
          :key="habit.spec.name"
          class="habit-tab"
          :class="{ active: selectedHabit === habit.spec.name }"
          :style="{ '--tab-color': habit.spec.color }"
          @click="selectHabit(habit.spec.name)"
        >
          <span class="tab-icon">{{ habit.spec.icon }}</span>
          <span class="tab-name">{{ habit.spec.name }}</span>
        </button>
      </div>

      <!-- 当前选中的习惯详情 -->
      <div v-if="selectedHabit && currentHabit" class="habit-detail">
        <div class="habit-hero">
          <div class="habit-info">
            <span class="habit-icon-lg">{{ currentHabit.spec.icon }}</span>
            <div>
              <h3>{{ selectedHabit }}</h3>
              <p class="habit-target">
                目标 {{ currentHabit.spec.targetDays }} 天
              </p>
            </div>
          </div>
          <CheckInButton
            :habit="currentHabit"
            :key="selectedHabit"
          />
        </div>

        <!-- 热力图 -->
        <div class="heatmap-section">
          <h4>打卡记录</h4>
          <HeatmapCalendar :habit-name="selectedHabit" :key="selectedHabit" />
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-icon">📋</span>
      <p>还没有创建习惯，点击上方按钮开始吧</p>
    </div>
  </div>
</template>

<style scoped>
.habits-page { padding: 24px; max-width: 800px; margin: 0 auto; }
.habits-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.habits-header h2 { font-size: 22px; color: #333; margin: 0; }
.btn-create {
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--halo-color-primary, #4A90D9);
  background: var(--halo-color-primary, #4A90D9); color: #fff; cursor: pointer; font-size: 14px;
}
.btn-create:hover { opacity: .9; }

/* 新建表单 */
.create-form {
  background: var(--halo-bg-secondary, #f5f5f5); border-radius: 12px; padding: 20px;
  margin-bottom: 20px;
}
.form-row { margin-bottom: 14px; display: flex; align-items: center; gap: 12px; }
.form-label { font-size: 13px; color: #888; min-width: 40px; }
.name-input {
  flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid #ddd;
  font-size: 14px; outline: none;
}
.name-input:focus { border-color: var(--halo-color-primary, #4A90D9); }
.btn-save {
  padding: 10px 20px; border-radius: 8px; border: none;
  background: var(--halo-color-primary, #4A90D9); color: #fff; cursor: pointer;
  font-size: 14px;
}
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.icon-picker, .color-picker { display: flex; gap: 6px; flex-wrap: wrap; }
.icon-option {
  width: 36px; height: 36px; border-radius: 8px; border: 2px solid transparent;
  background: #fff; cursor: pointer; font-size: 18px; display: flex;
  align-items: center; justify-content: center;
}
.icon-option.active { border-color: var(--halo-color-primary, #4A90D9); background: #e3f2fd; }
.color-option {
  width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer;
}
.color-option.active { border-color: #333; transform: scale(1.15); }

/* Tabs */
.habit-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.habit-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px; border: 2px solid transparent;
  background: var(--halo-bg-secondary, #f5f5f5); cursor: pointer; font-size: 14px;
  transition: all .2s;
}
.habit-tab:hover { border-color: #ddd; }
.habit-tab.active {
  background: #fff; border-color: var(--tab-color, #4A90D9);
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}
.tab-icon { font-size: 16px; }
.tab-name { font-weight: 500; }

/* 习惯详情 */
.habit-hero {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px; background: #fff; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06); margin-bottom: 20px;
}
.habit-info { display: flex; align-items: center; gap: 14px; }
.habit-icon-lg { font-size: 40px; }
.habit-info h3 { font-size: 20px; color: #333; margin: 0; }
.habit-target { font-size: 13px; color: #888; margin: 4px 0 0; }
.heatmap-section { margin-top: 8px; }
.heatmap-section h4 { font-size: 15px; color: #555; margin-bottom: 8px; }

.loading-state, .empty-state {
  text-align: center; padding: 60px 20px; color: #999;
}
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
</style>
