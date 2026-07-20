# Week 4 代码审查报告

> 日期：2026-07-20 | 审查范围：Day 22-28 全部产出

---

## 一、审查概要

| 审查项 | 文件数 | 结论 |
|--------|:---:|------|
| TypeScript 类型安全 | 4 | 通过（2 处 `as any` 已知规避，非新增问题） |
| Vue 组件正确性 | 3 | 通过 |
| Java 后端接口 | 3 | 通过（修复 1 处 NPE 防护） |
| CSS 变量主题系统 | 1 | 通过（修复 2 处初始化竞态） |
| 前后端接口对齐 | 6 端点 | 全部匹配 |
| 集成测试规范 | 1 | 通过 |

**总评：代码质量良好。发现 3 个 Bug，全部已修复。**

---

## 二、已修复 Bug

### Bug 1 — `setupSystemListener()` 重复注册监听器

- **文件**：`ui/src/composables/useTheme.ts`
- **严重程度**：中
- **根因**：`initTheme()`（模块顶层调用）和 `useTheme().onMounted()`（组件挂载调用）都会调用 `setupSystemListener()`。第二次调用创建新的 `MediaQueryList` 对象并再次 `addEventListener`，导致 OS 主题变化时 handler 触发 **两次**。
- **修复**：
  1. 新增 `themeInitialized` 标志位，`loadTheme()` 首次执行后置 true，防止重复加载
  2. `setupSystemListener()` 增加 `if (mediaQuery) return` 守卫，已注册则跳过

### Bug 2 — `TaskService.reorder()` 空 Spec NPE 风险

- **文件**：`src/main/java/.../service/TaskService.java`
- **严重程度**：低
- **根因**：`reorder()` 直接调用 `t.getSpec().setSortOrder(sortOrder)`，若从持久化存储恢复的任务数据 spec 字段意外为 null，会抛出 `NullPointerException`。
- **修复**：增加 `if (t.getSpec() == null) return Mono.empty()` 守卫，跳过异常数据并继续处理后续条目。

### Bug 3 — `loadTheme()` 被 `initTheme()` 和 `useTheme()` 重复调用

- **文件**：`ui/src/composables/useTheme.ts`
- **严重程度**：低
- **根因**：模块初始化阶段 `initTheme()` 调用 `loadTheme()` 后，组件挂载时 `useTheme()` 会再次调用 `loadTheme()`，导致 localStorage 读取和 DOM 操作执行两次。
- **修复**：同 Bug 1，`loadTheme()` 增加 `themeInitialized` 首执行守卫。

---

## 三、逐文件审查详情

### 3.1 useTheme.ts

| 检查项 | 结果 |
|--------|:---:|
| `ThemeMode` 类型定义 | ✅ `'light' \| 'dark' \| 'auto'` |
| CSS 变量完整性 | ✅ 两套色板覆盖全部 token（50+） |
| `color-scheme` CSS 属性 | ✅ light/dark 正确设置 |
| localStorage 持久化 | ✅ `habit-tracker-theme` 键 |
| FOUC 防护 | ✅ `initTheme()` 在模块顶层同步执行 |
| `data-theme` 属性 | ✅ 设置在 `<html>` 元素上 |
| 系统主题跟随 | ✅ `matchMedia` + `auto` 模式联动 |
| `toggleTheme` 语义 | ✅ 切换 resolved 后的实际主题 |
| 初始化竞态（已修复） | ✅ 增加 `themeInitialized` + `mediaQuery` 守卫 |

### 3.2 Statistics.vue

| 检查项 | 结果 |
|--------|:---:|
| `TrendPoint` 接口 | ✅ `{ date, count }` |
| `chartConfig` computed | ✅ viewBox / 坐标 / polyline / 网格 / 刻度全量计算 |
| Y 轴自适应 | ✅ `yMax = ceil(maxVal * 1.2)` |
| X 轴标签 | ✅ 每 5 天 MM-DD |
| Tooltip | ✅ SVG `<g>` hover 定位 |
| 空态处理 | ✅ `v-if="chartConfig"` — 无数据隐藏图表 |
| `loadTrendData()` | ✅ 遍历习惯逐项 fetch（可优化为 `Promise.all` 并行，非 bug） |
| `checkInApi.list(habit)` 返回全量 | ✅ 后端 `listByHabit()` 返回该习惯全部记录 |
| `heatLevelColors` 色值 | ✅ 与 Light 主题一致（未 CSS 变量化，已知设计决定） |
| CSS 变量引用 | ✅ 全部颜色通过 `var(--ht-*)` 引用 |

### 3.3 Dashboard.vue

| 检查项 | 结果 |
|--------|:---:|
| `todayCheckMap` 响应式 | ✅ `ref<Record<string, boolean>>` — Vue 3 自动深层代理 |
| `toggleCheckIn()` 防抖 | ✅ `checkingIn` 锁阻止重复提交 |
| 打卡逻辑 | ✅ 已打卡→删记录，未打卡→新建 |
| 取消失败处理 | ✅ try-finally 确保锁释放 |
| `checkInApi.list(name)` | ✅ 带参数时后端返回全量，查找今日记录正确 |
| `checkInApi.list()` 无参 | ✅ 后端返回今日，Dashboard 用此统计今日打卡 — 语义正确 |
| 创建 payload 字段 | ✅ `habitName / checkDate / note / createdAt` 与 `CheckInSpec` 对齐 |
| CSS 变量 | ✅ `var(--ht-*)` 引用 + `color-mix()` 半透明背景 |

### 3.4 Tasks.vue + task.ts + types.ts

| 检查项 | 结果 |
|--------|:---:|
| `TaskSpec.sortOrder` 类型 | ✅ `number`（前端）/ `Integer`（后端）对齐 |
| `taskApi.reorder()` 路径 | ✅ `POST /tasks/reorder` 与后端 `@PostMapping("/reorder")` 匹配 |
| `persistOrder()` 静默失败 | ✅ `console.error` — 不阻塞 UI，符合设计 |
| `onDrop()` 全局索引 | ✅ 使用 `tasks.value` 全量数组定位，不受 filter 影响 |
| 拖拽仅在 ALL/TODO 启用 | ✅ `:draggable="filter === 'ALL' \|\| filter === 'TODO'"` |
| `createTask` 自动 sortOrder | ✅ 不传前端值，后端 `create()` 自动 `max+1` |
| `cycleStatus` 三态循环 | ✅ TODO → IN_PROGRESS → DONE → TODO |
| `as any` 类型规避 | ⚠️ `createTask`/`cycleStatus` 使用 `as any` 绕过 `createdAt`/`updatedAt` 类型不一致（前端 string vs 后端 Instant），已知历史问题 |

### 3.5 Task.java / TaskService.java / TaskController.java

| 检查项 | 结果 |
|--------|:---:|
| `TaskSpec.sortOrder` 字段 | ✅ `Integer`（可 null，兼容旧数据） |
| `listAll()` 排序 | ✅ `sortOrder ASC`，null → `Integer.MAX_VALUE` 兜底 |
| `create()` 自动分配 | ✅ `max(existing orders) + 1` |
| `reorder()` 防御（已修复） | ✅ null spec 跳过 |
| `update()` sortOrder 支持 | ✅ 包含在 merge 逻辑中 |
| 路由映射 | ✅ `POST /plugins/plugin-habit-tracker/api/tasks/reorder` |
| 前端 API base URL | ✅ `/apis/api.plugin.halo.run/v1alpha1/plugins/plugin-habit-tracker/api` |

### 3.6 Integration-Test-Spec.md

| 检查项 | 结果 |
|--------|:---:|
| 覆盖模块 | ✅ 5 模块（Theme / Chart / Checkin / Drag-Drop / Build） |
| 用例数 | ✅ 24（T1.1-T5.4） |
| 回归清单 | ✅ R1-R5 覆盖全部核心模块 |
| 已知限制 | ✅ L1-L3 如实记录 |
| 可执行性 | ⚠️ 依赖 Maven + Node.js 构建环境，当前不可用 |

---

## 四、前后端接口对照表

| 前端调用 | HTTP | 后端路由 | 状态 |
|----------|:---:|------|:---:|
| `habitApi.list()` | GET | `/habits` | ✅ |
| `checkInApi.list()` | GET | `/checkins` | ✅ |
| `checkInApi.list(habit)` | GET | `/checkins?habit=xxx` | ✅ |
| `checkInApi.create()` | POST | `/checkins` | ✅ |
| `checkInApi.delete(name)` | DELETE | `/checkins/{name}` | ✅ |
| `taskApi.list()` | GET | `/tasks` | ✅ |
| `taskApi.create()` | POST | `/tasks` | ✅ |
| `taskApi.update()` | PUT | `/tasks/{name}` | ✅ |
| `taskApi.delete()` | DELETE | `/tasks/{name}` | ✅ |
| `taskApi.reorder()` | POST | `/tasks/reorder` | ✅ |
| `taskApi.incrementPomodoro()` | POST | `/tasks/{name}/pomodoro` | ✅ |
| `pomodoroApi.list()` | GET | `/pomodoros` | ✅ |

**接口对齐：12/12 全部匹配。**

---

## 五、改进建议（非阻塞）

| # | 建议 | 优先级 | 理由 |
|---|------|:---:|------|
| 1 | Statistics `loadWeekData` + `loadTrendData` 合并 fetch | 中 | 当前 2N 次请求可优化为 N 次，共享结果 |
| 2 | `Tasks.vue` `as any` 类型安全化 | 低 | 定义 `CreateTaskPayload` 接口消除 cast |
| 3 | `reorder` API 改用 PATCH 语义 | 低 | RESTful 更规范 |
| 4 | `useTheme` 的 `watch(theme)` 在 `onMounted` 外 | 低 | watch 在 setup 阶段注册，`onMounted` 仅用于 DOM 依赖操作 |

---

## 六、Git 操作

### commit 信息

```
fix(week4): code review — fix 3 bugs

- useTheme: prevent double setupSystemListener + loadTheme
  (add themeInitialized guard + mediaQuery existence check)
- TaskService.reorder: add null-spec guard to avoid NPE
```

### 变更文件

| 文件 | 变更 |
|------|------|
| `ui/src/composables/useTheme.ts` | +4 行（2 处守卫） |
| `src/main/java/.../service/TaskService.java` | +3 行（null 检查 + `.then()` 修正） |

---

## 七、结论

Week 4 代码整体质量良好，主题系统、SVG 折线图、快捷打卡、拖拽排序四大特性实现正确。发现 3 个 Bug（2 个初始化竞态 + 1 个 NPE 防护），均为防御性修复，不影响正常业务流程。修复后代码可安全合并。
