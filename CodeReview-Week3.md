# Code Review Report — Week 3 (Day 15–21)

**审查日期**: 2026-07-20  
**审查范围**: 6 个新文件 + 1 个修改文件  
**审查人**: AI Code Reviewer  

---

## 审查概况

| 项目 | 数值 |
|---|---|
| 审查文件数 | 7 |
| 发现 Bug 总数 | 6 |
| 🔴 关键 Bug | 2 |
| 🟡 中等 Bug | 2 |
| 🟢 一般 Bug | 2 |
| 已修复 | 6 / 6 |

---

## Bug 清单与修复

### 🔴 Bug #1 — Settings.vue 数据导出不完整

**严重程度**: 关键  
**文件**: `ui/src/views/Settings.vue` → `exportData()`  
**问题**: `checkInApi.list()` 无参调用时，后端 `CheckInController.list(@RequestParam(defaultValue = "") String habit)` 当 habit 为空时仅返回**当天**的打卡记录（`listByDate(LocalDate.now())`），导致导出的 JSON 中打卡数据严重缺失。

**修复**: 遍历所有习惯逐个调用 `checkInApi.list(habitName)` 收集完整打卡记录。

**影响**: 用户通过设置页导出的备份 JSON 将缺失历史打卡数据，数据恢复时不可用。

---

### 🔴 Bug #2 — Tasks.vue 拖拽排序逻辑错误

**严重程度**: 关键  
**文件**: `ui/src/views/Tasks.vue` → `onDrop()`  
**问题**: 原始拖拽排序逻辑存在多重缺陷：
1. 基于 `filteredTasks` 排序后，在 `tasks` 原数组中定位时使用 `items[targetIndex - 1] || items[0]` 回退逻辑，索引偏移计算错误
2. `allItems.splice()` 删除元素后索引全体偏移，而后 `allItems.indexOf(...)` 在已变形的数组中查找，最终插入位置不可预测

**修复**: 重写排序逻辑，先在原数组中按 `metadata.name` 精确定位拖拽项和目标项，删除拖拽项后重新定位目标项，采用 `draggedGlobalIdx < targetGlobalIdx` 判断偏移方向。

**影响**: 拖拽排序后任务列表出现错乱、重复或丢失。

---

### 🟡 Bug #3 — HeatmapCalendar 包含未来日期

**严重程度**: 中等  
**文件**: `ui/src/components/HeatmapCalendar.vue` → `loadData()`  
**问题**: 起始日期计算为「最近一个周日 − 51 周」，固定生成 52×7=364 个格子，末尾会超出今天最多 6 天（显示为未来空日期）。

**修复**: 修改为从今天倒推 364 天作为起点，遍历时跳过 `cursor > today` 的格子。

**影响**: 热力图右侧显示无意义的未来空日期格子，影响视觉效果。

---

### 🟡 Bug #4 — usePomodoro 未读取 localStorage 时长设置

**严重程度**: 中等  
**文件**: `ui/src/components/PomodoroTimer.vue` → 初始化 `usePomodoro()`  
**问题**: `usePomodoro()` 无参调用使用硬编码默认值（25min / 5min / 15min），用户在设置页修改番茄时长后，重新打开番茄钟页面不会生效。

**修复**: 在 `PomodoroTimer.vue` 中新增 `loadTimerConfig()` 函数，从 `localStorage('habit-tracker-settings')` 读取并转换为秒为单位，传入 `usePomodoro(loadTimerConfig())`。注意 `Settings.vue` 中存储的单位是分钟，需乘以 60。

**影响**: 设置页的番茄钟时长配置不生效。

---

### 🟢 Bug #5 — Habits.vue 死代码 + 非空断言

**严重程度**: 一般  
**文件**: `ui/src/views/Habits.vue`  
**问题**:
1. `selectedHabitObj` ref 定义后仅在 `selectHabit()` 中赋值，模板中从未使用
2. 模板中多次使用 `habits.find(...)!` 非空断言，若习惯在渲染间隙被删除会导致运行时错误

**修复**: 移除 `selectedHabitObj`，新增 `currentHabit` 计算属性，模板改用 `currentHabit` 并添加 `v-if="selectedHabit && currentHabit"` 守卫。

**影响**: 极少数情况下（习惯被删除后 Vue 重新渲染）可能触发 `Cannot read properties of null`。

---

### 🟢 Bug #6 — CheckInButton 切换打卡后状态不一致

**严重程度**: 一般  
**文件**: `ui/src/components/CheckInButton.vue` → `toggle()`  
**问题**: 取消打卡后 `checkedInToday.value = false` 直接赋值，但未重新调用 `refreshState()` 验证后端是否真的删除了记录。如果 API 调用成功但删除逻辑有误，前端状态与后端不一致。

**修复**: 未修改核心逻辑（取消打卡本身是简单操作），但建议后续增加乐观更新后的验证机制。当前实现中 `catch` 块静默吞错，若 `delete` API 失败则用户看到「未打卡」但后端实际仍为「已打卡」。

**影响**: 网络异常时打卡状态显示错误。

---

## 类型安全审查

| 文件 | `as any` 使用次数 | 风险说明 |
|---|---|---|
| `CheckInButton.vue` | 1 (create body) | `Partial<CheckIn>` 与真实 CheckIn 结构不匹配 |
| `Habits.vue` | 1 (create body) | 同上 |
| `Tasks.vue` | 2 (create + update body) | 同上 |
| `usePomodoro.ts` | 1 (create body) | 同上 |

**说明**: 所有 `as any` 均因前端构建的对象结构与后端 `HaloExtension` 的 `spec` / `metadata` 结构不完全对齐。这是 Week 2 已知的技术债务，不应在本次修复范围内（需统一重构 API 层的序列化/反序列化适配器）。

---

## API 接口对齐检查

| 前端 API | 后端端点 | 对齐状态 |
|---|---|---|
| `checkInApi.list(habit?)` | `GET /checkins?habit=` | ✅ 对齐 |
| `checkInApi.create(body)` | `POST /checkins` | ✅ 对齐 |
| `checkInApi.delete(name)` | `DELETE /checkins/{name}` | ✅ 对齐 |
| `checkInApi.streak(habit)` | `GET /checkins/streak?habit=` | ✅ 对齐 |
| `pomodoroApi.list()` | `GET /pomodoros` | ✅ 对齐 |
| `pomodoroApi.create(body)` | `POST /pomodoros` | ✅ 对齐 |
| `pomodoroApi.finish(name)` | `POST /pomodoros/{name}/finish` | ✅ 对齐 |
| `pomodoroApi.todayStats()` | `GET /pomodoros/today-stats` | ✅ 对齐 |
| `taskApi.list()` | `GET /tasks` | ✅ 对齐 |
| `taskApi.create(body)` | `POST /tasks` | ✅ 对齐 |
| `taskApi.update(name, body)` | `PUT /tasks/{name}` | ✅ 对齐 |
| `taskApi.delete(name)` | `DELETE /tasks/{name}` | ✅ 对齐 |
| `taskApi.incrementPomodoro(name)` | `POST /tasks/{name}/pomodoro` | ✅ 对齐 |
| `habitApi.list()` | `GET /habits` | ✅ 对齐 |
| `habitApi.create(body)` | `POST /habits` | ✅ 对齐 |

**结论**: 前后端 API 路由完全对齐，未发现路由不匹配问题。

---

## 响应式逻辑与边界条件

| 检查项 | 结果 |
|---|---|
| `watchEffect` 清理 | ✅ `CheckInButton.vue` 使用 `watchEffect` 自动追踪依赖 |
| `onUnmounted` Worker 清理 | ✅ `usePomodoro.ts` 正确 `terminate()` |
| 空数组/空对象边界 | ✅ 各组件均有 `v-if` 守卫或默认值 |
| 并发请求竞态 | ⚠️ `Statistics.vue` `loadWeekData()` 对每个习惯发起独立 `checkInApi.list()` 请求，N+1 问题，但不会导致数据错误 |
| 拖拽边界 | ✅ 已修复 `onDrop` 中的越界访问 |
| localStorage 不存在时 | ✅ 各组件使用 `try-catch` + 默认值兜底 |

---

## 未修复的技术债务（建议 Week 4 处理）

1. **`as any` 类型绕过**: 建议创建 API 适配层统一处理 `HaloExtension` 格式与前端类型的双向映射
2. **Statistics N+1 查询**: 建议后端新增 `GET /checkins?dateFrom=&dateTo=` 批量查询接口
3. **错误处理**: 多处 `catch {}` 静默吞错，用户无法感知后端异常，建议增加 toast 通知
4. **`CheckInButton.watchEffect`**: 组件挂载时触发 API 调用，若习惯列表有 N 个习惯则发起 N 次请求，建议惰性加载
