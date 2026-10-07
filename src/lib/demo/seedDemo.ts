import { db } from '@/lib/db'
import { buildDemoData } from './demoData'

// Marks that this browser already got the demo data: emptying everything afterwards (trying
// out deletes, say) leaves it empty instead of bringing the data back on the next start
const SEEDED_KEY = 'demo-seeded'

// What the demo data fills, plus the user's own categories, which a reset drops too
const dataTables = () => [
  db.expenses,
  db.incomes,
  db.fixedExpenses,
  db.shoppingItems,
  db.recipes,
  db.profile,
  db.categories,
  db.cards,
  db.cardCycles,
]

// Local mode only (no Supabase): fills a browser that has nothing yet
export async function seedDemoIfEmpty(now = new Date()) {
  if (await db.syncState.get(SEEDED_KEY)) return
  const counts = await Promise.all([
    db.expenses.count(),
    db.fixedExpenses.count(),
    db.shoppingItems.count(),
  ])
  if (counts.some((count) => count > 0)) return
  await writeDemo(now)
}

// Back to the demo data, whatever was done with it
export async function resetDemo(now = new Date()) {
  await db.transaction('rw', dataTables(), () => Promise.all(dataTables().map((t) => t.clear())))
  await writeDemo(now)
}

async function writeDemo(now: Date) {
  const data = buildDemoData(now)
  await db.transaction('rw', [...dataTables(), db.syncState], async () => {
    await db.profile.put(data.profile)
    await db.expenses.bulkAdd(data.expenses)
    await db.incomes.bulkAdd(data.incomes)
    await db.fixedExpenses.bulkAdd(data.fixedExpenses)
    await db.shoppingItems.bulkAdd(data.shoppingItems)
    await db.recipes.bulkAdd(data.recipes)
    await db.cards.bulkAdd(data.cards)
    await db.cardCycles.bulkAdd(data.cardCycles)
    await db.syncState.put({ key: SEEDED_KEY, value: now.toISOString() })
  })
}
