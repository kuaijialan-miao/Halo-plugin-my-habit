# Halo 自律打卡插件 — 部署指南

> 版本：1.0.0-SNAPSHOT | 更新：2026-07-20

---

## 环境要求

| 组件 | 最低版本 |
|------|:---:|
| Halo | 2.17.0+ |
| Java | JDK 17 |
| Node.js | 18+ (仅构建) |
| Gradle | 8.x (wrapper 自带) |

---

## 快速部署

### 方式一：预构建 JAR（推荐）

1. 从 [Releases](https://github.com/kuaijialan-miao/Halo-plugin-my-habit/releases) 下载最新 `plugin-habit-tracker-*.jar`
2. 将 JAR 文件放入 Halo 的 `plugins/` 目录
3. 重启 Halo：`halo restart`
4. 在 Halo 后台 → 插件 → 启用「自律打卡」
5. 刷新后左侧菜单出现「自律打卡」入口

### 方式二：源码构建

```powershell
# Windows
.\build.ps1

# Linux/macOS
./gradlew build -x test
```

构建产物：`build/libs/plugin-habit-tracker-1.0.0-SNAPSHOT.jar`

---

## 插件配置

插件安装后，可通过以下端点访问：

| 路径 | 功能 |
|------|------|
| `/habit-tracker/dashboard` | 仪表盘（概览卡片 + 快捷打卡） |
| `/habit-tracker/habits` | 习惯管理（创建/打卡/热力图） |
| `/habit-tracker/tasks` | 任务管理（拖拽排序/状态切换） |
| `/habit-tracker/pomodoro` | 番茄钟计时器 |
| `/habit-tracker/stats` | 数据统计（折线趋势图/周热力图） |
| `/habit-tracker/settings` | 设置（主题/音效/导出导入） |

---

## 数据管理

- **导出**：设置页 → 导出所有数据 (JSON)，包含习惯/打卡/番茄/任务全量数据
- **导入**：设置页 → 导入备份 (JSON)，按序恢复（习惯→打卡→番茄→任务）
- **主题**：支持浅色/深色/跟随系统三种模式，设置页或快捷切换

---

## 故障排查

| 问题 | 解决方案 |
|------|------|
| 插件未出现在菜单 | 检查 Halo ≥ 2.17.0，重启 Halo |
| 前端白屏 | 检查浏览器控制台，确认 `/plugins/habit-tracker/assets/` 路径可访问 |
| API 404 | 确认插件已启用，检查 Halo 日志 `habit-tracker` 相关条目 |
| 数据不显示 | 首次使用需先创建习惯，数据存储于 Halo 内置数据库 |

---

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite + CSS Variables |
| 后端 | Spring Boot 3.2 + Halo API + Project Reactor |
| 持久化 | Halo Extension Store (JPA/H2) |
| 主题 | 50+ CSS 自定义属性 + OS 主题跟随 |
| 可视化 | SVG 折线图 + CSS Grid 热力图（零依赖） |
