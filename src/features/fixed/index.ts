// Public API of the feature: the rest of the app imports only from here
export { FixedHomeCard } from './components/FixedHomeCard'
// The screen loads when it's first opened, not with the app: see app/router.tsx
export const loadFixedPage = () => import('./FixedPage').then((m) => ({ Component: m.FixedPage }))
export { useFixedOverview } from './useFixedOverview'
