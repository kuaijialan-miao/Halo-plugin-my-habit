export interface HabitSpec {
  name: string
  icon: string
  color: string
  targetDays: number
  createdAt: string
  updatedAt: string
}

export interface Habit {
  metadata: { name: string }
  spec: HabitSpec
}

export interface CheckInSpec {
  habitName: string
  checkDate: string
  note: string
  createdAt: string
}

export interface CheckIn {
  metadata: { name: string }
  spec: CheckInSpec
}

export interface PomodoroSpec {
  mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
  duration: number
  startTime: string
  endTime: string | null
  taskName: string
}

export interface Pomodoro {
  metadata: { name: string }
  spec: PomodoroSpec
}

export interface PomodoroTodayStats {
  focusCount: number
  totalFocusMinutes: number
}

export interface TaskSpec {
  title: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  estimatedPomos: number
  pomodoroCount: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  metadata: { name: string }
  spec: TaskSpec
}
