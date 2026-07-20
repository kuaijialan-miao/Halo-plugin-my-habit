<script setup lang="ts">
/**
 * Day 20: 设置页面
 * - 番茄钟时长配置（专注 / 短休息 / 长休息 / 长休息间隔）
 * - 音效开关
 * - 通知权限管理
 * - 数据导出（JSON 格式）
 * - 关于信息
 */
import { ref, onMounted, watch } from 'vue'
import { habitApi, checkInApi, pomodoroApi, taskApi } from '../api'
import { useTheme, type ThemeMode } from '../composables/useTheme'

// 设置项（从 localStorage 加载）
interface Settings {
  focusDuration: number       // 分钟
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number   // 几个 focus 后长休息
  soundEnabled: boolean
  notificationEnabled: boolean
  autoStartBreak: boolean
}

const defaultSettings: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  notificationEnabled: true,
  autoStartBreak: true,
}

const settings = ref<Settings>({ ...defaultSettings })
const saved = ref(false)
const exporting = ref(false)
const notifPermission = ref<NotificationPermission>('default')

const { theme, resolvedTheme, setTheme } = useTheme()

onMounted(() => {
  loadSettings()
  checkNotificationPermission()
})

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'auto' },
]

function loadSettings() {
  try {
    const raw = localStorage.getItem('habit-tracker-settings')
    if (raw) {
      settings.value = { ...defaultSettings, ...JSON.parse(raw) }
    }
  } catch {}
}

function saveSettings() {
  localStorage.setItem('habit-tracker-settings', JSON.stringify(settings.value))
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

watch(settings, () => { saved.value = false }, { deep: true })

async function checkNotificationPermission() {
  if ('Notification' in window) {
    notifPermission.value = Notification.permission
  }
}

async function requestNotifPermission() {
  if ('Notification' in window) {
    const result = await Notification.requestPermission()
    notifPermission.value = result
  }
}

async function exportData() {
  exporting.value = true
  try {
    const [habits, pomodoros, tasks] = await Promise.all([
      habitApi.list().catch(() => []),
      pomodoroApi.list().catch(() => []),
      taskApi.list().catch(() => []),
    ])

    // 遍历所有习惯收集完整打卡记录（后端 /checkins?habit= 无参仅返回当天）
    const checkins: Awaited<ReturnType<typeof checkInApi['list']>> = []
    for (const h of habits) {
      try {
        const list = await checkInApi.list(h.spec.name)
        checkins.push(...list)
      } catch {}
    }

    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      habits,
      checkins,
      pomodoros,
      tasks,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Export failed:', e)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="settings-page">
    <h2>设置</h2>

    <!-- 番茄钟时长 -->
    <section class="settings-section">
      <h3>番茄钟时长</h3>
      <div class="setting-grid">
        <div class="setting-item">
          <label>专注时长（分钟）</label>
          <div class="input-group">
            <button class="stepper" @click="settings.focusDuration = Math.max(1, settings.focusDuration - 5)">−</button>
            <input type="number" v-model.number="settings.focusDuration" min="1" max="120" class="num-input" />
            <button class="stepper" @click="settings.focusDuration = Math.min(120, settings.focusDuration + 5)">+</button>
          </div>
        </div>
        <div class="setting-item">
          <label>短休息时长（分钟）</label>
          <div class="input-group">
            <button class="stepper" @click="settings.shortBreakDuration = Math.max(1, settings.shortBreakDuration - 1)">−</button>
            <input type="number" v-model.number="settings.shortBreakDuration" min="1" max="30" class="num-input" />
            <button class="stepper" @click="settings.shortBreakDuration = Math.min(30, settings.shortBreakDuration + 1)">+</button>
          </div>
        </div>
        <div class="setting-item">
          <label>长休息时长（分钟）</label>
          <div class="input-group">
            <button class="stepper" @click="settings.longBreakDuration = Math.max(1, settings.longBreakDuration - 5)">−</button>
            <input type="number" v-model.number="settings.longBreakDuration" min="1" max="60" class="num-input" />
            <button class="stepper" @click="settings.longBreakDuration = Math.min(60, settings.longBreakDuration + 5)">+</button>
          </div>
        </div>
        <div class="setting-item">
          <label>长休息间隔（个番茄后）</label>
          <div class="input-group">
            <button class="stepper" @click="settings.longBreakInterval = Math.max(2, settings.longBreakInterval - 1)">−</button>
            <input type="number" v-model.number="settings.longBreakInterval" min="2" max="10" class="num-input" />
            <button class="stepper" @click="settings.longBreakInterval = Math.min(10, settings.longBreakInterval + 1)">+</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 音效与通知 -->
    <section class="settings-section">
      <h3>音效与通知</h3>
      <div class="toggle-list">
        <div class="toggle-item">
          <div>
            <span class="toggle-label">启用音效</span>
            <span class="toggle-desc">番茄开始/结束时的提示音</span>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="settings.soundEnabled" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="toggle-item">
          <div>
            <span class="toggle-label">桌面通知</span>
            <span class="toggle-desc">番茄完成时发送系统通知</span>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="settings.notificationEnabled" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="toggle-item">
          <div>
            <span class="toggle-label">自动进入休息</span>
            <span class="toggle-desc">专注结束后自动开始休息倒计时</span>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="settings.autoStartBreak" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="notif-status">
        <span>通知权限：{{ notifPermission === 'granted' ? '已授权' : notifPermission === 'denied' ? '已拒绝' : '未设置' }}</span>
        <button
          v-if="notifPermission !== 'granted'"
          class="btn-permission"
          @click="requestNotifPermission"
        >
          请求权限
        </button>
      </div>
    </section>

    <!-- 数据管理 -->
    <section class="settings-section">
      <h3>数据管理</h3>
      <button class="btn-export" @click="exportData" :disabled="exporting">
        {{ exporting ? '导出中...' : '导出所有数据 (JSON)' }}
      </button>
      <p class="export-hint">导出包含习惯、打卡记录、番茄记录和任务数据</p>
    </section>

    <!-- 保存按钮 -->
    <div class="save-bar">
      <button class="btn-save" @click="saveSettings">保存设置</button>
      <span v-if="saved" class="save-success">已保存</span>
    </div>

    <!-- 外观 -->
    <section class="settings-section">
      <h3>外观</h3>
      <div class="theme-selector">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          class="theme-option"
          :class="{ active: theme === opt.value }"
          @click="setTheme(opt.value)"
        >
          <span class="theme-icon">{{ opt.value === 'light' ? '☀️' : opt.value === 'dark' ? '🌙' : '🔄' }}</span>
          <span>{{ opt.label }}</span>
        </button>
      </div>
      <p class="theme-hint">当前生效：{{ resolvedTheme === 'dark' ? '深色模式' : '浅色模式' }}</p>
    </section>

    <!-- 关于 -->
    <section class="settings-section about-section">
      <h3>关于</h3>
      <p>Habit Tracker — Halo 自律打卡插件</p>
      <p class="version">Version 1.0.0 | Built with Vue 3 + TypeScript</p>
    </section>
  </div>
</template>

<style scoped>
.settings-page { padding: 24px; max-width: 640px; margin: 0 auto; }
.settings-page h2 { font-size: 22px; color: var(--ht-text, #333); margin: 0 0 24px; }

.settings-section {
  background: var(--ht-bg-secondary, #f5f5f5); border-radius: 12px;
  padding: 20px; margin-bottom: 20px;
}
.settings-section h3 { font-size: 16px; color: var(--ht-text-secondary, #444); margin: 0 0 16px; }

.setting-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.setting-item label { display: block; font-size: 13px; color: var(--ht-text-secondary, #666); margin-bottom: 8px; }
.input-group { display: flex; align-items: center; gap: 8px; }
.stepper {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--ht-border-light, #ddd);
  background: var(--ht-bg, #fff); cursor: pointer; font-size: 16px;
  color: var(--ht-text-secondary, #555);
  display: flex; align-items: center; justify-content: center;
}
.stepper:hover { background: var(--ht-bg-hover, #f0f0f0); }
.num-input {
  width: 60px; height: 32px; text-align: center; border-radius: 6px;
  border: 1px solid var(--ht-border-light, #ddd); font-size: 15px; font-weight: 600; outline: none;
  background: var(--ht-bg, #fff); color: var(--ht-text, #333);
}
.num-input:focus { border-color: var(--ht-primary, #4A90D9); }

/* Toggle Switch */
.toggle-list { display: flex; flex-direction: column; gap: 14px; }
.toggle-item { display: flex; justify-content: space-between; align-items: center; }
.toggle-label { font-size: 14px; color: var(--ht-text, #333); display: block; }
.toggle-desc { font-size: 12px; color: var(--ht-text-muted, #999); display: block; margin-top: 2px; }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background: #ccc; border-radius: 24px; transition: .3s;
}
.slider:before {
  content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px;
  background: #fff; border-radius: 50%; transition: .3s;
}
input:checked + .slider { background: var(--ht-primary, #4A90D9); }
input:checked + .slider:before { transform: translateX(20px); }

.notif-status {
  margin-top: 16px; display: flex; align-items: center; gap: 12px;
  font-size: 13px; color: var(--ht-text-tertiary, #888);
}
.btn-permission {
  padding: 6px 12px; border-radius: 6px; border: 1px solid var(--ht-primary, #4A90D9);
  color: var(--ht-primary, #4A90D9); background: var(--ht-bg, #fff); cursor: pointer; font-size: 12px;
}
.btn-permission:hover { background: var(--ht-primary-light, #e3f2fd); }

/* Theme Selector */
.theme-selector { display: flex; gap: 8px; }
.theme-option {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px; border-radius: 10px;
  border: 2px solid var(--ht-border-light, #ddd);
  background: var(--ht-bg, #fff); cursor: pointer; font-size: 13px;
  color: var(--ht-text-secondary, #666);
  transition: all .2s;
}
.theme-option:hover { border-color: var(--ht-primary, #4A90D9); }
.theme-option.active {
  border-color: var(--ht-primary, #4A90D9);
  background: var(--ht-primary-light, #e3f2fd);
  color: var(--ht-primary, #4A90D9);
}
.theme-icon { font-size: 22px; }
.theme-hint {
  margin-top: 10px; font-size: 12px; color: var(--ht-text-muted, #999);
}

.btn-export {
  padding: 10px 20px; border-radius: 8px; border: 1px solid var(--ht-primary, #4A90D9);
  background: var(--ht-bg, #fff); color: var(--ht-primary, #4A90D9); cursor: pointer;
  font-size: 14px; transition: all .2s;
}
.btn-export:hover { background: var(--ht-primary-light, #e3f2fd); }
.btn-export:disabled { opacity: .5; cursor: not-allowed; }
.export-hint { font-size: 12px; color: var(--ht-text-muted, #999); margin-top: 8px; }

.save-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.btn-save {
  padding: 12px 32px; border-radius: 8px; border: none;
  background: var(--ht-primary, #4A90D9); color: #fff; cursor: pointer;
  font-size: 15px; font-weight: 500;
}
.btn-save:hover { opacity: .9; }
.save-success { font-size: 14px; color: var(--ht-success, #4CAF50); }

.about-section { text-align: center; color: var(--ht-text-tertiary, #888); font-size: 14px; }
.about-section h3 { text-align: left; }
.version { font-size: 12px; color: var(--ht-text-muted, #bbb); }
</style>
