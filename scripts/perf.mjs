// Lighthouse on the production build, as a mid-range phone on a slow 4G would get it, first
// visit (an installed app opens from its cache, faster). Without a session it measures the
// sign-in screen, but it loads the same code. Run after `vite build`.
import { spawn } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { preview } from 'vite'

const PORT = 5198
const report = join(tmpdir(), 'cashlist-lighthouse.json')

const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: 'silent' })
try {
  // Not execFileSync: it would block this process, and with it the preview server Lighthouse
  // is loading the page from
  const command = [
    'npx --yes lighthouse@12',
    `http://localhost:${PORT}/`,
    '--quiet --chrome-flags=--headless=new --only-categories=performance --form-factor=mobile',
    `--output=json --output-path="${report}"`,
  ].join(' ')
  await new Promise((resolve, reject) => {
    spawn(command, { stdio: 'inherit', shell: true }).on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Lighthouse failed (exit ${code})`)),
    )
  })
  const { categories, audits } = JSON.parse(readFileSync(report, 'utf8'))
  console.log(`Puntaje                  ${Math.round(categories.performance.score * 100)}`)
  for (const [id, label] of [
    ['first-contentful-paint', 'Primer contenido'],
    ['largest-contentful-paint', 'Contenido principal'],
    ['interactive', 'Lista para usar'],
    ['total-blocking-time', 'Bloqueo total'],
    ['unused-javascript', 'JavaScript sin usar'],
  ]) {
    console.log(`${label.padEnd(25)}${audits[id]?.displayValue ?? '-'}`)
  }
} finally {
  rmSync(report, { force: true })
  await new Promise((resolve) => server.httpServer.close(resolve))
}
