// Same markup as the boot splash in index.html (styled there, globally), shown while the
// session loads, so the first paint and the app's first render look like one continuous splash
export function SplashScreen() {
  return (
    <div className="boot-splash" role="status" aria-label="Cargando Cashlist">
      <img src="/logo.svg" alt="" />
      <div>
        cash<span>list</span>
      </div>
    </div>
  )
}
