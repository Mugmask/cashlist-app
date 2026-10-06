# cashlist-app

App personal de finanzas: ingresos, gastos, gastos fijos (compartidos, con día de vencimiento y
notas), tarjeta, análisis mensual y lista de compras. PWA offline-first.
(El README es el boilerplate de Vite; la fuente de verdad es este archivo + el código.)

## Stack

- React 19 + Vite + TypeScript, react-router. PWA con `vite-plugin-pwa` (Workbox).
- **Offline-first**: los datos viven local en IndexedDB vía **Dexie** (`src/lib/db/`) y se
  sincronizan con **Supabase** con un motor propio (`src/lib/sync/`: `engine.ts`, `tables.ts`,
  `useAutoSync`, `useFirstSync`). Cualquier tabla nueva tiene que pasar por el sync y su migración.
- Migraciones: Dexie (`src/lib/db`, con tests de migración) + Supabase (`supabase/migrations/`).
- Sin Tailwind: componentes propios en `src/ui/<Componente>/` (una carpeta por componente).
- Lint con **oxlint** (no ESLint), formato con Prettier. Deploy en Vercel.

## Mapa

- `src/features/<dominio>/` — analysis, auth, card, expenses, fixed, home, incomes, month, profile, shopping.
- `src/app/` — layout (barra con notch, header glass), errores, reload de la app.
- `src/lib/` — db, sync, supabase, cotización del dólar (`exchangeRates`, `useDollarRate`).

## Verificación

- `pnpm check` es el gate completo: typecheck + lint + format:check + tests + **size budget**.
- Tests con Vitest, colocados junto al código (`*.test.ts`); IndexedDB se mockea con `fake-indexeddb`.
- `scripts/size.mjs`: el bundle inicial tiene presupuesto de **230 KB gzip**. Si se pasa, no subir
  el budget por defecto: se sube a propósito y con una razón. Preferir lazy-load de pantallas.
- Cambios visuales: verificar con Playwright (`pnpm dev`); es mobile-first, probar en viewport de celular.

## Convenciones

- Commits: conventional commits en **inglés**, sin scope (`feat: shared fixed expenses`).
- `.env.local` tiene las claves de Supabase: no imprimir sus valores.
- Repo personal (GitHub `Mugmask`): no aplica el flujo de Educabot (ODD/Jira/pub).
