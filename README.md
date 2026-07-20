# Halo 自律打卡插件 (Plugin Habit Tracker)

[![Halo](https://img.shields.io/badge/Halo-2.17+-blue)](https://github.com/halo-dev/halo)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()

番茄钟计时 + 习惯打卡 + 任务管理 + 数据可视化，一站式个人自律管理 Halo 插件。

---

## 功能特性

### 番茄钟

- 标准番茄工作法（25 分钟专注 / 5 分钟短休 / 15 分钟长休）
- SVG 进度环实时动画
- 浏览器桌面通知 + 音效提醒
- 可自定义专注/休息时长

### 习惯打卡

- 创建、编辑、删除习惯（名称/图标/颜色）
- 每日快捷打卡 + 取消打卡
- 拖拽排序持久化
- Dashboard 一键打卡面板

### 任务管理

- 创建、编辑、删除任务
- TODO / DOING / DONE 状态循环切换
- 拖拽排序（排序持久化到后端）
- 番茄钟关联（记录任务消耗的番茄数）

### 数据可视化

- **仪表盘**：习惯数 / 今日打卡 / 今日专注 / 待办任务 四维卡片
- **统计页**：本周打卡热力图 + 番茄钟趋势柱状图 + SVG 贝塞尔平滑折线图
- 折线图支持 4 档时间范围切换：7天 / 14天 / 30天 / 90天

### 其他

- 深色/浅色主题切换（跟随系统 / 手动选择）
- 数据导出/导入（JSON 格式完整备份恢复）
- 骨架屏加载态
- 键盘无障碍导航（focus-visible + ARIA 语义）
- 全局错误处理 + 重试机制

---

## 安装

### 环境要求

- Halo 2.17+
- JDK 17+
- Node.js 18+（仅源码构建需要）

### 方式一：预构建 JAR（推荐）

1. 从 [Releases](https://github.com/kuaijialan-miao/Halo-plugin-my-habit/releases) 下载 `plugin-habit-tracker-1.0.0.jar`
2. 放入 Halo 的 `plugins/` 目录
3. 重启 Halo 或通过插件管理页面启用

### 方式二：源码构建

```bash
git clone git@github.com:kuaijialan-miao/Halo-plugin-my-habit.git
cd Halo-plugin-my-habit

# 一键构建（含前端 + 后端）
./build.ps1

# 或分步构建
cd ui && npm install && npm run build && cd ..
./gradlew build
```

构建产物位于 `build/libs/plugin-habit-tracker-1.0.0.jar`。

---

## 使用指南

插件安装启用后，在 Halo 后台左侧菜单栏出现 **自律打卡** 菜单组，包含 6 个子页面：

| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | `/habit-tracker` | 今日概览 + 快捷打卡 + 功能入口 |
| 番茄钟 | `/habit-tracker/pomodoro` | 启动番茄计时器 |
| 习惯打卡 | `/habit-tracker/habits` | 管理习惯列表 + 打卡 |
| 任务管理 | `/habit-tracker/tasks` | 管理待办任务 |
| 数据统计 | `/habit-tracker/stats` | 打卡热力图 + 趋势图表 |
| 设置 | `/habit-tracker/settings` | 时长配置 / 主题 / 导入导出 |

### 快速开始

1. 在 **习惯打卡** 页面创建你的第一个习惯（如"阅读"、"运动"）
2. 在 **仪表盘** 一键打卡今日完成的习惯
3. 开启 **番茄钟** 进入专注模式
4. 在 **数据统计** 查看打卡记录和趋势图表

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Spring WebFlux (Halo Plugin SDK) |
| 前端框架 | Vue 3 + TypeScript |
| 构建工具 | Vite 5 |
| 图表 | 自研 SVG 折线图 + ECharts 柱状图 |
| 番茄钟 | Web Worker + 状态机 + Blob 内联 |
| 样式 | CSS Variables 主题系统 |

---

## 项目结构

```
plugin-habit-tracker/
├── src/main/java/com/miaohaha/habit/
│   ├── HabitPlugin.java          # 插件入口
│   ├── model/                    # 数据模型 (Habit/CheckIn/Pomodoro/Task)
│   ├── service/                  # 业务逻辑层
│   └── controller/               # REST API 控制器
├── src/main/resources/
│   ├── plugin.yaml               # 插件元数据
│   ├── extensions/               # Halo 扩展配置
│   └── console/                  # 前端构建产物（自动生成）
├── ui/
│   ├── src/
│   │   ├── api/                  # API 客户端封装
│   │   ├── components/           # 可复用组件
│   │   ├── composables/          # 组合式函数
│   │   └── views/                # 页面组件
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── build.ps1                     # 一键构建脚本
├── DEPLOY.md                     # 部署指南
├── CHANGELOG.md                  # 版本变更日志
├── API.md                        # API 接口文档
└── docker-compose.yml            # Docker 开发环境
```

---

## 开发

```bash
# 前端开发（热重载）
cd ui && npm run dev

# 后端开发
./gradlew build -x test

# TypeScript 类型检查
cd ui && npx vue-tsc --noEmit

# 构建插件 JAR
./build.ps1
```

---

## API 概览

详见 [API.md](./API.md)。

| 资源 | 端点 | 方法 |
|------|------|------|
| 习惯 | `/api/habits` | GET/POST/PUT/DELETE |
| 打卡 | `/api/checkins` | GET/POST/DELETE |
| 连胜 | `/api/checkins/streak` | GET |
| 番茄钟 | `/api/pomodoros` | GET/POST |
| 番茄统计 | `/api/pomodoros/today-stats` | GET |
| 任务 | `/api/tasks` | GET/POST/PUT/DELETE |
| 排序 | `/api/tasks/reorder` | POST |
| 番茄计数 | `/api/tasks/{name}/pomodoro` | POST |

---

## 许可证

MIT License

---

## 致谢

- [Halo](https://github.com/halo-dev/halo) - 强大易用的开源建站工具
- 本插件由 Marvis AI 与 kuaijialan-miao 协作开发
