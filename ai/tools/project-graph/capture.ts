import path from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { scanProject } from './scan'
import { dependencyFingerprint } from './impact'
import { hash } from './source'
import { writeJson } from './run'
import { coveragePlanSchema, type BranchHits, type CoveragePlan, type CoverageReceipt } from './coverage'
import type { ProjectGraph } from './types'

async function hits(page: Page): Promise<BranchHits> {
  return page.evaluate(() => JSON.parse(JSON.stringify((globalThis as unknown as { __ATELIER_BRANCH_COVERAGE__: { hits: BranchHits } }).__ATELIER_BRANCH_COVERAGE__.hits)))
}

export async function captureFrame(browser: Browser, url: string, graph: ProjectGraph, rawPlan: CoveragePlan): Promise<CoverageReceipt> {
  const plan = coveragePlanSchema.parse(rawPlan)
  const frame = graph.frames.find(frame => frame.name === plan.frame)
  if (!frame || !frame.states.includes(plan.state)) throw new Error(`Unknown frame/state ${plan.frame}/${plan.state}`)
  const variants = Object.fromEntries(frame.variants.map(axis => [axis, graph.variants[axis].default]))
  for (const [axis, value] of Object.entries(plan.variants)) {
    if (!frame.variants.includes(axis) || !graph.variants[axis]?.values.includes(value)) throw new Error(`Invalid variant ${axis}=${value} for ${frame.name}`)
    variants[axis] = value
  }
  const canonicalPlan = { ...plan, variants: Object.fromEntries(Object.entries(variants).sort(([a], [b]) => a.localeCompare(b))) }
  const receipt: CoverageReceipt = {
    schemaVersion: 2, id: hash(JSON.stringify(canonicalPlan)).slice(0, 24), frame: frame.name, frameId: frame.id,
    state: plan.state, variants: canonicalPlan.variants, fingerprint: dependencyFingerprint(graph, frame.id),
    servedFingerprint: graph.fingerprint, loadedSources: {},
    capturedAt: new Date().toISOString(), plan: canonicalPlan, status: 'executed', assertions: 0, errors: [], hits: {}, checkpoints: [],
  }
  // New context per execution prevents module-level mocks and pending work leaking between states.
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  try {
    await context.addInitScript(() => {
      const recorder = {
        hits: {} as Record<string, Record<string, number>>,
        sources: {} as Record<string, string>,
        register(file: string, digest: string) { this.sources[file] = digest },
        hit(id: string, value: unknown, kind: string) {
          const outcome = kind === 'case' ? 'entered' : kind === 'nullish' ? value == null ? 'nullish' : 'present' : String(Boolean(value))
          const outcomes = this.hits[id] ?? (this.hits[id] = {})
          outcomes[outcome] = (outcomes[outcome] ?? 0) + 1
        },
      }
      ;(globalThis as unknown as { __ATELIER_BRANCH_COVERAGE__: typeof recorder }).__ATELIER_BRANCH_COVERAGE__ = recorder
    })
    const page = await context.newPage()
    page.on('pageerror', error => receipt.errors.push(error.message))
    const target = new URL('/.atelier/index.html', url)
    target.searchParams.set('story', frame.name)
    target.searchParams.set('state', plan.state)
    target.searchParams.set('v', Object.entries(variants).map(([key, value]) => `${key}:${value}`).join(','))
    await page.goto(target.toString(), { waitUntil: 'load', timeout: 30000 })
    await page.locator('[data-atelier-frame]').waitFor({ state: 'visible' })
    const rendered = await page.locator('[data-atelier-frame]').getAttribute('data-atelier-frame')
    const state = await page.locator('[data-atelier-frame]').getAttribute('data-atelier-state')
    if (rendered !== frame.name || state !== plan.state) throw new Error(`Preview selected ${rendered}/${state}, expected ${frame.name}/${plan.state}`)
    await page.waitForTimeout(plan.settleMs)
    receipt.checkpoints.push({ step: 'initial', hits: await hits(page) })
    for (let index = 0; index < plan.steps.length; index++) {
      const step = plan.steps[index]
      if (step.action === 'wait') await page.waitForTimeout(step.ms)
      else {
        const locator = page.locator('[data-atelier-frame]').locator(step.selector)
        if (step.action === 'click') await locator.click({ timeout: 5000 })
        if (step.action === 'fill') await locator.fill(step.value, { timeout: 5000 })
        if (step.action === 'assert-visible') { await locator.waitFor({ state: 'visible', timeout: 5000 }); receipt.assertions++ }
        if (step.action === 'assert-text') {
          await locator.waitFor({ state: 'visible', timeout: 5000 })
          const deadline = Date.now() + 5000
          while (!(await locator.innerText()).includes(step.text) && Date.now() < deadline) await page.waitForTimeout(25)
          if (!(await locator.innerText()).includes(step.text)) throw new Error(`Expected ${step.selector} to contain ${JSON.stringify(step.text)}`)
          receipt.assertions++
        }
      }
      receipt.checkpoints.push({ step: `${index + 1}:${step.action}`, hits: await hits(page) })
    }
    receipt.hits = await hits(page)
    receipt.loadedSources = await page.evaluate(() => (globalThis as unknown as { __ATELIER_BRANCH_COVERAGE__: { sources: Record<string, string> } }).__ATELIER_BRANCH_COVERAGE__.sources)
    if (!receipt.loadedSources[frame.file]) throw new Error('The selected frame did not register instrumented source provenance.')
    for (const [file, digest] of Object.entries(receipt.loadedSources)) {
      if (graph.files[file] !== digest) throw new Error(`Served module ${file} differs from the scanned source. Re-run against the matching preview.`)
    }
    if (receipt.assertions > 0) receipt.status = 'asserted'
  } catch (error) { receipt.errors.push(String(error)) }
  finally { await context.close() }
  if (receipt.errors.length) receipt.status = 'failed'
  return receipt
}

export async function runFrameCoverage(options: { rootDir?: string; url: string; plans: CoveragePlan[]; graph?: ProjectGraph }): Promise<CoverageReceipt[]> {
  const root = path.resolve(options.rootDir ?? process.cwd())
  const graph = options.graph ?? scanProject(root)
  async function checkServer() {
    const response = await fetch(new URL('/api/atelier-coverage', options.url))
    if (!response.ok) throw new Error('Cannot read instrumented preview provenance.')
    const provenance = await response.json() as { enabled?: boolean; version?: number; fingerprint?: string }
    if (!provenance.enabled || provenance.version !== 2) throw new Error('Coverage instrumentation is disabled or outdated. Start preview with ATELIER_COVERAGE=1, or omit --url to start an isolated instrumented server.')
    if (provenance.fingerprint !== graph.fingerprint) throw new Error('Instrumented preview source does not match the scanned project. Use the matching checkout and retry.')
  }
  await checkServer()
  const browser = await chromium.launch({ headless: true })
  const receipts: CoverageReceipt[] = []
  try {
    for (const plan of options.plans) {
      const receipt = await captureFrame(browser, options.url, graph, plan)
      receipts.push(receipt)
    }
  } finally { await browser.close() }
  await checkServer()
  const current = scanProject(root)
  for (const receipt of receipts) {
    if (dependencyFingerprint(current, receipt.frameId) !== receipt.fingerprint) {
      receipt.status = 'failed'
      receipt.errors.push('Dependencies changed during capture. Re-run against the current source.')
    }
    await writeJson(path.join(root, '.atelier/coverage', `${receipt.id}.json`), receipt)
  }
  return receipts
}
