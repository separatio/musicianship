// Musicianship — one-file Bun static dev server for LAN use.
// Run: bun serve.ts  (then open the printed http://<lan-ip>:PORT on your phone/tablet)

import { networkInterfaces } from 'node:os'
import { normalize, resolve, sep } from 'node:path'

const ROOT = import.meta.dir
const PORT = Number(process.env.PORT) || 8080

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
}

const extensionOf = (path: string): string => {
  const dot = path.lastIndexOf('.')
  return dot < 0 ? '' : path.slice(dot).toLowerCase()
}

const contentType = (path: string): string =>
  MIME[extensionOf(path)] ?? 'application/octet-stream'

const notFound = (): Response =>
  new Response('404 Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })

const fetchHandler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/' || pathname.endsWith('/')) {
    pathname += 'index.html'
  }

  // Resolve against root and ensure the result stays inside root (no traversal).
  const target = resolve(ROOT, normalize(`.${pathname}`))
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    return notFound()
  }

  const file = Bun.file(target)
  if (!(await file.exists())) return notFound()

  return new Response(file, {
    headers: { 'content-type': contentType(target) },
  })
}

const lanAddresses = (): string[] => {
  const out: string[] = []
  const ifaces = networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] ?? []) {
      if (info.family === 'IPv4' && !info.internal) {
        out.push(info.address)
      }
    }
  }
  return out
}

Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  fetch: fetchHandler,
})

const line = (host: string) => `  http://${host}:${PORT}`

console.log('\nMusicianship dev server running. Serving:', ROOT)
console.log('\nLocal:')
console.log(line('localhost'))

const lan = lanAddresses()
if (lan.length > 0) {
  console.log('\nOn your network:')
  for (const addr of lan) console.log(line(addr))
  console.log(
    '\nOpen any "On your network" address on your phone or tablet on the same Wi-Fi.',
  )
}
console.log('')
