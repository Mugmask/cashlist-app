# cashlist-app

App personal de finanzas: ingresos, gastos, gastos fijos (compartidos, con día de vencimiento y
notas), tarjeta, análisis mensual y lista de compras. PWA offline-first.
El README es la guía para cualquier dev (ambientes, flujo, scripts); esto es lo que además importa
para trabajar con Claude.

## Stack

- React 19 + Vite + TypeScript, react-router. PWA con `vite-plugin-pwa` (Workbox).
- **Offline-first**: los datos viven local en IndexedDB vía **Dexie** (`src/lib/db/`) y se
  sincronizan con **Supabase** con un motor propio (`src/lib/sync/`: `engine.ts`, `tables.ts`,
  `useAutoSync`, `useFirstSync`). Cualquier tabla nueva tiene que pasar por el sync y su migración.
- Migraciones: Dexie (`src/lib/db`, con tests de migración) + Supabase (`supabase/migrations/`).
  La primera es `20261005000024_baseline.sql` (las 24 originales unificadas, verificadas iguales
  a prod); no se edita. En producción se aplican con `pnpm db:push` (proyecto linkeado), nunca a
  mano ni con `apply_migration` del MCP: desincroniza el historial. `pnpm db:push` escribe en
  producción: correrlo solo si Fran lo pide, y antes `pnpm db:push:check`.
- Sin Tailwind: componentes propios en `src/ui/<Componente>/` (una carpeta por componente).
- Lint con **oxlint** (no ESLint), formato con Prettier. Deploy en Vercel.

## Mapa

- `src/features/<dominio>/` — analysis, auth, card, expenses, fixed, home, incomes, month, profile, shopping.
- `src/app/` — layout (barra con notch, header glass), errores, reload de la app.
- `src/lib/` — db, sync, supabase, demo (datos de ejemplo), cotización del dólar (`exchangeRates`,
  `useDollarRate`).

## Verificación

- `pnpm check` es el gate completo: typecheck + lint + format:check + tests.
- Tests con Vitest, colocados junto al código (`*.test.ts`); IndexedDB se mockea con `fake-indexeddb`.
- `pnpm size` (`scripts/size.mjs`) reporta el JS inicial gzip. Es informativo, no un gate; igual
  preferir lazy-load de pantallas y de lo que no hace falta al arrancar.
- Cambios visuales: verificar con Playwright (`pnpm dev`); es mobile-first, probar en viewport de celular.
- `pnpm dev` corre en **modo local** con los datos de ejemplo (`.env.development` vacía las env de
  Supabase y le gana a `.env.local` solo en dev). `pnpm dev:sync` va contra Supabase local
  (`scripts/dev-sync.mjs`, crea `dev@cashlist.local` / `cashlist-dev`). `pnpm dev:prod` va contra
  producción: solo si Fran lo pide.
- Hooks (husky): pre-commit corre lint-staged (oxlint --fix + prettier), pre-push typecheck + tests.

## CI, entornos y ramas

- `.github/workflows/preflight.yml` en cada PR/push a `main` y `develop`: `verify` (format, lint,
  typecheck, unit, build) y `migrations` (aplica todas las migraciones desde cero en un
  Postgres local con el CLI de Supabase y corre `supabase db lint`).
- **Modo local**: sin `VITE_SUPABASE_*` la app arranca sin login ni sync (usuario `local`, datos
  solo en el navegador). Así corren los previews de Vercel. Un build con
  `VERCEL_ENV=production` sin esas env falla a propósito (`vite.config.ts`).
- En modo local, un navegador vacío arranca con **datos de ejemplo** (`src/lib/demo/`: tres meses
  relativos a hoy, cargados on demand). El perfil tiene "Volver a los datos de ejemplo".
- **Staging**: https://cashlist-staging.vercel.app sigue a `develop` (dominio de Vercel atado a la
  rama), en modo local con los datos de ejemplo. Detrás del login de Vercel.
- No hay Supabase de staging (el plan free ya tiene sus 2 proyectos): para probar sync/migraciones
  se usa Supabase local (`pnpm db:start`, requiere Docker). Una migración tiene que aplicar en una
  base vacía: nada que dependa de objetos que solo existen en el proyecto cloud.
- Ramas: `develop` es integración, `main` es producción. Las features van por PR a `develop`
  (`feature/<descripcion>`). Claude no crea ramas por su cuenta: Fran la nombra o aprueba el
  nombre que Claude propone.

## Flujo de trabajo (seguirlo sin que haga falta pedirlo)

1. **Rama** desde `develop` actualizado: `git switch develop && git pull`, después
   `git switch -c feature/<descripcion>`.
2. **Desarrollar** con `pnpm dev` (modo local). Si toca login o sync: `pnpm db:start` +
   `pnpm dev:sync`. Cambios visuales: screenshot con Playwright en viewport de celular, en modo
   local (nunca contra prod).
3. **Si cambia el modelo**: `pnpm db:new <nombre>` en `supabase/migrations/` + versión nueva de
   Dexie en `src/lib/db/index.ts` con su test + `src/lib/sync/tables.ts` si es tabla nueva.
   Probar con `pnpm db:reset` + `pnpm dev:sync`.
4. **Antes de commitear**: `pnpm check` en verde. Commits chicos y con sentido propio.
5. **PR contra `develop`** con el template (`gh pr create --base develop`). Esperar los checks
   **del PR** (`gh pr checks <n> --watch`), no los de un push previo: la protección rechaza el
   merge si los del PR siguen corriendo. Merge con **squash** + `--delete-branch`. Después:
   `git switch develop && git pull` y `git branch -D` de la rama local (con squash, `-d` no la
   reconoce como mergeada).
6. **Release a producción**, solo cuando Fran lo pide:
   1. Si hay migraciones nuevas: `pnpm db:push:check`, mostrarle qué se aplica, y con su OK
      `pnpm db:push`. **Antes** del merge a `main`: la app nueva tiene que encontrar la base lista.
   2. PR `develop` → `main` (`release: …`), mergeado con **merge commit** (`gh pr merge --merge`,
      nunca squash: las ramas divergirían).
   3. Confirmar el deploy: el status `Vercel` del commit de merge en GitHub tiene que dar
      `success`, y https://cashlist-app.vercel.app tiene que responder 200.

### Referencias

- GitHub `Mugmask/cashlist-app` (público). El token de `gh` necesita el scope `workflow` para
  mergear PRs que tocan `.github/workflows/` (Dependabot de actions, por ejemplo).
- Supabase: proyecto `juxvyttkoubunlqzadlz` (cashlist-app), linkeado en la máquina de Fran.
- Vercel: proyecto `prj_SXDRHy8VKBLn019d7y5IdbDPzfft`, team `team_ftz3Cep2eBNzvxgxYd20bcpt`. Las env
  de Supabase están solo en Production y Development (los previews no deben tenerlas).
- Dependabot abre un PR mensual contra `develop`: si el CI está verde se mergea como cualquier
  otro. Las majors no las abre: se hacen a mano cuando valen la pena.

## Convenciones

- Commits: conventional commits en **inglés**, sin scope (`feat: shared fixed expenses`).
- `.env.local` tiene las claves de Supabase de producción (las usan los builds y `dev:prod`): no
  imprimir sus valores.
- Repo personal (GitHub `Mugmask`): no aplica el flujo de Educabot (ODD/Jira/pub).
