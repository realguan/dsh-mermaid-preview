#!/usr/bin/env node
/**
 * serve-demo.mjs — zero-dependency static server for the standalone demo.
 *
 * Usage: node scripts/serve-demo.mjs [port]
 * Default port: 8090 → http://localhost:8090 (serves demo/index.html)
 *
 * The demo page loads the Mermaid engine the plugin ships with
 * (`dist/client.mermaid.js`), so the demo works offline, exactly like the
 * plugin does. It imports the plugin's diagram theme from src/theme.js, so the
 * server root is the package root; only demo/, that one module, and the
 * engine chunk are reachable over HTTP.
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, normalize, extname, sep } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const demoRoot = join(root, 'demo')
const themeFile = join(root, 'src', 'theme.js')
const engineFile = join(root, 'dist', 'client.mermaid.js')
const port = Number(process.argv[2] ?? 8090)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`)
    let path = normalize(decodeURIComponent(url.pathname))
    // Redirect to the demo directory so relative asset URLs resolve.
    if (path === '/' || path === '/demo') {
      res.writeHead(302, { Location: '/demo/' })
      res.end()
      return
    }
    if (path === '/demo/') path = '/demo/index.html'
    // Prevent path traversal outside the served roots.
    if (path.startsWith('/')) path = path.slice(1)
    if (path.includes('..')) throw new Error('forbidden')
    const file = join(root, path)
    const allowed = file === themeFile || file === engineFile || file.startsWith(demoRoot + sep)
    if (!allowed) throw new Error('forbidden')
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('404 Not Found')
  }
})

server.listen(port, () => {
  console.log(`dsh-mermaid-preview demo → http://localhost:${port}`)
})
