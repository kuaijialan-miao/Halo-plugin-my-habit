import { api } from './index'
import type { Habit } from './types'

export const habitApi = {
  list: () => api.get<Habit[]>('/habits'),
  get: (name: string) => api.get<Habit>(`/habits/${name}`),
  create: (habit: Partial<Habit>) => api.post<Habit>('/habits', habit),
  update: (name: string, habit: Partial<Habit>) => api.put<Habit>(`/habits/${name}`, habit),
  delete: (name: string) => api.del<void>(`/habits/${name}`),
}
