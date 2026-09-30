// Geometry of the bottom bar: a rounded rectangle with a notch in the middle of its top edge
// where the + button rests. One path drives both the glass clip and the hairline edge, so
// they always match, at any width.

export interface NotchedBarShape {
  width: number
  height: number
  cornerRadius: number
  notchRadius: number // button radius + the gap around it
  notchCenterY: number // how far below the top edge the button's center sits
  shoulder: number // width of the soft curve easing the top edge into the notch
}

export const BAR_SHAPE: Omit<NotchedBarShape, 'width'> = {
  height: 68, // --bottom-nav-height
  cornerRadius: 24, // --radius-lg
  notchRadius: 36, // 58px button → 29 + 7px gap
  notchCenterY: 18, // sunk into the bar, sticking out 11px above it
  shoulder: 11,
}

// Where the shoulder curve meets the notch circle, measured down from the top edge
const SHOULDER_DEPTH = 7

const round = (n: number) => Math.round(n * 100) / 100

export function notchedBarPath({
  width: w,
  height: h,
  cornerRadius: r,
  notchRadius: R,
  notchCenterY: cy,
  shoulder: s,
}: NotchedBarShape) {
  const cx = w / 2
  // Half-width of the circle at the shoulder's depth
  const half = Math.sqrt(R * R - (cy - SHOULDER_DEPTH) ** 2)
  const left = cx - half
  const right = cx + half
  const d = SHOULDER_DEPTH

  return [
    `M 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    `H ${round(left - s)}`,
    // left shoulder: flat at first, then bending down into the circle
    `C ${round(left - s / 2)} 0 ${round(left - 1.5)} ${round(d * 0.45)} ${round(left)} ${d}`,
    // the notch: the larger arc, around the button's bottom (its center is below this point)
    `A ${R} ${R} 0 1 0 ${round(right)} ${d}`,
    `C ${round(right + 1.5)} ${round(d * 0.45)} ${round(right + s / 2)} 0 ${round(right + s)} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    'Z',
  ].join(' ')
}
