<script setup lang="ts">
/**
 * Day 31: 骨架屏加载组件
 * 提供多种骨架屏变体，用于提升加载体验
 */
import { computed } from 'vue'

const props = defineProps<{
  /** 骨架屏类型 */
  type?: 'card' | 'list' | 'chart' | 'table' | 'text'
  /** 重复行数（list/table 类型有效） */
  rows?: number
}>()

/** 图表骨架屏柱子高度：首次渲染时随机生成并固定，避免重渲染时跳动 */
const barHeights = computed(() =>
  Array.from({ length: 7 }, () => 30 + Math.random() * 60)
)
</script>

<template>
  <!-- 卡片骨架 -->
  <div v-if="type === 'card' || !type" class="skel-card">
    <div class="skel-line skel-short"></div>
    <div class="skel-line skel-mid"></div>
    <div class="skel-line skel-long"></div>
  </div>

  <!-- 列表骨架 -->
  <div v-else-if="type === 'list'" class="skel-list">
    <div v-for="i in (rows || 4)" :key="i" class="skel-row">
      <div class="skel-avatar"></div>
      <div class="skel-row-content">
        <div class="skel-line skel-mid"></div>
        <div class="skel-line skel-short"></div>
      </div>
    </div>
  </div>

  <!-- 图表骨架 -->
  <div v-else-if="type === 'chart'" class="skel-chart">
    <div class="skel-line skel-short skel-chart-title"></div>
    <div class="skel-chart-area">
      <div class="skel-bar" v-for="(h, i) in barHeights" :key="i" :style="{ height: h + '%' }"></div>
    </div>
  </div>

  <!-- 表格骨架 -->
  <div v-else-if="type === 'table'" class="skel-table">
    <div class="skel-table-header">
      <div class="skel-line skel-short" v-for="i in 4" :key="i"></div>
    </div>
    <div v-for="i in (rows || 3)" :key="i" class="skel-table-row">
      <div class="skel-line skel-mid"></div>
      <div class="skel-line skel-short"></div>
      <div class="skel-line skel-mid"></div>
      <div class="skel-line skel-short"></div>
    </div>
  </div>

  <!-- 文本骨架 -->
  <div v-else-if="type === 'text'" class="skel-text">
    <div class="skel-line skel-long"></div>
    <div class="skel-line skel-long"></div>
    <div class="skel-line skel-mid"></div>
  </div>
</template>

<style scoped>
/* 骨架屏基础动画 */
.skel-card, .skel-row, .skel-chart, .skel-table, .skel-text {
  --skel-base: var(--ht-border, #e0e0e0);
  --skel-shine: var(--ht-bg-secondary, #f0f0f0);
}

.skel-line, .skel-avatar, .skel-bar {
  background: linear-gradient(90deg, var(--skel-base) 25%, var(--skel-shine) 50%, var(--skel-base) 75%);
  background-size: 200% 100%;
  animation: skel-shimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes skel-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skel-short { width: 40%; height: 14px; }
.skel-mid { width: 70%; height: 14px; }
.skel-long { width: 90%; height: 14px; }

/* 卡片骨架 */
.skel-card {
  background: var(--ht-bg-secondary, #f5f5f5);
  border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}

/* 列表骨架 */
.skel-list { display: flex; flex-direction: column; gap: 14px; }
.skel-row {
  display: flex; align-items: center; gap: 14px;
  background: var(--ht-bg-secondary, #f5f5f5);
  border-radius: 10px; padding: 14px;
}
.skel-avatar { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; }
.skel-row-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* 图表骨架 */
.skel-chart {
  background: var(--ht-bg-secondary, #f5f5f5);
  border-radius: 10px; padding: 16px;
}
.skel-chart-title { margin-bottom: 14px; }
.skel-chart-area {
  display: flex; align-items: flex-end; gap: 6px;
  height: 120px;
}
.skel-bar { flex: 1; border-radius: 4px 4px 0 0; }

/* 表格骨架 */
.skel-table { display: flex; flex-direction: column; gap: 10px; }
.skel-table-header, .skel-table-row {
  display: flex; gap: 16px;
  background: var(--ht-bg-secondary, #f5f5f5);
  border-radius: 8px; padding: 12px 16px;
}
.skel-table-header .skel-line { height: 12px; }

/* 文本骨架 */
.skel-text {
  background: var(--ht-bg-secondary, #f5f5f5);
  border-radius: 10px; padding: 18px;
  display: flex; flex-direction: column; gap: 10px;
}
</style>
