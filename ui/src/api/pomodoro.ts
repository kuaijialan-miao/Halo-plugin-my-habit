import { api } from './index'
import type { Pomodoro, PomodoroTodayStats } from './types'

export const pomodoroApi = {
  list: () => api.get<Pomodoro[]>('/pomodoros'),
  create: (pomodoro: Partial<Pomodoro>) => api.post<Pomodoro>('/pomodoros', pomodoro),
  finish: (name: string) => api.post<Pomodoro>(`/pomodoros/${name}/finish`),
  todayStats: () => api.get<PomodoroTodayStats>('/pomodoros/today-stats'),
}
