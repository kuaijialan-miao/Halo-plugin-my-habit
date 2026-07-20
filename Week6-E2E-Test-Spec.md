---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 8b0b5ee7b6380cef0b20b46d12aedfa5_a3aae3c0840c11f184135254006c9bbf
    ReservedCode1: reyvxoafeCPI6XFx5d8xpnxgtUc5HkTCqFtPjHWLOHh/lwJ6YWVD2Z+zTbhwwT4moRmpZWz6w6rWLi1thEmMt2Ax8+jzFQ0Kk8QuTWZoiNi4PQDJxpQgPLkooVxV2EE47Jf88ccrhCdCXP8g79uZu+xTBHmv/nWDgeoPZ1pXXuMKmux5VCj39ajbX/k=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 8b0b5ee7b6380cef0b20b46d12aedfa5_a3aae3c0840c11f184135254006c9bbf
    ReservedCode2: reyvxoafeCPI6XFx5d8xpnxgtUc5HkTCqFtPjHWLOHh/lwJ6YWVD2Z+zTbhwwT4moRmpZWz6w6rWLi1thEmMt2Ax8+jzFQ0Kk8QuTWZoiNi4PQDJxpQgPLkooVxV2EE47Jf88ccrhCdCXP8g79uZu+xTBHmv/nWDgeoPZ1pXXuMKmux5VCj39ajbX/k=
---

# Week 6 — End-to-End Integration Test Specification

> 版本：v1.0 | 日期：2026-07-20
> 覆盖：Week 5 全部新增功能 + 全量回归

---

## 一、SVG Bezier 平滑曲线 & 范围选择器 (Day 29)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| S1.1 | 默认 30 天视图 | 打开 Statistics 页面 | 折线图默认加载最近 30 天，X 轴每 5 天一个标签 |
| S1.2 | 切换 7 天范围 | 点击 "7天" 按钮 | 曲线重绘，X 轴每 1 天一个标签，tension=0.3 平滑 |
| S1.3 | 切换 14 天范围 | 点击 "14天" 按钮 | 曲线重绘，X 轴每 2 天一个标签 |
| S1.4 | 切换 90 天范围 | 点击 "90天" 按钮 | 曲线重绘，X 轴每 10 天一个标签 |
| S1.5 | range 按钮 active 态 | 点击不同 range 按钮 | 当前选中按钮高亮，其余恢复默认 |
| S1.6 | 仅 1 个数据点 | 仅 1 天有数据 | 曲线退化为单点（不报错） |
| S1.7 | 2 个数据点 | 仅 2 天有数据 | 直线连接两点 |
| S1.8 | 3+ 数据点 | 3 天以上有数据 | 贝塞尔平滑曲线 + 渐变面积填充 |
| S1.9 | Tooltip hover | 鼠标悬停数据点 | 显示 MM-DD: N次，暗色背景 tooltip |
| S1.10 | Tooltip 溢出裁剪 | hover 最右侧点 | tooltip 不溢出 SVG 视口 |
| S1.11 | 空数据状态 | 无任何打卡记录 | 折线图区域隐藏，显示空状态提示 |
| S1.12 | 暗色主题 | 切为 dark 模式查看折线图 | 网格线/坐标轴/文字颜色适配暗色 CSS 变量 |

## 二、数据导入 (Day 30)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| S2.1 | 导入按钮可见 | 打开 Settings 页面 | 数据导出与数据导入按钮并排显示 |
| S2.2 | 导入有效 JSON | 选择含 Habits/Checkins 的 JSON | 提示 success=N, skipped=0, failed=0 |
| S2.3 | 导入含重复记录 | 导入已存在的习惯 | 已存在记录 skipped++，新记录 success++ |
| S2.4 | 四阶段依赖 | 导入含 Checkins 但不含对应 Habit | Checkins 跳过（依赖缺失），failed++ |
| S2.5 | 导入无效 JSON | 选择非 JSON 文件 | 提示格式错误，不导入 |
| S2.6 | 导入空文件 | 选择空文件 | 提示无数据，三项均为 0 |
| S2.7 | 重复导入同一文件 | 连续两次导入同一 JSON | 第二次全部 skipped（已存在），不重复写入 |
| S2.8 | 导入后功能可用 | 导入后去 Dashboard | 新导入的习惯出现在 Dashboard 快捷打卡区 |
| S2.9 | 导入后统计 | 导入后去 Statistics | 统计数字包含导入数据 |

## 三、骨架屏加载 (Day 31)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| S3.1 | Dashboard 加载态 | 刷新 Dashboard 页面 | 加载中显示 4 卡片骨架 + 列表骨架（shimmer 动画） |
| S3.2 | Dashboard 加载完成 | 等待 API 返回 | 骨架屏消失，实际内容显示 |
| S3.3 | Statistics 加载态 | 刷新 Statistics 页面 | 加载中显示 4 卡片骨架 + 2 图表骨架 |
| S3.4 | 骨架屏无 JS 动画 | 查看动画实现 | 纯 CSS @keyframes shimmer，无 JS 定时器 |
| S3.5 | 暗色主题骨架屏 | dark 模式加载页面 | 骨架屏颜色适配暗色 CSS 变量 |
| S3.6 | API 报错后骨架屏消失 | 模拟 API 失败 | 骨架屏消失，显示错误信息 |

## 四、无障碍访问 (Day 32)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| S4.1 | Tab 键导航 | Dashboard 页按 Tab | 焦点环可见移动，:focus-visible 样式生效 |
| S4.2 | Enter/Space 激活 | 焦点在可交互元素时按 Enter/Space | 触发点击行为 |
| S4.3 | Skip link | 页面加载后立即按 Tab | 出现 "跳转到主内容" skip link |
| S4.4 | 鼠标点击无焦点环 | 鼠标点击按钮 | :focus:not(:focus-visible) outline: none |
| S4.5 | ARIA 语义 | 检查 Dashboard 导航区 | `<nav aria-label="功能快捷入口">` |
| S4.6 | 暗色主题焦点环 | dark 模式 Tab 导航 | 焦点环颜色在暗色背景下可见 |

## 五、构建与部署 (Day 33)

| # | Test Case | Steps | Expected |
|:--:|-----------|-------|----------|
| S5.1 | UI 构建 | `cd ui && npm run build` | 0 errors, main.js 输出到 resources/console |
| S5.2 | TypeScript 检查 | `npx vue-tsc --noEmit` | 0 type errors |
| S5.3 | build.ps1 默认 | `./build.ps1` | 前端构建 + 后端 Gradle + 输出 JAR 信息 |
| S5.4 | build.ps1 -SkipTests | `./build.ps1 -SkipTests` | 跳过测试，快速构建 |
| S5.5 | build.ps1 -Release | `./build.ps1 -Release` | 以 release 模式构建 |
| S5.6 | DEPLOY.md 准确性 | 按 DEPLOY.md 步骤操作 | 全部步骤可执行无错误 |

---

## 六、端到端场景测试

### 场景一：新用户完整流程

| Step | 操作 | 页面 | 预期 |
|:--:|------|------|------|
| 1 | 首次打开插件 | Dashboard | 空状态提示，引导创建习惯 |
| 2 | 创建习惯 "阅读" | Habits | 习惯列表出现 "阅读"，排序在最末 |
| 3 | 创建习惯 "运动" | Habits | 拖拽 "运动" 到 "阅读" 上方，刷新后排序保持 |
| 4 | 创建任务 "完成报告" | Tasks | 任务列表出现，状态 TODO |
| 5 | Dashboard 快捷打卡 "阅读" | Dashboard | chip 变 checked 绿色，计数 +1 |
| 6 | 启动番茄钟 | Pomodoro | 25 分钟倒计时开始，进度环动画 |
| 7 | 完成任务 | Tasks | 状态切换到 DONE，可再切回 |
| 8 | 查看统计 | Statistics | 当天打卡+1，热力图今日格变色 |
| 9 | 切换 7 天趋势 | Statistics | 折线图 zoom 到 7 天 |
| 10 | Settings 导出数据 | Settings | 下载 JSON，含习惯/打卡/番茄/任务 |
| 11 | Settings 切换暗色主题 | Settings | 所有页面即时切换 |

### 场景二：数据恢复流程

| Step | 操作 | 预期 |
|:--:|------|------|
| 1 | Settings 导出 JSON | 备份文件下载成功 |
| 2 | 删除所有习惯和任务 | 数据清空 |
| 3 | Settings 导入 JSON | 导入成功，success=N |
| 4 | Dashboard 检查 | 所有习惯恢复，打卡状态恢复 |
| 5 | Statistics 检查 | 统计数据恢复 |

### 场景三：无障碍键盘操作

| Step | 操作 | 预期 |
|:--:|------|------|
| 1 | 页面加载，按 Tab | Skip link 出现 |
| 2 | 继续 Tab 到导航 | 焦点环高亮可见 |
| 3 | Enter 选择 "习惯打卡" | 路由跳转到 Habits 页 |
| 4 | Tab 到习惯列表 | 可 Enter 进入编辑 |

---

## 七、全量回归检查清单

### Habits 习惯管理

| # | Verify |
|:--:|------|
| R1 | 创建习惯（名称、图标、颜色） |
| R2 | 编辑习惯 |
| R3 | 删除习惯（confirm 弹窗） |
| R4 | 拖拽排序（ALL tab）持久化 |
| R5 | 今日打卡 / 取消打卡 |
| R6 | 打卡状态跨页同步 |

### Pomodoro 番茄钟

| # | Verify |
|:--:|------|
| R7 | Focus 倒计时 25min |
| R8 | Short Break 5min |
| R9 | Long Break 15min（每 4 个 Focus） |
| R10 | 启动/暂停/继续/完成状态流转 |
| R11 | 进度环 SVG 动画 |
| R12 | 音效提醒 / 浏览器通知 |
| R13 | Settings 修改时长后生效 |

### Tasks 任务管理

| # | Verify |
|:--:|------|
| R14 | 新建任务 |
| R15 | 状态循环 TODO → DOING → DONE → TODO |
| R16 | Tab 筛选 ALL / TODO / DOING / DONE |
| R17 | 删除任务 |
| R18 | 拖拽排序持久化 |

### Statistics 统计

| # | Verify |
|:--:|------|
| R19 | 本周热力图（7 天 × N 习惯） |
| R20 | 番茄钟柱状图 |
| R21 | 4 数字卡片（习惯/打卡/番茄/任务数） |
| R22 | 折线图 4 档范围切换 |
| R23 | 贝塞尔平滑曲线 |

### Settings 设置

| # | Verify |
|:--:|------|
| R24 | 番茄时长配置持久化 |
| R25 | 音效开关 |
| R26 | 通知权限 |
| R27 | 主题切换 dark/light/auto |
| R28 | 数据导出 JSON |
| R29 | 数据导入 JSON |

### 通用

| # | Verify |
|:--:|------|
| R30 | 骨架屏加载态 |
| R31 | 暗色/浅色主题切换 |
| R32 | Tab 键盘导航 + focus-visible |
| R33 | 6 个路由正常工作 |
| R34 | API 错误 toast 提示 |

---

## 八、性能基准

| Metric | Target | Measurement |
|--------|:------:|-------------|
| 首屏加载 | < 2s | Dashboard onMounted → 内容可见 |
| 骨架屏出现 | < 200ms | loading=true → skeleton render |
| 主题切换 | < 100ms | toggle → CSS var update |
| 折线图重绘 | < 300ms | range switch → curve rendered |
| 批量导入 | < 2s | JSON parse + API calls for 100 records |
| Main.js 体积 | < 200KB | gzip 后 |

---

## 九、已知限制

| # | Item | Impact |
|---|------|--------|
| L1 | Worker 在 IIFE 模式下使用 Blob 内联 | 不影响功能，但代码可读性略低 |
| L2 | 热力图仅显示本周 | 后续可支持全年视图 |
| L3 | 数据导入无进度条 | 大批量时用户需等待，可接受 |
| L4 | 无 i18n 国际化 | 仅中文，后续迭代 |

*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
