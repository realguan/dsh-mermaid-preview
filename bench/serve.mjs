/**
 * Zero-dependency static server for the benchmark page.
 *
 * Serves exactly three things out of the package root, and nothing else:
 *
 *   /            -> bench/page.html         (the page skeleton)
 *   /bench/*     -> bench/*                 (page.js, corpus.mjs)
 *   /src/theme.js-> src/theme.js            (the plugin's theme, as native ESM)
 *   /dist/*.js   -> dist/*                  (the built plugin bundle)
 *
 * It is deliberately *not* a general file server: a benchmark that can read
 * arbitrary files off disk is a liability, and the allow-list makes the page's
 * provenance obvious. `scripts/serve-demo.mjs` was rejected for this job
 * because it serves the demo tree, not a purpose-built page.
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join } from 'node:path'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

/**
 * Resolve a URL path to a file inside the allow-list, or null.
 *
 * `artifact` overrides which bundle `/dist/client.js` serves, which is how the
 * same page measures a build other than the one on disk — comparing this
 * revision against the released `dist/client.js` out of git, for instance,
 * without touching the working tree.
 */
const resolve = (pathname, artifact) => {
  if (pathname === '/' || pathname === '/index.html') return join(PKG_ROOT, 'bench', 'page.html')
  if (pathname.startsWith('/bench/')) return join(PKG_ROOT, pathname)
  if (pathname === '/src/theme.js') return join(PKG_ROOT, 'src', 'theme.js')
  if (pathname === '/dist/client.js') return artifact ?? join(PKG_ROOT, 'dist', 'client.js')
  return null
}

/**
 * Start the server on an ephemeral port.
 * @returns {Promise<{url: string, close: () => Promise<void>}>}
 */
export const startServer = async ({ artifact } = {}) => {
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
    const file = resolve(pathname, artifact)
    if (file === null) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('404 Not Found')
      return
    }
    try {
      const body = await readFile(file)
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      res.end(body)
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(`404 ${String(error?.message ?? error)}`)
    }
  })
  await new Promise((done, fail) => {
    server.once('error', fail)
    server.listen(0, '127.0.0.1', done)
  })
  const { port } = server.address()
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((done) => server.close(done)),
  }
}
