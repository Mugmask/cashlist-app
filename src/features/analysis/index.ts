// Public API of the feature: the rest of the app imports only from here
// The screen loads when it's first opened, not with the app: see app/router.tsx
export const loadAnalysisPage = () =>
  import('./AnalysisPage').then((m) => ({ Component: m.AnalysisPage }))
export { carryOver, type CarryOver } from './carryOver'
export { changeByCategory, variableChange } from './comparison'
export { Change } from './components/Change'
export { describeChange } from './insight'
