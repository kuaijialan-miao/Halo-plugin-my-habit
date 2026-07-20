import { api } from './index'
import type { CheckIn } from './types'

export const checkInApi = {
  list: (habit?: string) =>
    api.get<CheckIn[]>(`/checkins${habit ? `?habit=${encodeURIComponent(habit)}` : ''}`),
  create: (checkIn: Partial<CheckIn>) => api.post<CheckIn>('/checkins', checkIn),
  delete: (name: string) => api.del<void>(`/checkins/${name}`),
  streak: (habit: string) =>
    api.get<{ habit: string; streak: number }>(`/checkins/streak?habit=${encodeURIComponent(habit)}`),
}
