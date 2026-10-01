// What opening the app downloads and runs before the first screen: the entry chunk and every
// chunk it imports statically, gzipped. Fails past the budget, so a change that makes the
// app heavier doesn't go unnoticed. Screens loaded on demand don't count.
// Run after `vite build` (it reads dist/.vite/manifest.json).
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = 230 // gzipped; raise it on purpose, with a reason, never by default

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'))
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry)

const chunks = new Set()
const visit = (key) => {
  if (chunks.has(key)) return
  chunks.add(key)
  for (const imported of manifest[key].imports ?? []) visit(imported)
}
visit(entry)

let total = 0
for (const key of chunks) {
  const file = manifest[key].file
  const kb = gzipSync(readFileSync(`dist/${file}`)).length / 1024
  total += kb
  console.log(`${kb.toFixed(1).padStart(7)} KB  ${file}`)
}
const css = (manifest[entry].css ?? []).reduce(
  (sum, file) => sum + gzipSync(readFileSync(`dist/${file}`)).length / 1024,
  0,
)

console.log(`${total.toFixed(1).padStart(7)} KB  JavaScript at startup (budget ${BUDGET_KB} KB)`)
console.log(`${css.toFixed(1).padStart(7)} KB  CSS`)
if (total > BUDGET_KB) {
  console.error(`Over budget by ${(total - BUDGET_KB).toFixed(1)} KB`)
  process.exit(1)
}
