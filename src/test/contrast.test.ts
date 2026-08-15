// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// WCAG AA thresholds.
const AA_TEXT = 4.5 // normal-size text
const AA_UI = 3.0 // large text + UI component boundaries

type OKLCH = [number, number, number]

// oklch(L C H) → WCAG relative luminance (via oklab → linear sRGB).
function luminance([L, C, H]: OKLCH): number {
  const hr = (H * Math.PI) / 180
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const clamp = (x: number): number => Math.min(1, Math.max(0, x))
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

function contrast(c1: OKLCH, c2: OKLCH): number {
  const y1 = luminance(c1)
  const y2 = luminance(c2)
  const hi = Math.max(y1, y2)
  const lo = Math.min(y1, y2)
  return (hi + 0.05) / (lo + 0.05)
}

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8')

function parseBlock(selector: string): Record<string, OKLCH> {
  const start = css.indexOf(`${selector} {`)
  const end = css.indexOf('}', start)
  const block = css.slice(start, end)
  const map: Record<string, OKLCH> = {}
  const re = /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block))) {
    map[m[1]!] = [Number(m[2]), Number(m[3]), Number(m[4])]
  }
  return map
}

function token(map: Record<string, OKLCH>, name: string): OKLCH {
  const v = map[name]
  if (!v) throw new Error(`token --${name} not found`)
  return v
}

const themes: Array<[string, Record<string, OKLCH>]> = [
  ['light', parseBlock(':root')],
  ['dark', parseBlock('.dark')],
]

describe('palette contrast (WCAG AA)', () => {
  for (const [theme, t] of themes) {
    it(`${theme}: body text on background & card ≥ 4.5`, () => {
      expect(contrast(token(t, 'foreground'), token(t, 'background'))).toBeGreaterThanOrEqual(AA_TEXT)
      expect(contrast(token(t, 'foreground'), token(t, 'card'))).toBeGreaterThanOrEqual(AA_TEXT)
    })
    it(`${theme}: muted text on background ≥ 4.5`, () => {
      expect(contrast(token(t, 'muted-foreground'), token(t, 'background'))).toBeGreaterThanOrEqual(AA_TEXT)
    })
    it(`${theme}: primary button text ≥ 4.5`, () => {
      expect(contrast(token(t, 'primary-foreground'), token(t, 'primary'))).toBeGreaterThanOrEqual(AA_TEXT)
    })
    it(`${theme}: destructive button text ≥ 4.5`, () => {
      // white primary-foreground sits on destructive backgrounds (delete buttons, confirm dialog)
      expect(contrast(token(t, 'primary-foreground'), token(t, 'destructive'))).toBeGreaterThanOrEqual(AA_TEXT)
    })
    it(`${theme}: focus ring vs background ≥ 3.0`, () => {
      expect(contrast(token(t, 'ring'), token(t, 'background'))).toBeGreaterThanOrEqual(AA_UI)
    })
  }
})
