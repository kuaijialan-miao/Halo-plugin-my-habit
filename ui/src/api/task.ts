import { api } from './index'
import type { Task } from './types'

export const taskApi = {
  list: () => api.get<Task[]>('/tasks'),
  get: (name: string) => api.get<Task>(`/tasks/${name}`),
  create: (task: Partial<Task>) => api.post<Task>('/tasks', task),
  update: (name: string, task: Partial<Task>) => api.put<Task>(`/tasks/${name}`, task),
  delete: (name: string) => api.del<void>(`/tasks/${name}`),
  incrementPomodoro: (name: string) => api.post<Task>(`/tasks/${name}/pomodoro`),
}
