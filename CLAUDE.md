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

- `pnpm check` es el gate completo: typecheck + lint + format:check + tests.
- Tests con Vitest, colocados junto al código (`*.test.ts`); IndexedDB se mockea con `fake-indexeddb`.
- `pnpm size` (`scripts/size.mjs`) reporta el JS inicial gzip. Es informativo, no un gate; igual
  preferir lazy-load de pantallas y de lo que no hace falta al arrancar.
- Cambios visuales: verificar con Playwright (`pnpm dev`); es mobile-first, probar en viewport de celular.
- Hooks (husky): pre-commit corre lint-staged (oxlint --fix + prettier), pre-push typecheck + tests.

## CI, entornos y ramas

- `.github/workflows/preflight.yml` en cada PR/push a `main` y `develop`: `verify` (format, lint,
  typecheck, unit, build) y `migrations` (aplica todas las migraciones desde cero en un
  Postgres local con el CLI de Supabase y corre `supabase db lint`).
- **Modo local**: sin `VITE_SUPABASE_*` la app arranca sin login ni sync (usuario `local`, datos
  solo en el navegador). Así corren los previews de Vercel. Un build con
  `VERCEL_ENV=production` sin esas env falla a propósito (`vite.config.ts`).
- En modo local, un navegador vacío arranca con **datos de ejemplo** (`src/lib/demo/`: un mes y
  medio relativo a hoy, cargado on demand). El perfil tiene "Volver a los datos de ejemplo".
- **Staging**: https://cashlist-staging.vercel.app sigue a `develop` (dominio de Vercel atado a la
  rama), en modo local con los datos de ejemplo. Detrás del login de Vercel.
- No hay Supabase de staging (el plan free ya tiene sus 2 proyectos): para probar sync/migraciones
  se usa Supabase local (`pnpm db:start`, requiere Docker). Una migración tiene que aplicar en una
  base vacía: nada que dependa de objetos que solo existen en el proyecto cloud.
- Ramas: `develop` es integración, `main` es producción. Las features van por PR a `develop`
  (`feature/<descripcion>`). Las ramas las crea Fran.

## Convenciones

- Commits: conventional commits en **inglés**, sin scope (`feat: shared fixed expenses`).
- `.env.local` tiene las claves de Supabase: no imprimir sus valores.
- Repo personal (GitHub `Mugmask`): no aplica el flujo de Educabot (ODD/Jira/pub).
