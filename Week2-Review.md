# Week 2 Review — 番茄钟核心功能

> 周期：2026-07-27 ~ 2026-08-02（实际 1 天完成）
> 完成人：Marvis | 审核人：老快

---

## 一、完成情况

| Day | 计划 | 实际完成 | 产出文件 |
|:---:|------|:---:|------|
| 8 | Web Worker 倒计时 + 偏差补偿 | ✅ | `ui/src/composables/pomodoro.worker.ts` |
| 9 | 状态机 + 三模式切换 | ✅ | `ui/src/composables/pomodoroStateMachine.ts` |
| 10 | SVG 进度环组件 | ✅ | `ui/src/components/ProgressRing.vue` |
| 11 | WebAudio 音效 + Notification 通知 | ✅ | `ui/src/composables/useSound.ts` + `useNotification.ts` |
| 12 | PomodoroTimer.vue 整合 | ✅ | `ui/src/components/PomodoroTimer.vue` + `ui/src/composables/usePomodoro.ts` |
| 13 | 番茄记录持久化 API 联调 | ✅ | PomodoroController 新增 stats 端点 + Pomodoro.vue 重构 |
| 14 | Week 2 Review | ✅ | 本报告 |

**全周 7/7 完成，新增 8 个源文件。**

---

## 二、Week 2 架构总览

```
ui/src/
├── composables/
│   ├── pomodoro.worker.ts          # [Day 8] Web Worker 倒计时核心
│   │   ├── 100ms 高频 tick，避免浏览器后台节流
│   │   ├── 每 10 秒偏差补偿（对比 Date.now() vs tick 计数）
│   │   └── 支持 start/pause/resume/stop 消息协议
│   ├── pomodoroStateMachine.ts     # [Day 9] 番茄钟状态机
│   │   ├── 5 状态：IDLE/FOCUS/SHORT_BREAK/LONG_BREAK/PAUSED
│   │   ├── 6 事件：START_FOCUS/COMPLETE/PAUSE/RESUME/RESET/SKIP
│   │   ├── 每 4 个 Focus 自动进入 Long Break
│   │   └── 可配置时长（默认 25+5+15 分钟）
│   ├── useSound.ts                 # [Day 11] WebAudio 程序化音效
│   │   ├── 5 种音效：start/complete/breakEnd/tick/pause
│   │   ├── 懒初始化 AudioContext（首次交互激活）
│   │   └── 支持静音开关
│   ├── useNotification.ts          # [Day 11] Notification API 封装
│   │   ├── 权限请求 + 状态查询
│   │   └── 3 种通知：focusComplete/breakEnd/longBreakEnd
│   └── usePomodoro.ts              # [Day 12] 核心编排层
│       ├── Worker 生命周期管理（Blob URL 创建，兼容 Vite IIFE）
│       ├── 状态机驱动 + 音效/通知触发
│       └── 暴露响应式状态给 UI 组件
├── components/
│   ├── ProgressRing.vue             # [Day 10] SVG 进度环
│   │   ├── 纯 SVG 实现，stroke-dashoffset 动画
│   │   ├── 支持渐变色（红→橙/绿/蓝三套配色）
│   │   ├── 中心插槽显示倒计时
│   │   └── 响应式 size（默认 260px）
│   └── PomodoroTimer.vue           # [Day 12] 完整番茄钟组件
│       ├── 模式切换按钮（专注/短休/长休）
│       ├── ProgressRing + 倒计时展示
│       ├── 控制按钮组（开始/暂停/继续/跳过/结束/静音）
│       └── 今日统计（番茄数 + 当前轮次）
└── views/
    └── Pomodoro.vue                 # [Day 13] 页面升级
        ├── 集成 PomodoroTimer 组件
        ├── 今日统计卡片（API 驱动）
        └── 最近 10 条番茄记录列表
```

---

## 三、后端变更

| 文件 | 变更 |
|------|------|
| `PomodoroController.java` | 新增 `GET /today-stats` 端点，返回今日 focusCount + totalFocusMinutes |
| `ui/src/api/pomodoro.ts` | 新增 `todayStats()` 方法 |
| `ui/src/api/types.ts` | 新增 `PomodoroTodayStats` 接口，`PomodoroSpec` 增加 `duration` 字段 |

---

## 四、技术亮点

### 4.1 偏差补偿机制
- Worker 内每 10 秒用 `Date.now()` 对比 `tick * 100ms` 的理论值
- 偏差超过 500ms 时自动修正 `remaining`，消除浏览器后台节流导致的计时偏差

### 4.2 Blob Worker 兼容方案
- Vite IIFE 构建不支持 `new Worker(new URL(...))`，改用 `Blob + createObjectURL` 内联 Worker 代码
- `usePomodoro.ts` 中的 `workerBlobCode()` 函数维护了 Worker 的完整逻辑副本

### 4.3 状态机自动切换
- Focus 完成后自动进入 Short/Long Break（每 4 轮 Long Break）
- Break 完成后回到 IDLE，等待用户手动开始下一个番茄
- PAUSE 状态下记住 previousState，RESUME 时正确恢复

---

## 五、与 Week 1 的衔接

| Week 1 产出 | Week 2 集成点 |
|-------------|--------------|
| `Pomodoro.java` Extension 模型 | `PomodoroSpec` 的 `mode/duration/startTime/endTime` 字段 |
| `PomodoroController.java` REST API | 前端通过 `pomodoroApi.create/finish/todayStats` 调用 |
| `PomodoroService.java` 今日统计 | `today-stats` 端点使用 `listFocusToday()` |

---

## 六、待改进项

| # | 项 | 优先级 | 计划 |
|---|-----|:---:|------|
| 1 | 番茄完成时自动调用 `pomodoroApi.create` + `finish` 持久化 | 高 | Week 3 补充 |
| 2 | 与 Task 的 `pomodoroCount` 关联（任务关联番茄） | 中 | Week 5 |
| 3 | 自定义时长设置 UI | 低 | Week 6 Settings 页面 |
| 4 | 白噪声 / 环境音集成 | 低 | Week 7+ |

---

## 七、一句话总结

> 番茄钟核心功能（Web Worker 倒计时 + 状态机 + SVG 进度环 + 音效通知 + 后端统计 API）在 1 天内完成 Week 2 全部 7 天任务，前端组件化架构清晰，复用性强，可为 Week 3 习惯打卡功能提供计时组件基础。
