import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createProxyMiddleware } from 'http-proxy-middleware'
import compression from 'compression'
import http from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000
const backendUrl = process.env.BACKEND_URL || 'https://mcp-project-manager.onrender.com'

console.log('[devtrifecta] Server config:', { backendUrl, port, distPath: path.join(__dirname, 'dist') })

app.use(compression())

// Proxy API to backend - mount at root with context filter to preserve /api path
app.use(createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  followRedirects: true,
  pathFilter: '/api',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[devtrifecta] Proxy: ${req.method} ${req.originalUrl} → ${backendUrl}${req.originalUrl}`)
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[devtrifecta] Proxy response: ${proxyRes.statusCode} for ${req.originalUrl}`)
  },
  onError: (err, req, res) => {
    console.error(`[devtrifecta] Proxy error: ${err.message}`)
    res.status(503).json({ error: 'Backend unreachable', details: err.message })
  }
}))

// Serve static assets
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const server = http.createServer(app)
server.listen(port, () => {
  console.log(`[devtrifecta] UI server listening on port ${port}`)
  console.log(`[devtrifecta] Proxying /api to ${backendUrl}`)
})
