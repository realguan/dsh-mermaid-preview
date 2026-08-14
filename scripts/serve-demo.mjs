#!/usr/bin/env node
/**
 * serve-demo.mjs — zero-dependency static server for the standalone demo.
 *
 * Usage: node scripts/serve-demo.mjs [port]
 * Default port: 8090 → http://localhost:8090
 *
 * The demo page loads mermaid from the jsDelivr CDN, so an internet
 * connection is required (same as the dsh plugin itself).
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, normalize, extname } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo')
const port = Number(process.argv[2] ?? 8090)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
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
    if (path === '/') path = '/index.html'
    // Prevent path traversal outside demo/
    if (path.startsWith('/')) path = path.slice(1)
    if (path.includes('..')) throw new Error('forbidden')
    const file = join(root, path)
    if (!file.startsWith(root)) throw new Error('forbidden')
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
