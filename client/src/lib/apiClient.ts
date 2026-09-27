import axios, { type InternalAxiosRequestConfig } from 'axios'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
    accessToken = token
}

export function getAccessToken() {
    return accessToken
}

let onAuthFailure: (() => void) | null = null

export function setOnAuthFailure(handler: (() => void) | null) {
  onAuthFailure = handler
}

export const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
})


api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
})

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout']

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const response = await api.post('/auth/refresh')
  const newToken: string = response.data.data
  setAccessToken(newToken)
  return newToken
}


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status
    const isAuthRoute = AUTH_ROUTES.some((path) => original?.url?.startsWith(path))

    if (status !== 401 || !original || original._retry || isAuthRoute) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise

      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      setAccessToken(null)
      onAuthFailure?.()
      return Promise.reject(refreshError)
    }
  },
)