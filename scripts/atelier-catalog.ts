import { parseArgs } from 'node:util'
import { readFile } from 'node:fs/promises'
import { bootstrapCatalog } from '../ai/tools/project-graph/bootstrap'

async function main() {
  const { values } = parseArgs({ options: { root: { type: 'string' }, write: { type: 'boolean' }, preview: { type: 'boolean' }, model: { type: 'string' }, 'review-model': { type: 'string' }, threshold: { type: 'string' }, proposal: { type: 'string' } } })
  if (values.preview && values.write) throw new Error('Choose --preview or --write')
  const result = await bootstrapCatalog({ rootDir: values.root, write: values.write, model: values.model, reviewModel: values['review-model'], threshold: values.threshold === undefined ? undefined : Number(values.threshold), proposal: values.proposal ? JSON.parse(await readFile(values.proposal, 'utf8')) : undefined })
  console.log(JSON.stringify(result, null, 2))
}
main().catch(error => { console.error(String(error)); process.exitCode = 1 })
