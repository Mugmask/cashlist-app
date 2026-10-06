## Qué cambia

<!-- Qué hace este PR y por qué. -->

## Cómo se probó

- [ ] `pnpm check` en verde
- [ ] E2E (`pnpm test:e2e`) si toca flujos de la UI
- [ ] Probado en el preview de Vercel (modo local, viewport de celular) si es visual

## Datos

- [ ] Sin cambios de schema
- [ ] Migración nueva en `supabase/migrations/` **y** en Dexie (`src/lib/db`), con su test
- [ ] Tabla nueva sincronizada en `src/lib/sync/tables.ts`
