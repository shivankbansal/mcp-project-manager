import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createProxyMiddleware } from 'http-proxy-middleware'
import compression from 'compression'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000
const backendUrl = process.env.BACKEND_URL || 'https://mcp-project-manager.onrender.com'

app.use(compression())

// Proxy API to backend
app.use('/api', createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  xfwd: true,
  logLevel: 'warn'
}))

// Serve static assets
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, () => {
  console.log(`[devtrifecta] UI server listening on port ${port}`)
  console.log(`[devtrifecta] Proxying /api to ${backendUrl}`)
})
