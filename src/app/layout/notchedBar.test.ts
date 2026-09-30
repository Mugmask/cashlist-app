import { describe, expect, it } from 'vitest'
import { BAR_SHAPE, notchedBarPath } from './notchedBar'

// All x coordinates reached by the path's commands (endpoints and control points)
function xs(path: string) {
  const numbers = (cmd: string) => cmd.slice(1).trim().split(/\s+/).map(Number)
  const out: number[] = []
  for (const cmd of path.match(/[MHCAVZ][^MHCAVZ]*/g) ?? []) {
    const n = numbers(cmd)
    if (cmd[0] === 'H') out.push(n[0])
    else if (cmd[0] === 'M') out.push(n[0])
    else if (cmd[0] === 'C') out.push(n[0], n[2], n[4])
    else if (cmd[0] === 'A') out.push(n[5])
  }
  return out
}

describe('notchedBarPath', () => {
  it.each([296, 358, 480])('stays inside the bar and is symmetric at %dpx', (width) => {
    const path = notchedBarPath({ ...BAR_SHAPE, width })
    const x = xs(path)

    expect(Math.min(...x)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...x)).toBeLessThanOrEqual(width)
    // the notch is centered: its two ends mirror around the middle
    const arc = path.match(/A 36 36 0 1 0 ([\d.]+) 7/)!
    const right = Number(arc[1])
    const left = Number(path.match(/C [\d.]+ 0 [\d.]+ [\d.]+ ([\d.]+) 7/)![1])
    expect(left + right).toBeCloseTo(width, 1)
  })

  it('is a closed shape', () => {
    expect(
      notchedBarPath({ ...BAR_SHAPE, width: 358 })
        .trim()
        .endsWith('Z'),
    ).toBe(true)
  })

  it('leaves room for the button: the notch is wider than the button', () => {
    const path = notchedBarPath({ ...BAR_SHAPE, width: 358 })
    const right = Number(path.match(/A 36 36 0 1 0 ([\d.]+) 7/)![1])
    const notchWidth = (right - 179) * 2
    expect(notchWidth).toBeGreaterThan(58)
  })
})
