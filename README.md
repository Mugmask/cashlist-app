# Cashlist

App personal de finanzas: gastos, ingresos, gastos fijos (compartidos, en dólares, con
vencimiento), tarjeta con cuotas, análisis del mes y lista de compras con recetas. Es una PWA
offline-first: se instala en el celular y anda sin conexión.

- **Producción:** https://cashlist-app.vercel.app (rama `main`)
- **Staging:** https://cashlist-staging.vercel.app (rama `develop`, detrás del login de Vercel)

## Arrancar

Requisitos: **Node 24** (`.nvmrc`) y **pnpm 11** (`packageManager` en `package.json`; con
`corepack enable` se usa la versión correcta). Docker solo hace falta para el Supabase local.

```bash
pnpm install
pnpm dev
```

Listo: `pnpm dev` corre en **modo local**, sin cuenta ni sync y con datos de ejemplo. No hace falta
configurar nada, y desarrollar nunca escribe en producción.

## Ambientes

| Dónde                    | Datos                                            | Para qué                                     |
| ------------------------ | ------------------------------------------------ | -------------------------------------------- |
| `pnpm dev`               | Modo local, datos de ejemplo en el navegador     | Desarrollar el día a día                     |
| `pnpm dev:sync`          | Supabase local en Docker (`pnpm db:start` antes) | Trabajar en login, sync o migraciones        |
| `pnpm dev:prod`          | Supabase de producción (`.env.local`)            | Solo a propósito, cuando hace falta          |
| Preview de Vercel por PR | Modo local, datos de ejemplo                     | Ver un cambio en el celular antes de mergear |
| Staging (`develop`)      | Modo local, datos de ejemplo                     | Probar lo integrado antes de producción      |
| Producción (`main`)      | Supabase de producción                           | La app real                                  |

- **Modo local**: sin `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` la app arranca sin login ni
  sync, y un navegador vacío se llena con tres meses de datos de ejemplo relativos a hoy. El
  perfil tiene "Volver a los datos de ejemplo". Cada navegador tiene su copia: no se comparte
  entre dispositivos.
- **`pnpm dev:sync`** crea la primera vez el usuario `dev@cashlist.local` / `cashlist-dev` en el
  Supabase local y se niega a correr contra otra cosa que no sea local.
- **`pnpm dev:prod`** necesita `.env.local` con las claves del proyecto (copiá `.env.example`,
  valores en Supabase → Project Settings → API). Lo que hagas ahí es real.
- En Vercel las env de Supabase están solo en **Production** (y Development). Por eso los
  previews y staging corren en modo local. Un deploy de producción sin esas env falla a propósito
  (`vite.config.ts`).

## Cómo está hecha

- **React 19 + Vite + TypeScript**, React Router. PWA con `vite-plugin-pwa` (Workbox); cuando hay
  versión nueva, la app ofrece recargar.
- **Offline-first**: los datos viven en IndexedDB vía **Dexie** (`src/lib/db/`). Un motor de sync
  propio (`src/lib/sync/`) los sube y baja de **Supabase**: last write wins por `updatedAt`, borrados
  lógicos (`deleted`) y cambios pendientes marcados con `pending`. Sincroniza al abrir, al volver
  la conexión o la app al frente, cada minuto, y cuando Realtime avisa que otro dispositivo
  cambió algo.
- **Sin Tailwind ni librería de UI**: componentes propios en `src/ui/<Componente>/`, con CSS
  Modules. Mobile-first.

```
src/
  app/        layout (barra inferior con notch, header), router, pantallas de error, recarga
  features/   un dominio por carpeta: analysis, auth, card, expenses, fixed, home, incomes,
              month, profile, shopping
  lib/        db (Dexie + migraciones), sync, supabase, demo (datos de ejemplo), cotización del dólar
  ui/         componentes compartidos
  utils/      fechas, moneda, texto, errores
supabase/
  migrations/ schema de Postgres (RLS por usuario)
scripts/      size.mjs (tamaño del bundle), dev-sync.mjs (pnpm dev:sync)
```

### Agregar una tabla o un campo

Los datos existen en dos lados y tienen que cambiar juntos:

1. Migración de Supabase: `pnpm db:new <nombre>` y escribirla en `supabase/migrations/`. Tiene que
   aplicar sobre una base vacía (el CI lo verifica).
2. Versión nueva de Dexie en `src/lib/db/index.ts`, con su test de migración.
3. Si es una tabla nueva, sumarla al sync en `src/lib/sync/tables.ts`.
4. Probarla con `pnpm db:reset` (o `pnpm db:start`) + `pnpm dev:sync`.
5. Aplicarla en producción recién cuando el cambio sale a `main`: `pnpm db:push:check` muestra qué
   se aplicaría, y `pnpm db:push` la aplica. Las dos necesitan el proyecto linkeado una vez:
   `pnpm exec supabase link --project-ref juxvyttkoubunlqzadlz` (pide la contraseña de la base).

La migración más vieja es `20261005000024_baseline.sql`: todo el schema hasta esa fecha, unificado
desde las migraciones anteriores y verificado igual a producción. No se edita: los cambios van en
migraciones nuevas. Nunca aplicar SQL a mano en producción (SQL Editor, MCP): el historial de
migraciones dejaría de coincidir con los archivos y `db push` volvería a ser peligroso.

## Flujo de trabajo

1. Rama desde `develop`: `feature/<descripcion>`.
2. PR contra `develop`. Corre **Preflight** y Vercel arma un preview.
3. Con los checks en verde, merge (squash). `develop` se ve en staging.
4. Para salir a producción: PR de `develop` a `main`, mergeado con **merge commit** (no squash, así
   las dos ramas no divergen).

`main` y `develop` están protegidas: solo entran PRs, con `verify` y `migrations` en verde.

- **Preflight** (`.github/workflows/preflight.yml`): `verify` (formato, lint, typecheck, tests,
  build) y `migrations` (todas las migraciones desde cero en un Postgres local + `supabase db
lint`).
- **Hooks de git** (husky): pre-commit corre oxlint y Prettier sobre lo staged; pre-push corre
  typecheck y tests.
- **Dependabot**: un PR por mes con minors y patches contra `develop`; las majors se hacen a mano.
  Las alertas de seguridad abren PR enseguida, majors incluidas.
- **Commits**: conventional commits en inglés, sin scope (`feat: shared fixed expenses`).

## Scripts

| Comando              | Qué hace                                                        |
| -------------------- | --------------------------------------------------------------- |
| `pnpm dev`           | Dev server en modo local (ver [Ambientes](#ambientes))          |
| `pnpm dev:sync`      | Dev server contra el Supabase local                             |
| `pnpm dev:prod`      | Dev server contra producción                                    |
| `pnpm check`         | Lo mismo que `verify` en el CI: typecheck, lint, formato, tests |
| `pnpm test`          | Tests (Vitest; `test:watch` en modo watch)                      |
| `pnpm lint:fix`      | oxlint con autofix                                              |
| `pnpm format`        | Prettier sobre todo el repo                                     |
| `pnpm build`         | Build de producción                                             |
| `pnpm size`          | Build + tamaño gzip del JS que carga al arrancar (informativo)  |
| `pnpm db:start`      | Supabase local en Docker, con todas las migraciones             |
| `pnpm db:stop`       | Lo apaga                                                        |
| `pnpm db:reset`      | Recrea la base local desde las migraciones                      |
| `pnpm db:new`        | Migración nueva vacía                                           |
| `pnpm db:lint`       | Lint del schema de la base local                                |
| `pnpm db:push:check` | Qué migraciones se aplicarían en producción (dry run)           |
| `pnpm db:push`       | Aplica las migraciones pendientes en producción                 |

Los tests van junto al código (`*.test.ts`); IndexedDB se simula con `fake-indexeddb`.
