import axe from 'axe-core'
import { expect } from 'vitest'

// Rules that need full-page/layout context and produce false positives when a
// single component is rendered in isolation under jsdom (jsdom computes no layout
// or color): contrast + the page-level landmark/heading rules.
const ALWAYS_OFF = ['color-contrast', 'region', 'landmark-one-main', 'page-has-heading-one']

export async function expectNoAxeViolations(container: HTMLElement, extraDisabled: string[] = []): Promise<void> {
  const rules: Record<string, { enabled: false }> = {}
  for (const id of [...ALWAYS_OFF, ...extraDisabled]) rules[id] = { enabled: false }

  const results = await axe.run(container, { rules })
  const summary = results.violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n')
  expect(results.violations, summary || 'no violations').toHaveLength(0)
}
