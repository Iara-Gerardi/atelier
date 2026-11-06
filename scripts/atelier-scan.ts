import path from 'node:path'
import { watch } from 'node:fs'
import { parseArgs } from 'node:util'
import { runProjectScan } from '../ai/tools/project-graph/run'

async function main() {
  const { values } = parseArgs({ options: {
    root: { type: 'string' }, check: { type: 'boolean' }, watch: { type: 'boolean' },
    review: { type: 'boolean' }, 'review-model': { type: 'string' }, json: { type: 'boolean' },
  } })
  if (values.watch && values.check) throw new Error('--watch and --check are mutually exclusive')
  const root = path.resolve(values.root ?? process.cwd())
  let running = false
  let pending = false
  const scan = async () => {
    if (running) { pending = true; return }
    running = true
    try {
      const { graph, report, drift } = await runProjectScan({ rootDir: root, check: values.check, review: values.review, reviewModel: values['review-model'] })
      if (values.json) console.log(JSON.stringify({ drift, ...report }, null, 2))
      else {
        console.log(`Atelier: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.features.length} features, ${graph.usages.length} frame usages.`)
        console.log(`${report.changedFiles.length} changed files; recheck ${report.recheck.frames.length} frames, ${report.recheck.scenes.length} scenes, ${report.recheck.mocks.length} mocks.`)
        for (const finding of report.findings.filter(finding => finding.severity !== 'info')) console.log(`[${finding.severity}] ${finding.code} ${finding.file}: ${finding.message}`)
        console.log('Full graph and evidence: .atelier/generated/{graph,features,report}.json')
      }
      if (values.check) process.exitCode = drift || report.findings.some(finding => finding.severity === 'error') ? 1 : 0
    } catch (error) {
      if (!values.watch) throw error
      console.error(`Atelier scan failed: ${String(error)}`)
    } finally {
      running = false
      if (pending) { pending = false; void scan() }
    }
  }
  if (values.watch) {
    let timer: ReturnType<typeof setTimeout> | undefined
    const watcher = watch(root, { recursive: true }, (_event, filename) => {
      const file = String(filename ?? '').replaceAll('\\', '/')
      if (/(^|\/)(node_modules|\.git|\.next|coverage|generated|reports|dist|build|\.devtools)(\/|$)/.test(file)) return
      if (!/\.[cm]?[jt]sx?$|(?:^|\/)tsconfig[^/]*\.json$|^(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$|^features\/[^/]+\/index\.md$/.test(file)) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void scan(), 300)
    })
    const stop = () => { watcher.close(); if (timer) clearTimeout(timer); process.exitCode = 0 }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  }
  await scan()
}

main().catch(error => { console.error(String(error)); process.exitCode = 1 })
