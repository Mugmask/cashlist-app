// Color math on #rrggbb strings: how readable one is on another, how alike two look

export const HEX_COLOR = /^#[0-9a-f]{6}$/i

function channels(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
}

function toLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// WCAG contrast ratio between two colors, 1 to 21
export function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// The color mixed with white: 0 as is, 1 white
export function mixWithWhite(hex: string, amount: number) {
  const mixed = channels(hex).map((c) =>
    Math.round((c + (1 - c) * amount) * 255)
      .toString(16)
      .padStart(2, '0'),
  )
  return `#${mixed.join('')}`
}

// OKLab: a space where distance follows how different two colors look to the eye
function toOklab(hex: string) {
  const [r, g, b] = channels(hex).map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363588661 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

// How different two colors look: 0 the same, about 0.05 hard to tell apart side by side
export function colorDistance(a: string, b: string) {
  const [l1, a1, b1] = toOklab(a)
  const [l2, a2, b2] = toOklab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}
