import axios from 'axios'
import { supabase } from './supabase/client'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: unknown; message?: unknown }
      | string
      | undefined
    if (typeof data === 'string' && data.trim()) return data
    if (
      data &&
      typeof data === 'object' &&
      typeof data.error === 'string' &&
      data.error.trim()
    ) {
      return data.error
    }
    if (
      data &&
      typeof data === 'object' &&
      typeof data.message === 'string' &&
      data.message.trim()
    ) {
      return data.message
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export default apiClient
