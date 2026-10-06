// `pnpm dev:sync`: the dev server against the local Supabase (`pnpm db:start`), to work on
// sign-in and sync without touching production. Its URL and key come from `supabase status`
// (they beat the .env files), and a dev user is created the first time.
import { execSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const DEV_USER = { email: 'dev@cashlist.local', password: 'cashlist-dev' }

let status
try {
  const out = execSync('pnpm exec supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] })
  status = JSON.parse(out.toString())
} catch {
  console.error('The local Supabase is not running: start it with pnpm db:start (needs Docker)')
  process.exit(1)
}
if (!status.API_URL?.startsWith('http://127.0.0.1')) {
  console.error(
    `Refusing to run against ${status.API_URL}: dev:sync is for the local Supabase only`,
  )
  process.exit(1)
}

const response = await fetch(`${status.API_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    apikey: status.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ...DEV_USER, email_confirm: true }),
})
// 422: already there from a previous run
if (!response.ok && response.status !== 422) {
  console.error(`Creating the dev user failed: ${await response.text()}`)
  process.exit(1)
}
console.log(
  `Local Supabase at ${status.API_URL} · sign in with ${DEV_USER.email} / ${DEV_USER.password}`,
)

const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const vite = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_SUPABASE_URL: status.API_URL,
    VITE_SUPABASE_ANON_KEY: status.ANON_KEY,
  },
})
vite.on('exit', (code) => process.exit(code ?? 0))
