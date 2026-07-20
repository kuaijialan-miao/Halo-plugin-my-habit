# Day 6 前后端联调自检报告

> 日期：2026-07-20 | 检查人：Marvis

---

## 1. API 路由映射校验

| 前端 API | 后端 Controller | 方法 | 路径 | 状态 |
|----------|----------------|------|------|:----:|
| `habitApi.list()` | HabitController.list | GET | `/api/habits` | ✅ |
| `habitApi.get(name)` | HabitController.get | GET | `/api/habits/{name}` | ✅ |
| `habitApi.create(data)` | HabitController.create | POST | `/api/habits` | ✅ |
| `habitApi.update(name, data)` | HabitController.update | PUT | `/api/habits/{name}` | ✅ |
| `habitApi.delete(name)` | HabitController.delete | DELETE | `/api/habits/{name}` | ✅ |
| `checkInApi.list(habit)` | CheckInController.list | GET | `/api/checkins?habit=` | ✅ |
| `checkInApi.create(data)` | CheckInController.create | POST | `/api/checkins` | ✅ |
| `checkInApi.delete(name)` | CheckInController.delete | DELETE | `/api/checkins/{name}` | ✅ |
| `checkInApi.streak(habit)` | CheckInController.streak | GET | `/api/checkins/streak?habit=` | ✅ |
| `pomodoroApi.list()` | PomodoroController.list | GET | `/api/pomodoros` | ✅ |
| `pomodoroApi.create(data)` | PomodoroController.create | POST | `/api/pomodoros` | ✅ |
| `pomodoroApi.finish(name)` | PomodoroController.finish | POST | `/api/pomodoros/{name}/finish` | ✅ |
| `taskApi.list()` | TaskController.list | GET | `/api/tasks` | ✅ |
| `taskApi.get(name)` | TaskController.get | GET | `/api/tasks/{name}` | ✅ |
| `taskApi.create(data)` | TaskController.create | POST | `/api/tasks` | ✅ |
| `taskApi.update(name, data)` | TaskController.update | PUT | `/api/tasks/{name}` | ✅ |
| `taskApi.delete(name)` | TaskController.delete | DELETE | `/api/tasks/{name}` | ✅ |
| `taskApi.incrementPomodoro(name)` | TaskController.incrementPomodoro | POST | `/api/tasks/{name}/pomodoro` | ✅ |

结果：18/18 路由完全匹配。

---

## 2. 数据类型前后端对齐

| 字段 | Java 类型 | TypeScript 类型 | 状态 |
|------|-----------|----------------|:----:|
| Habit.spec.name | String | string | ✅ |
| Habit.spec.icon | String | string | ✅ |
| Habit.spec.color | String | string | ✅ |
| Habit.spec.targetDays | Integer | number | ✅ |
| CheckIn.spec.habitName | String | string | ✅ |
| CheckIn.spec.checkDate | LocalDate | string (ISO date) | ✅ |
| CheckIn.spec.note | String | string | ✅ |
| Pomodoro.spec.mode | PomodoroMode (FOCUS/SHORT_BREAK/LONG_BREAK) | 'FOCUS' \| 'SHORT_BREAK' \| 'LONG_BREAK' | ✅ |
| Pomodoro.spec.startTime | Instant | string (ISO datetime) | ✅ |
| Pomodoro.spec.endTime | Instant \| null | string \| null | ✅ |
| Task.spec.priority | TaskPriority (HIGH/MEDIUM/LOW) | 'HIGH' \| 'MEDIUM' \| 'LOW' | ✅ |
| Task.spec.status | TaskStatus (TODO/IN_PROGRESS/DONE) | 'TODO' \| 'IN_PROGRESS' \| 'DONE' | ✅ |

结果：全部对齐（`DOING`→`IN_PROGRESS` 已在审查中修复）。

---

## 3. CRUD 业务流程审查

### Habit 习惯
- CREATE: Controller接收JSON → Service设默认值(color/icon/targetDays) → ReactiveExtensionClient.create ✅
- READ: listAll按createdAt排序，getByName精确查询 ✅
- UPDATE: fetch后逐字段合并，保留未传字段原值 ✅
- DELETE: fetch→delete，不存在时Mono.empty ✅

### CheckIn 打卡
- CREATE: UUID生成name，默认today日期 ✅
- STREAK: 日期逆序遍历+中断归零算法，今天未打卡返回0 ✅
- 补卡: 前端传入指定checkDate即可 ✅

### Pomodoro 番茄钟
- CREATE: 自动填充startTime ✅
- FINISH: fetch→setEndTime→update ✅
- listFocusToday: 过滤今日FOCUS模式且已完成的记录 ✅

### Task 任务
- CREATE: 默认TODO/MEDIUM/estimatedPomos=1 ✅
- UPDATE: 仅合并title/priority/status/estimatedPomos ✅
- incrementPomodoro: fetch→pomodoroCount+1→update ✅

---

## 4. 已知局限

| 问题 | 影响 | 计划解决 |
|------|------|---------|
| 无并发控制（无乐观锁） | 并发更新可能覆盖 | Week 7 测试优化阶段处理 |
| 无分页支持 | 数据量大时性能下降 | Week 7 按需添加 |
| Service 无事务 | 多步操作无原子性保证 | Halo Extension 本身不支持事务，无法解决 |
| 未集成 Halo RBAC | 所有登录用户均可操作 | Week 6 与 role.yaml 对接 |

---

## 5. 总结

- API 路由 18/18 全覆盖
- 数据类型前后端完全对齐
- CRUD 流程设计合理，边界条件已处理
- 质量等级：B+（可编译，待实际运行验证）
