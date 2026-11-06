import path from 'node:path'
import { parseArgs } from 'node:util'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { scanProject } from '../ai/tools/project-graph/scan'
import { defaultCoveragePlans, coveragePlanSchema } from '../ai/tools/project-graph/coverage'
import { runFrameCoverage } from '../ai/tools/project-graph/capture'
import { runProjectScan } from '../ai/tools/project-graph/run'

async function main() {
  const { values } = parseArgs({ options: { root: { type: 'string' }, url: { type: 'string' }, frame: { type: 'string' }, state: { type: 'string' }, plan: { type: 'string' }, 'settle-ms': { type: 'string' } } })
  const root = path.resolve(values.root ?? process.cwd())
  const graph = scanProject(root)
  const selection = values.plan ? { plans: z.array(coveragePlanSchema).parse(JSON.parse(await readFile(values.plan, 'utf8'))), omissions: [] } : defaultCoveragePlans(graph, values.frame, values.state)
  if (values['settle-ms']) for (const plan of selection.plans) plan.settleMs = coveragePlanSchema.shape.settleMs.parse(Number(values['settle-ms']))
  for (const omission of selection.omissions) console.warn(omission)
  let server: Awaited<ReturnType<(typeof import('vite'))['createServer']>> | undefined
  let url = values.url
  if (!url) {
    process.env.ATELIER_COVERAGE = '1'
    const { createServer } = await import('vite')
    server = await createServer({ root, configFile: path.join(root, 'vite.atelier.config.ts'), server: { port: 0, open: false, host: '127.0.0.1' } })
    try { await server.listen() } catch (error) { await server.close(); throw error }
    url = server.resolvedUrls?.local[0]
    if (!url) { await server.close(); throw new Error('Could not determine preview URL') }
  }
  try {
    const receipts = await runFrameCoverage({ rootDir: root, url, plans: selection.plans, graph: scanProject(root) })
    for (const receipt of receipts) console.log(`${receipt.status}: ${receipt.frame}/${receipt.state} ${JSON.stringify(receipt.variants)} (${Object.keys(receipt.hits).length} branch decisions, ${receipt.assertions} assertions)${receipt.errors.length ? ` — ${receipt.errors.join('; ')}` : ''}`)
    if (receipts.some(receipt => receipt.status === 'failed')) process.exitCode = 1
    await runProjectScan({ rootDir: root })
  } finally { await server?.close() }
}
main().catch(error => { console.error(String(error)); process.exitCode = 1 })
