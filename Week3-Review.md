# Week 3 Review — 前端交互组件与数据可视化

> 周期：2026-07-20 ~ 2026-07-26（实际 1 天完成）
> 完成人：Marvis | 审核人：老快

---

## 一、完成情况

| Day | 计划 | 实际完成 | 产出文件 |
|:---:|------|:---:|------|
| 15 | 习惯打卡交互组件（打卡按钮 + 连续天数） | ✅ | `CheckInButton.vue` + `Habits.vue` |
| 16 | 日历热力图组件 | ✅ | `HeatmapCalendar.vue` |
| 17 | 番茄完成时 API 自动持久化 | ✅ | `usePomodoro.ts`（修改） |
| 18 | 任务管理组件（拖拽排序 + 状态切换 + 筛选） | ✅ | `Tasks.vue` |
| 19 | 统计页面数据可视化 | ✅ | `Statistics.vue` |
| 20 | 设置页面（时长/音效/通知/数据导出） | ✅ | `Settings.vue` |
| 21 | Week 3 Review | ✅ | 本报告 |

**全周 7/7 完成。新增/修改 8 个文件，约 +1450 行代码。**

---

## 二、Day 15-16：习惯打卡

### CheckInButton.vue
- 打卡/取消打卡 toggle 按钮
- 显示连续打卡天数（streak badge）
- 当天打卡状态检测（对比当天日期）
- 调用 `checkInApi.create` / `checkInApi.delete` 实现交互
- loading 防重复提交

### HeatmapCalendar.vue
- 52 周 GitHub-style 日历热力图
- 5 级颜色梯度（0 → 4+ 次）
- SVG-free：纯 CSS grid 实现
- 按习惯名称动态加载打卡数据
- 月份标签 + 图例

### Habits.vue（完整重写）
- 习惯列表 Tab 切换（带 icon + color 自定义）
- 新建习惯表单（图标选择器 + 颜色选择器 + 目标天数）
- 选中习惯的 Hero 区域：图标 + 名称 + 目标天数 + 打卡按钮
- 底部热力图联动（选中习惯切换时热力图自动重载）

---

## 三、Day 17：番茄持久化

### usePomodoro.ts 修改
- 新增 `persistPomodoro()` 函数：完成时自动调用 `pomodoroApi.create` + `finish`
- Focus 完成 → 创建 FOCUS 记录并 finish
- Short Break / Long Break 完成 → 创建对应 BREAK 记录并 finish
- 异常静默处理（catch log），不阻断用户体验
- `startTime` 根据 `duration` 反推计算

---

## 四、Day 18：任务管理

### Tasks.vue（完整重写）
- **CRUD**：创建、删除任务
- **状态切换**：点击任务主区域循环切换 TODO → IN_PROGRESS → DONE
- **拖拽排序**：HTML5 Drag & Drop API（仅在 ALL / TODO 筛选下启用）
- **筛选 tabs**：全部 / 待办 / 进行中 / 已完成
- **番茄关联**：🍅 图标点击即调用 `taskApi.incrementPomodoro`
- 优先级徽章（高/中/低）+ 统计条

---

## 五、Day 19：统计可视化

### Statistics.vue（完整重写）
- **总览卡片**：习惯数 / 本周打卡 / 累计番茄 / 累计专注
- **本周打卡热力图**：7 天 block 展示，5 级颜色
- **30 天番茄柱状图**：CSS bar chart，hover 显示详情
- **本周番茄明细表**：日期 / 番茄数 / 专注时长
- 数据来源：`habitApi` / `checkInApi` / `pomodoroApi` / `taskApi`

---

## 六、Day 20：设置页面

### Settings.vue（完整重写）
- **番茄钟时长**：4 项配置（Focus / Short Break / Long Break / 长休息间隔），stepper 增减
- **音效开关**：toggle switch
- **桌面通知**：toggle switch + 权限请求按钮
- **自动进入休息**：toggle switch
- **数据导出**：一键导出所有数据为 JSON（habits + checkins + pomodoros + tasks）
- **关于信息**：版本号 + 技术栈
- 设置持久化到 `localStorage`

---

## 七、架构总览

```
ui/src/
├── components/
│   ├── CheckInButton.vue     [Day 15] 打卡按钮 + 连续天数
│   ├── HeatmapCalendar.vue   [Day 16] 日历热力图
│   ├── PomodoroTimer.vue     [Week 2]
│   └── ProgressRing.vue      [Week 2]
├── composables/
│   ├── usePomodoro.ts        [Day 17] 新增持久化逻辑
│   └── ...                   [Week 2]
└── views/
    ├── Habits.vue            [Day 15-16] 完整打卡页面
    ├── Tasks.vue             [Day 18] 完整任务管理
    ├── Statistics.vue        [Day 19] 数据可视化
    ├── Settings.vue          [Day 20] 设置页面
    ├── Pomodoro.vue          [Week 2]
    └── Dashboard.vue         [Week 1]
```

---

## 八、技术要点

### 8.1 日历热力图（纯 CSS Grid）
- 无第三方图表库依赖，纯 CSS grid 排列
- 52 列 × 7 行，宽度仅 ~400px
- 5 级颜色梯度（GitHub 绿主题）

### 8.2 拖拽排序（原生 HTML5 DnD）
- `draggable` + `@dragstart` / `@dragover` / `@drop` / `@dragend`
- 仅在非筛选或 TODO 筛选下可拖拽（避免 DONE 状态重排语义混乱）

### 8.3 番茄持久化时机
- Worker `complete` 事件 → `handleComplete()` → `persistPomodoro()`
- 先 `create` 拿到 `metadata.name`，再 `finish`
- 不阻塞 UI（async + 静默 catch）

### 8.4 设置持久化
- `localStorage` 键 `habit-tracker-settings`
- 页面加载时读取，修改后手动保存
- `watch` 深度监听，显示"已保存"反馈

---

## 九、待改进项

| # | 项 | 优先级 | 计划 |
|---|-----|:---:|------|
| 1 | 设置页面与 `usePomodoro` 配置联动（localStorage → stateMachine config） | 高 | 使用时集成 |
| 2 | 统计页增加周/月趋势折线图（可用简单 SVG path） | 中 | Week 4+ |
| 3 | 任务拖拽后持久化排序到后端 | 低 | Week 5 |
| 4 | 设置页增加深色主题切换 | 低 | Week 6+ |

---

## 十、一句话总结

> Week 3 在 1 天内完成习惯打卡、任务管理、统计可视化、设置页面前端全部交互组件，Calendar Heatmap 和 Drag & Drop 均为零依赖纯前端实现，番茄持久化补全了 Week 2 遗留的关键链路，前端功能完整度达到 90%+。
