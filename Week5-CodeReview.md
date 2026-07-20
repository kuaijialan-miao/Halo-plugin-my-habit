---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 8b0b5ee7b6380cef0b20b46d12aedfa5_efb67ff083f811f184135254006c9bbf
    ReservedCode1: 5JLVVocn37Ktb9WM1vRzVwfMlQkI+lhiMxlpP+CqESG2504pZYxL3xO24CDeqxvl6KyOQjCA2SU9HP9BgbNelXxrj/jNX1xmZuT/eVxPXq3KRpwyzHxZiPgrbCTdqeaM28xxDIckUZ8EnYpFoMUCUceGfJ0fnRmLUtJaHDFcCL8XqSOKK12B0mj1kL0=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 8b0b5ee7b6380cef0b20b46d12aedfa5_efb67ff083f811f184135254006c9bbf
    ReservedCode2: 5JLVVocn37Ktb9WM1vRzVwfMlQkI+lhiMxlpP+CqESG2504pZYxL3xO24CDeqxvl6KyOQjCA2SU9HP9BgbNelXxrj/jNX1xmZuT/eVxPXq3KRpwyzHxZiPgrbCTdqeaM28xxDIckUZ8EnYpFoMUCUceGfJ0fnRmLUtJaHDFcCL8XqSOKK12B0mj1kL0=
---

# Week 5 代码审查报告

> 审查日期：2026-07-20 | 审查范围：Day 29-35 全部产出

---

## 审查范围

| 文件 | 行数 | 所属 Day | 说明 |
|------|:---:|:---:|------|
| `ui/src/views/Statistics.vue` | 647 | 29 | SVG 贝塞尔曲线 + 范围选择器 |
| `ui/src/views/Settings.vue` | 476 | 30 | 数据导入（四阶段 JSON 恢复） |
| `ui/src/components/SkeletonLoader.vue` | 135 | 31 | 5 种骨架屏变体 |
| `ui/src/composables/useA11y.ts` | 48 | 32 | 无障碍工具集 |
| `ui/src/composables/useTheme.ts` | 258 | 22/32 | 主题系统（含 a11y 样式） |
| `build.ps1` | 45 | 33 | 一键构建脚本 |
| `DEPLOY.md` | 97 | 33 | 部署文档 |
| `ui/src/views/Dashboard.vue` | 196 | 31/32 | 骨架屏集成 + 快捷打卡 |

---

## 发现与修复

### Bug #1：SkeletonLoader 柱状骨架屏高度不稳定

- **严重程度**：中
- **文件**：`SkeletonLoader.vue`（chart 类型）
- **根因**：`Math.random()` 直接写在 Vue 模板绑定中 `:style="{ height: (30 + Math.random() * 60) + '%' }"`，每次重渲染都会重新计算，导致骨架柱条高度跳动，产生视觉闪烁。
- **修复**：将随机高度值提取为 `computed` 属性 `barHeights`，首次计算后固定不变。

### Bug #2：focus-visible 无障碍样式仅在暗色模式生效

- **严重程度**：高
- **文件**：`useTheme.ts`
- **根因**：`:focus-visible`、skip-link 等无障碍 CSS 规则被写在 `getDarkStyles()` 的返回值中，而 `updateStyleSheet(isDark)` 在切换主题时全量替换 `<style>` 标签内容。导致浅色模式下这些规则完全丢失，键盘导航用户无焦点指示。
- **修复**：新增 `injectA11yStyles()` 函数，将无障碍样式注入到独立的 `<style id="habit-a11y-styles">` 标签中，与亮/暗色切换解耦。在 `useTheme()` 和 `initTheme()` 的初始化流程中调用。

### Bug #3：Dashboard.vue 导入不存在的类型 `CheckInRecord`

- **严重程度**：中
- **文件**：`Dashboard.vue`
- **根因**：`import type { Habit, CheckInRecord } from '../api/types'` 中 `CheckInRecord` 不存在——`types.ts` 中定义的是 `CheckIn`。会导致 TypeScript 编译失败。
- **修复**：移除未使用的 `CheckInRecord` 导入，仅保留 `Habit`。

### Bug #4：build.ps1 `-SkipTests` 参数无效

- **严重程度**：低
- **文件**：`build.ps1`
- **根因**：`$gradleArgs` 初始化为 `"build", "-x", "test"`，测试默认被跳过，`-SkipTests` 开关不起作用。
- **修复**：`$gradleArgs` 初始化为 `@("build")`（默认运行测试），仅当 `$SkipTests` 为真时才追加 `-x test`。

---

## API 对齐检查

对前后端 4 个 Controller × 4 个 API 模块进行了交叉验证：

| 端点 | 前端调用 | 后端实现 | 状态 |
|------|----------|----------|:--:|
| `GET /checkins` | `checkInApi.list()` — Dashboard 无参调用 | `listByDate(LocalDate.now())` 返回当天 | 匹配（符合 Dashboard 需求） |
| `GET /checkins?habit=X` | `checkInApi.list(name)` — Settings/Statistics | `listByHabit(habit)` 返回全量 | 匹配 |
| `GET /pomodoros` | `pomodoroApi.list()` | `listAll()` 返回全量 | 匹配 |
| `GET /habits` | `habitApi.list()` | `listAll()` 返回全量 | 匹配 |
| `GET /tasks` | `taskApi.list()` | `listAll()` 返回全量 | 匹配 |
| `POST /checkins` | `checkInApi.create(...)` | `create(CheckIn)` | 匹配 |
| `DELETE /checkins/{name}` | `checkInApi.delete(name)` | `delete(String)` | 匹配 |
| `GET /checkins/streak?habit=X` | `checkInApi.streak(name)` | `streak(String)` | 匹配 |

**结论：前后端 API 完全对齐，无新增不匹配。**

---

## 代码质量评估

| 维度 | 评分 | 说明 |
|------|:--:|------|
| TypeScript 类型安全 | 8/10 | Settings.vue 导入时使用 `as` 类型断言，属 JSON 解析场景下的合理妥协 |
| Vue 响应式逻辑 | 9/10 | `trendData` / `chartConfig` 的 computed 依赖链正确，Bug #1 已修复 |
| 边界条件 | 8/10 | SVG 折线图 `points.length < 2` / `=== 2` 边界均有处理；Bar chart `maxPomoCount` 至少为 1 避免除零 |
| 代码可读性 | 9/10 | 注释清晰，函数职责单一，Catmull-Rom 算法有 Wikipedia 引用 |
| 安全性 | 9/10 | 导入四阶段处理（Habits→Checkins→Pomodoros→Tasks），已存在记录跳过不覆盖 |

---

## 总结

Week 5 代码整体质量较高。4 个 Bug 均已修复，前后端 API 完全对齐。主要风险点（focus-visible 仅暗色生效、TypeScript 编译错误）已消除。

| 统计项 | 数值 |
|--------|:---:|
| 审查文件数 | 11（6 目标 + 5 依赖） |
| 发现 Bug 数 | 4 |
| 已修复 | 4 |
| API 端点对齐检查 | 8/8 通过 |
*（内容由AI生成，仅供参考）*
