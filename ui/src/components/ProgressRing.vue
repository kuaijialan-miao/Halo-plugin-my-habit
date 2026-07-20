<!--
  Day 10: SVG 进度环组件

  设计要点：
  1. 纯 SVG 实现，无外部依赖
  2. 支持渐变色进度条
  3. 平滑动画过渡（stroke-dashoffset transition）
  4. 中心插槽显示倒计时文字
  5. 响应式 size，支持不同尺寸
-->

<template>
  <div class="progress-ring-wrapper" :style="{ width: size + 'px', height: size + 'px' }">
    <svg
      class="progress-ring"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${viewSize} ${viewSize}`"
    >
      <!-- 背景环 -->
      <circle
        class="progress-ring__bg"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
      />
      <!-- 进度环 -->
      <circle
        class="progress-ring__fill"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :stroke="gradientId ? `url(#${gradientId})` : color"
        stroke-linecap="round"
      />
      <!-- 渐变定义 -->
      <defs v-if="useGradient">
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" :stop-color="gradientStart" />
          <stop offset="100%" :stop-color="gradientEnd" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 中心内容插槽 -->
    <div class="progress-ring__center" :style="{ fontSize: centerFontSize }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  progress: number       // 0 ~ 1
  size?: number          // px
  strokeWidth?: number
  color?: string
  useGradient?: boolean
  gradientStart?: string
  gradientEnd?: string
  gradientId?: string
}>(), {
  size: 260,
  strokeWidth: 8,
  color: '#e74c3c',
  useGradient: false,
  gradientStart: '#e74c3c',
  gradientEnd: '#f39c12',
  gradientId: 'progress-gradient',
})

const viewSize = 100
const center = viewSize / 2
const radius = center - props.strokeWidth
const circumference = 2 * Math.PI * radius

const dashOffset = computed(() => {
  return circumference * (1 - Math.min(1, Math.max(0, props.progress)))
})

const centerFontSize = computed(() => {
  return `${Math.max(14, props.size * 0.09)}px`
})
</script>

<style scoped>
.progress-ring-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
  display: block;
}

.progress-ring__bg {
  stroke: #e8e8e8;
  transition: stroke 0.3s;
}

.progress-ring__fill {
  transition: stroke-dashoffset 0.4s ease-out, stroke 0.5s;
}

.progress-ring__center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #333;
  font-weight: 600;
  user-select: none;
}
</style>
