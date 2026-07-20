<script setup lang="ts">
/**
 * Day 18: 任务管理页面
 * - 任务CRUD + 拖拽排序（HTML5 Drag & Drop）
 * - 状态切换（TODO / IN_PROGRESS / DONE）
 * - 筛选（全部 / 待办 / 进行中 / 已完成）
 * - 关联番茄计数
 */
import { ref, computed, onMounted } from 'vue'
import { taskApi } from '../api'
import type { Task } from '../api/types'

const tasks = ref<Task[]>([])
const loading = ref(true)
const filter = ref<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL')
const showCreate = ref(false)
const newTaskTitle = ref('')

// 拖拽状态
const dragIndex = ref<number | null>(null)

const statusLabels: Record<string, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  DONE: '已完成',
}

const statusColors: Record<string, string> = {
  TODO: '#888',
  IN_PROGRESS: '#FF9800',
  DONE: '#4CAF50',
}

const priorityLabels: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

const priorityColors: Record<string, string> = {
  HIGH: '#E91E63',
  MEDIUM: '#FF9800',
  LOW: '#4A90D9',
}

onMounted(async () => {
  await loadTasks()
})

async function loadTasks() {
  loading.value = true
  try {
    tasks.value = await taskApi.list()
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

const filteredTasks = computed(() => {
  if (filter.value === 'ALL') return tasks.value
  return tasks.value.filter(t => t.spec.status === filter.value)
})

async function createTask() {
  if (!newTaskTitle.value.trim()) return
  try {
    await taskApi.create({
      spec: {
        title: newTaskTitle.value.trim(),
        priority: 'MEDIUM',
        status: 'TODO',
        estimatedPomos: 0,
        pomodoroCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any)
    newTaskTitle.value = ''
    showCreate.value = false
    await loadTasks()
  } catch (e) {
    console.error('Failed to create task:', e)
  }
}

async function cycleStatus(task: Task) {
  const order: Array<'TODO' | 'IN_PROGRESS' | 'DONE'> = ['TODO', 'IN_PROGRESS', 'DONE']
  const idx = order.indexOf(task.spec.status)
  const nextStatus = order[(idx + 1) % order.length]
  try {
    await taskApi.update(task.metadata.name, {
      spec: { ...task.spec, status: nextStatus, updatedAt: new Date().toISOString() },
    } as any)
    task.spec.status = nextStatus
  } catch (e) {
    console.error('Failed to update task status:', e)
  }
}

async function deleteTask(task: Task) {
  try {
    await taskApi.delete(task.metadata.name)
    tasks.value = tasks.value.filter(t => t.metadata.name !== task.metadata.name)
  } catch (e) {
    console.error('Failed to delete task:', e)
  }
}

async function incrementPomodoro(task: Task) {
  try {
    const updated = await taskApi.incrementPomodoro(task.metadata.name)
    task.spec.pomodoroCount = updated.spec.pomodoroCount
  } catch (e) {
    console.error('Failed to increment pomodoro:', e)
  }
}

// 拖拽排序
function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return

  const dragged = filteredTasks.value[dragIndex.value]
  const target = filteredTasks.value[targetIndex]
  if (!dragged || !target) {
    dragIndex.value = null
    return
  }

  // 在原 tasks 数组中定位拖拽项和目标项
  const allItems = [...tasks.value]
  const draggedGlobalIdx = allItems.findIndex(t => t.metadata.name === dragged.metadata.name)
  const targetGlobalIdx = allItems.findIndex(t => t.metadata.name === target.metadata.name)

  if (draggedGlobalIdx === -1 || targetGlobalIdx === -1) {
    dragIndex.value = null
    return
  }

  const [moved] = allItems.splice(draggedGlobalIdx, 1)
  // 删除后索引可能偏移，重新定位
  const newTargetIdx = allItems.findIndex(t => t.metadata.name === target.metadata.name)
  allItems.splice(newTargetIdx + (draggedGlobalIdx < targetGlobalIdx ? 0 : 1), 0, moved)
  tasks.value = allItems

  dragIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
}

const stats = computed(() => {
  const total = tasks.value.length
  const todo = tasks.value.filter(t => t.spec.status === 'TODO').length
  const inProgress = tasks.value.filter(t => t.spec.status === 'IN_PROGRESS').length
  const done = tasks.value.filter(t => t.spec.status === 'DONE').length
  return { total, todo, inProgress, done }
})
</script>

<template>
  <div class="tasks-page">
    <div class="tasks-header">
      <h2>任务管理</h2>
      <button class="btn-create" @click="showCreate = !showCreate">
        {{ showCreate ? '取消' : '+ 新建任务' }}
      </button>
    </div>

    <!-- 新建表单 -->
    <div v-if="showCreate" class="create-bar">
      <input
        v-model="newTaskTitle"
        type="text"
        placeholder="输入任务标题，按回车创建..."
        class="task-input"
        @keyup.enter="createTask"
      />
      <button class="btn-add" @click="createTask" :disabled="!newTaskTitle.trim()">添加</button>
    </div>

    <!-- 统计条 -->
    <div class="stats-bar">
      <span>总计 {{ stats.total }}</span>
      <span class="stat-todo">待办 {{ stats.todo }}</span>
      <span class="stat-progress">进行中 {{ stats.inProgress }}</span>
      <span class="stat-done">已完成 {{ stats.done }}</span>
    </div>

    <!-- 筛选 tabs -->
    <div class="filter-tabs">
      <button
        v-for="f in (['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const)"
        :key="f"
        class="filter-tab"
        :class="{ active: filter === f }"
        @click="filter = f"
      >
        {{ f === 'ALL' ? '全部' : statusLabels[f] }}
      </button>
    </div>

    <!-- 任务列表 -->
    <div v-if="loading" class="loading-state">加载中...</div>

    <div v-else-if="filteredTasks.length === 0" class="empty-state">
      <p>{{ filter === 'ALL' ? '暂无任务，创建一个吧' : '没有该状态的任务' }}</p>
    </div>

    <div v-else class="task-list">
      <div
        v-for="(task, index) in filteredTasks"
        :key="task.metadata.name"
        class="task-item"
        :class="{
          dragging: dragIndex === index,
          done: task.spec.status === 'DONE',
        }"
        :draggable="filter === 'ALL' || filter === 'TODO'"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver"
        @drop="onDrop(index)"
        @dragend="onDragEnd"
      >
        <div class="task-main" @click="cycleStatus(task)">
          <span class="status-dot" :style="{ backgroundColor: statusColors[task.spec.status] }"></span>
          <span class="task-title" :class="{ completed: task.spec.status === 'DONE' }">
            {{ task.spec.title }}
          </span>
          <span class="priority-badge" :style="{ backgroundColor: priorityColors[task.spec.priority], color: '#fff' }">
            {{ priorityLabels[task.spec.priority] }}
          </span>
        </div>
        <div class="task-meta">
          <span class="task-status" :style="{ color: statusColors[task.spec.status] }">
            {{ statusLabels[task.spec.status] }}
          </span>
          <span class="task-pomos" @click.stop="incrementPomodoro(task)">
            🍅 {{ task.spec.pomodoroCount }}
          </span>
          <button class="btn-delete" @click.stop="deleteTask(task)">🗑</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-page { padding: 24px; max-width: 700px; margin: 0 auto; }
.tasks-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tasks-header h2 { font-size: 22px; color: var(--ht-text, #333); margin: 0; }
.btn-create {
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--ht-primary, #4A90D9);
  background: var(--ht-primary, #4A90D9); color: #fff; cursor: pointer; font-size: 14px;
}
.btn-create:hover { opacity: .9; }

.create-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.task-input {
  flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--ht-border-light, #ddd);
  font-size: 14px; outline: none; background: var(--ht-bg, #fff); color: var(--ht-text, #333);
}
.task-input:focus { border-color: var(--ht-primary, #4A90D9); }
.btn-add {
  padding: 10px 20px; border-radius: 8px; border: none;
  background: var(--ht-primary, #4A90D9); color: #fff; cursor: pointer; font-size: 14px;
}
.btn-add:disabled { opacity: .5; cursor: not-allowed; }

.stats-bar {
  display: flex; gap: 16px; font-size: 12px; color: var(--ht-text-tertiary, #888); margin-bottom: 12px;
}
.stat-todo { color: var(--ht-text-tertiary, #888); }
.stat-progress { color: #FF9800; }
.stat-done { color: var(--ht-success, #4CAF50); }

.filter-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
.filter-tab {
  padding: 6px 14px; border-radius: 16px; border: 1px solid var(--ht-border-light, #ddd);
  background: var(--ht-bg, #fff); cursor: pointer; font-size: 13px; transition: all .2s;
  color: var(--ht-text-secondary, #666);
}
.filter-tab:hover { border-color: var(--ht-primary, #4A90D9); }
.filter-tab.active {
  background: var(--ht-primary, #4A90D9); color: #fff; border-color: transparent;
}

.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-radius: 10px; background: var(--ht-bg, #fff);
  border: 1px solid var(--ht-border, #eee); transition: all .2s; cursor: grab;
}
.task-item:hover { box-shadow: 0 2px 8px var(--ht-shadow, rgba(0,0,0,.06)); }
.task-item.dragging { opacity: .5; border-style: dashed; }
.task-item.done { opacity: .6; }
.task-main { display: flex; align-items: center; gap: 10px; flex: 1; cursor: pointer; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.task-title { font-size: 15px; color: var(--ht-text, #333); }
.task-title.completed { text-decoration: line-through; color: var(--ht-text-muted, #aaa); }
.priority-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500;
}
.task-meta { display: flex; align-items: center; gap: 12px; }
.task-status { font-size: 12px; color: var(--ht-text-tertiary, #888); }
.task-pomos {
  font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 6px;
  background: var(--ht-bg-secondary, #f5f5f5); transition: transform .15s;
}
.task-pomos:hover { transform: scale(1.1); }
.btn-delete {
  border: none; background: none; cursor: pointer; font-size: 14px;
  opacity: .3; transition: opacity .2s; color: var(--ht-text-secondary, #666);
}
.btn-delete:hover { opacity: 1; }

.loading-state, .empty-state { text-align: center; padding: 40px; color: var(--ht-text-muted, #999); }
</style>
