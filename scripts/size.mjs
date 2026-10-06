// What opening the app downloads and runs before the first screen: the entry chunk and every
// chunk it imports statically, gzipped. A report to look at, not a gate. Screens loaded on
// demand don't count.
// Run after `vite build` (it reads dist/.vite/manifest.json).
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

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

console.log(`${total.toFixed(1).padStart(7)} KB  JavaScript at startup`)
console.log(`${css.toFixed(1).padStart(7)} KB  CSS`)
