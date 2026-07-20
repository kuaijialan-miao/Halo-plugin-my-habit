const BASE_URL = '/apis/api.plugin.halo.run/v1alpha1/plugins/plugin-habit-tracker/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`HTTP ${resp.status}: ${err}`)
  }
  if (resp.status === 204) return undefined as T
  return resp.json()
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}
