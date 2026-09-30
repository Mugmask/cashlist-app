import {
  AllAppleDeviceNames,
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

// Same as --color-bg: icons and splash screens blend into the app's background
const BACKGROUND = '#0a0b0d'

const IPHONES = AllAppleDeviceNames.filter((name) => name.startsWith('iPhone'))

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: combinePresetAndAppleSplashScreens(
    {
      ...minimal2023Preset,
      // logo.svg is full-bleed with the mark inside the safe zone: no extra padding needed
      maskable: { sizes: [512], padding: 0, resizeOptions: { background: BACKGROUND } },
      apple: { sizes: [180], padding: 0, resizeOptions: { background: BACKGROUND } },
    },
    {
      // iOS shows these while the installed app starts (Android builds its own from the manifest)
      padding: 0.3,
      resizeOptions: { background: BACKGROUND, fit: 'contain' },
      linkMediaOptions: { log: false, addMediaScreen: true, xhtml: false },
      // Explicit name: with no dark variant, the default names the files "…-portrait-1179x2556"
      // but links them as "…-portrait-light-1179x2556", so iOS would find no splash at all
      name: (landscape, size) =>
        `apple-splash-${landscape ? 'landscape' : 'portrait'}-${size.width}x${size.height}.png`,
    },
    IPHONES,
  ),
  images: ['public/logo.svg'],
})
