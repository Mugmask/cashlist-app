// Public API of the feature: the rest of the app imports only from here
export { ShoppingHomeCard } from './components/ShoppingHomeCard'
// The screen loads when it's first opened, not with the app: see app/router.tsx
export const loadShoppingPage = () =>
  import('./ShoppingPage').then((m) => ({ Component: m.ShoppingPage }))
export { useShoppingList } from './useShoppingList'
