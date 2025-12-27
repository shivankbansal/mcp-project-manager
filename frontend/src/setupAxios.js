import axios from 'axios'

// Basic axios logging for debugging in console
const API_URL = import.meta.env.VITE_API_URL ?? ''

console.info('[devtrifecta] axios setup', { API_URL })

axios.interceptors.request.use((config) => {
  const start = Date.now()
  // attach start time
  config.headers['x-start-time'] = start
  const info = {
    method: (config.method || 'get').toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    params: config.params,
    data: config.data
  }
  console.groupCollapsed(`[devtrifecta] HTTP → ${info.method} ${info.url}`)
  console.debug('request', info)
  console.groupEnd()
  return config
})

axios.interceptors.response.use(
  (response) => {
    const startHeader = response.config.headers['x-start-time']
    const duration = startHeader ? (Date.now() - Number(startHeader)) : undefined
    const info = {
      status: response.status,
      url: response.config.url,
      method: (response.config.method || 'get').toUpperCase(),
      duration
    }
    console.groupCollapsed(`[devtrifecta] HTTP ← ${info.method} ${info.url} ${info.status} ${duration ? duration + 'ms' : ''}`)
    console.debug('response', info)
    console.groupEnd()
    return response
  },
  (error) => {
    const cfg = error?.config || {}
    const startHeader = cfg.headers?.['x-start-time']
    const duration = startHeader ? (Date.now() - Number(startHeader)) : undefined
    console.group(`[devtrifecta] HTTP ✕ ${(cfg.method || 'GET').toUpperCase()} ${cfg.url} ${error?.response?.status || ''}`)
    console.error('error', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      duration
    })
    console.groupEnd()
    throw error
  }
)

// Expose some app info for debugging
window.__DEVTRIFECTA__ = {
  API_URL,
  buildTime: new Date().toISOString()
}
