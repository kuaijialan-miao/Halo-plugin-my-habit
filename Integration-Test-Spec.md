# Integration Test Specification — Week 4 (Day 27)

> 版本：v1.0 | 日期：2026-07-20
> 覆盖范围：Day 22-26 全部新增/修改功能

---

## 一、Dark Theme System (Day 22)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| T1.1 | Theme auto-detection | 系统 dark 模式下首次加载 | `data-theme="dark"` 生效，背景深色 |
| T1.2 | Manual toggle | Settings 页切换 dark → light | 所有页面即时切换，CSS 变量响应 |
| T1.3 | Persistence | 切为 dark，刷新页面 | 保持 dark，不闪烁回 light |
| T1.4 | Auto mode | 设为 auto，切换 OS 主题 | 跟随系统变换 |
| T1.5 | Heatmap in dark | dark 模式看 Statistics | 热力图 5 级颜色为蓝色梯度 (--ht-heat-0~4) |
| T1.6 | SVG chart in dark | dark 模式看折线图 | 网格线/坐标轴颜色来自 CSS 变量 |

## 二、SVG Trend Line Chart (Day 23)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| T2.1 | Empty state | 无打卡数据时加载 Statistics | 折线图区域隐藏 (`v-if="chartConfig"`) |
| T2.2 | Single day data | 仅 1 天有打卡 | 折线连接 30 个点，含 29 个零点 |
| T2.3 | Tooltip hover | 鼠标悬停数据点 | 显示 "YYYY-MM-DD: N次" tooltip |
| T2.4 | Y-axis scaling | 打卡峰值 15 次 | Y 轴最大值 = ceil(15×1.2) = 18 |
| T2.5 | X-axis labels | 查看图底标签 | 每 5 天一个 MM-DD 标签 |

## 三、Dashboard Quick Checkin (Day 24)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| T3.1 | Initial state | 有 3 个习惯，均未打卡 | 3 个 chip 全显示 "+" |
| T3.2 | Check in | 点击第 1 个 chip | chip 变 checked（绿色）, 显示 "✓"，今日打卡计数 +1 |
| T3.3 | Uncheck | 再次点击同一 chip | checked 移除，显示 "+"，计数 -1 |
| T3.4 | Loading guard | 快速双击 chip | 仅触发一次 API 调用（checkingIn lock） |
| T3.5 | Cross-page sync | Dashboard 打卡后去 Habits 页 | Habits 页显示已打卡状态 |
| T3.6 | Refresh persistence | 页面刷新 | 打卡状态从后端恢复 |

## 四、Task Drag-Drop Persistence (Day 25)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| T4.1 | Sort order init | 新建 3 个任务 A/B/C | 列表按 sortOrder ASC 排列 |
| T4.2 | Drag reorder | ALL tab 拖拽 C 到 A 前面 | 列表顺序变为 C/A/B |
| T4.3 | Backend persist | 拖拽后刷新页面 | 排序保持 C/A/B (sortOrder 已持久化) |
| T4.4 | New task order | 已有 3 个任务（sortOrder 1,2,3），新建任务 | 新任务 sortOrder=4，排在最末 |
| T4.5 | Filtered no-drag | DONE tab 下拖拽 | 拖拽不生效（仅在 ALL/TODO 下启用） |
| T4.6 | Multi-drag sequence | 连续拖拽 3 次 | 每次 drop 后正确调用 reorder API |

## 五、Build & Integration (Day 26)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| T5.1 | Java compile | `mvn compile -pl plugin-habit-tracker` | 0 errors |
| T5.2 | UI build | `npm run build` in `ui/` | 0 errors, dist/ 产出 |
| T5.3 | TypeScript check | `npx vue-tsc --noEmit` | 0 type errors |
| T5.4 | API endpoint alignment | 检查所有前端 API 调用 vs 后端路由 | 全部匹配 |

---

## 六、Regression Checklist

| # | Area | Verify |
|:--:|------|--------|
| R1 | Habits CRUD + 打卡 | 新建习惯、打卡、切换习惯 |
| R2 | Pomodoro Timer | 启动/暂停/完成 Focus & Break |
| R3 | Task CRUD + status cycle | 新建、循环切换状态、删除 |
| R4 | Statistics loading | 4 卡 + 周热力图 + 番茄柱状图 |
| R5 | Settings persistence | 修改时长，刷新后保留 |

---

## 已知限制与未测试项

| # | 项 | 说明 |
|---|----|------|
| L1 | 拖拽排序 + 多用户并发 | 单用户场景无冲突，未来需乐观锁 |
| L2 | 30 天无打卡数据的折线图视觉 | 全 0 折线贴合 X 轴底部，可接受 |
| L3 | `checkInApi.list(habit)` query 参数 | 依赖后端 query string 解析正确 |
