# Cashlist

App personal de finanzas: gastos, ingresos, gastos fijos, tarjeta, análisis del mes y lista de
compras. PWA offline-first (React + Vite, Dexie, sync con Supabase).

## Arrancar

```bash
pnpm install
cp .env.example .env.local   # URL y anon key del proyecto de Supabase
pnpm dev
```

Sin `.env.local` la app corre igual en **modo local**: sin cuenta ni sync, los datos quedan en el
navegador. Así funcionan los previews de Vercel, sin tocar la base de producción.

## Scripts

| Comando         | Qué hace                                                     |
| --------------- | ------------------------------------------------------------ |
| `pnpm dev`      | Dev server                                                   |
| `pnpm check`    | Gate completo: typecheck, lint, formato, tests y size budget |
| `pnpm test`     | Tests unitarios (Vitest)                                     |
| `pnpm size`     | Build + presupuesto de 230 KB gzip del JS inicial            |
| `pnpm db:start` | Supabase local en Docker, con todas las migraciones          |
| `pnpm db:reset` | Recrea la base local desde las migraciones                   |
| `pnpm db:new`   | Migración nueva vacía                                        |
| `pnpm db:lint`  | Lint del schema de la base local                             |

## Ramas y CI

- `main` es producción (deploy en Vercel), `develop` es integración. Las features salen de
  `develop` y vuelven por PR.
- En cada PR corre [preflight.yml](.github/workflows/preflight.yml): verify (formato, lint, typecheck,
  unit, size) y migrations (todas las migraciones desde cero + `supabase db lint`).
- Hooks de git (husky): pre-commit formatea y lintea lo staged; pre-push corre typecheck y tests.
- Dependabot abre un PR mensual con los minors y patches contra `develop`; las majors se hacen a
  mano. Las security updates abren PR apenas aparece una vulnerabilidad, majors incluidas.
