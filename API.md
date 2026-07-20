# API 接口文档

> 版本：v1.0.0
> 基础路径：`/apis/api.plugin.halo.run/v1alpha1/plugins/plugin-habit-tracker/api`

所有响应为 `application/json` 格式。

---

## 一、习惯 (Habit)

### GET /habits — 获取习惯列表

响应：
```json
[
  {
    "metadata": { "name": "reading-20260720" },
    "spec": {
      "name": "阅读",
      "icon": "📖",
      "color": "#4A90D9",
      "targetDays": 7,
      "createdAt": "2026-07-20T10:00:00Z",
      "updatedAt": "2026-07-20T10:00:00Z"
    }
  }
]
```

### GET /habits/{name} — 获取单个习惯

### POST /habits — 创建习惯

请求体：
```json
{
  "metadata": { "name": "reading-20260720" },
  "spec": { "name": "阅读", "icon": "📖", "color": "#4A90D9", "targetDays": 7 }
}
```

### PUT /habits/{name} — 更新习惯

### DELETE /habits/{name} — 删除习惯

---

## 二、打卡 (CheckIn)

### GET /checkins?habit={habitName} — 获取打卡列表

| 参数 | 类型 | 说明 |
|------|------|------|
| habit | string | 可选。指定习惯名按习惯查询，否则返回今日打卡 |

响应：
```json
[
  {
    "metadata": { "name": "checkin-20260720-reading" },
    "spec": { "habitName": "阅读", "checkDate": "2026-07-20", "note": "", "createdAt": "2026-07-20T10:30:00Z" }
  }
]
```

### POST /checkins — 创建打卡

请求体：
```json
{ "spec": { "habitName": "阅读", "checkDate": "2026-07-20", "note": "" } }
```

### DELETE /checkins/{name} — 删除打卡

### GET /checkins/streak?habit={habitName} — 连胜统计

响应：
```json
{ "habit": "阅读", "streak": 5 }
```

---

## 三、番茄钟 (Pomodoro)

### GET /pomodoros — 获取番茄记录

响应：
```json
[
  {
    "metadata": { "name": "pomo-20260720-001" },
    "spec": {
      "mode": "FOCUS", "duration": 1500,
      "startTime": "2026-07-20T10:00:00Z",
      "endTime": "2026-07-20T10:25:00Z",
      "taskName": "写报告"
    }
  }
]
```

### GET /pomodoros/today-stats — 今日番茄统计

响应：
```json
{ "focusCount": 4, "totalFocusMinutes": 100 }
```

### POST /pomodoros — 创建番茄记录

### POST /pomodoros/{name}/finish — 完成番茄

---

## 四、任务 (Task)

### GET /tasks — 获取任务列表

响应：
```json
[
  {
    "metadata": { "name": "task-20260720-001" },
    "spec": {
      "title": "完成周报", "priority": "HIGH", "status": "TODO",
      "estimatedPomos": 3, "pomodoroCount": 0, "sortOrder": 1,
      "createdAt": "2026-07-20T09:00:00Z", "updatedAt": "2026-07-20T09:00:00Z"
    }
  }
]
```

### GET /tasks/{name} — 获取单个任务

### POST /tasks — 创建任务

### PUT /tasks/{name} — 更新任务

### DELETE /tasks/{name} — 删除任务

### POST /tasks/reorder — 批量排序

请求体：
```json
[
  { "name": "task-20260720-001", "sortOrder": 1 },
  { "name": "task-20260720-002", "sortOrder": 2 }
]
```

### POST /tasks/{name}/pomodoro — 增加番茄计数

---

## 五、错误响应

所有错误返回 HTTP 状态码 + 文本/JSON 错误信息：

- `HTTP 400`: 请求参数有误
- `HTTP 404`: 资源不存在
- `HTTP 500`: 服务器内部错误

前端统一捕获并展示用户友好提示，支持重试操作。

---

## 六、数据模型关系

```
Habit (1) ──< (N) CheckIn     一个习惯可有多条打卡记录
Task  (1) ──< (N) Pomodoro    一个任务可关联多个番茄钟
```

数据导入顺序：Habits → Checkins → Pomodoros → Tasks
