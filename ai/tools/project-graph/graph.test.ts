import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { scanProject, walkGraph } from './scan'
import { impactReport, dependencyFingerprint } from './impact'
import { fileId, frameId, symbolId } from './source'
import { runProjectScan, writeJson } from './run'
import { coverageFindings, defaultCoveragePlans, type CoverageReceipt } from './coverage'
import { validateCatalogProposal } from './bootstrap'

const temporary: string[] = []
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }) })
function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'atelier-graph-'))
  temporary.push(root)
  const put = (file: string, source: string) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), source) }
  put('tsconfig.json', JSON.stringify({ compilerOptions: { jsx: 'preserve', baseUrl: '.', paths: { '@/*': ['./*'] }, moduleResolution: 'bundler', module: 'esnext' } }))
  put('actions/student.ts', 'export async function createStudent() { return { ok: true } }')
  put('components/Form.tsx', `import { createStudent } from '@/actions/student'; export function Form({error}: {error: boolean}) { if (error) return <p>Error</p>; return <button onClick={createStudent}>Save</button> }`)
  put('components/Other.tsx', 'export function Other() { return <p>Other</p> }')
  put('components/index.ts', `export { Form as StudentForm } from './Form'; export { Other } from './Other'`)
  put('app/new/page.tsx', `import { StudentForm } from '@/components'; import type { Shared } from '@/types'; export default function Page() { return <StudentForm error={false}/> }`)
  put('types.ts', `export type Shared = { value: string }`)
  put('.atelier/mocks/Form.frame.tsx', `import { Form } from '@/components/Form'; export const meta = {name:'Form', variants:['auth'] as const}; const states = {idle:{render:()=> <Form error={false}/>}, error:{render:()=> <Form error={true}/>}}; export default states`)
  put('.atelier/mocks/Other.frame.tsx', `import { Other } from '@/components/Other'; export const meta={name:'Other'}; export default {default:{render:()=> <Other/>}}`)
  put('.atelier/mocks/actions/student.ts', `export async function createStudent() { return {ok: true} }`)
  put('.atelier/variants.ts', `export const variantAxes={auth:{default:'guest',values:[{value:'guest'},{value:'admin'}]}} as const`)
  put('features/students/index.md', `---\nslug: students\nname: Students\ngoal: Enroll a student\nentries:\n  - file: app/new/page.tsx\n---\n`)
  return { root, put }
}

describe('directed project graph', () => {
  it('derives usages from render/call paths, resolves barrels and does not propagate through type imports or unused exports', () => {
    const { root } = fixture()
    const graph = scanProject(root)
    expect(graph.findings.filter(f => f.severity === 'error')).toEqual([])
    expect(graph.usages.map(u => u.frame)).toEqual([frameId('.atelier/mocks/Form.frame.tsx')])
    expect(graph.usages[0].path).toEqual(['feature:students', fileId('app/new/page.tsx'), symbolId('app/new/page.tsx', 'Page'), symbolId('components/Form.tsx', 'Form')])
    expect(graph.edges.some(e => e.to === symbolId('actions/student.ts', 'createStudent'))).toBe(true)
    expect(scanProject(root)).toEqual(graph)
  })
  it('supports multiple feature tags and symbol exclusions on the same page', () => {
    const { root, put } = fixture()
    put('features/admin/index.md', `---\nslug: admin\nname: Admin\ngoal: Admin registration\nentries:\n  - file: components/Form.tsx\n    symbol: Form\n---\n`)
    let graph = scanProject(root)
    expect(graph.usages.filter(u => u.frame === frameId('.atelier/mocks/Form.frame.tsx')).map(u => u.feature)).toEqual(['admin', 'students'])
    put('features/students/index.md', `---\nslug: students\nname: Students\ngoal: Enroll a student\nentries:\n  - file: app/new/page.tsx\nexclude:\n  - file: components/Form.tsx\n    symbol: Form\n---\n`)
    graph = scanProject(root)
    expect(graph.usages.map(u => u.feature)).toEqual(['admin'])
  })
  it('keeps old reverse dependencies when a target is deleted and rechecks scenes/mocks', () => {
    const { root, put } = fixture()
    put('.atelier/scenes/Students.scene.tsx', `export const meta={name:'Students'}; export default {initial:'start',nodes:{start:{frame:'Form',state:'idle',outcomes:[{id:'done',frame:'Other',state:'default',trigger:'Save',description:'Result'}]}}}`)
    const before = scanProject(root)
    rmSync(path.join(root, 'actions/student.ts'))
    const report = impactReport(scanProject(root), before)
    expect(report.changedFiles).toContain('actions/student.ts')
    expect(report.recheck.frames).toContain('.atelier/mocks/Form.frame.tsx')
    expect(report.recheck.scenes).toEqual(['.atelier/scenes/Students.scene.tsx'])
    expect(report.recheck.mocks).toContain('.atelier/mocks/actions/student.ts')
  })
  it('validates scene references, variant assignments and action mock contracts without executing code', () => {
    const { root, put } = fixture()
    put('.atelier/scenes/Students.scene.tsx', `throw new Error('MUST NOT EXECUTE'); export default { initial:'start',nodes:{start:{frame:'Form',state:'missing',gate:()=>false,outcomes:[{frame:'Form',state:'idle',set:{auth:'alien'}}]}}}`)
    put('.atelier/mocks/actions/student.ts', `export async function createStudent() { return 'wrong' }`)
    const codes = scanProject(root).findings.map(f => f.code)
    expect(codes).toEqual(expect.arrayContaining(['broken-scene-reference', 'invalid-fallback', 'same-frame-outcome', 'invalid-variant-set', 'mock-contract-mismatch']))
  })
  it('reports unknown feature entries and refuses invented catalog symbols', () => {
    const { root, put } = fixture()
    put('features/students/index.md', `---\nslug: students\nname: Students\ngoal: Enroll\nentries:\n  - file: missing.tsx\n---\n`)
    const graph = scanProject(root)
    expect(graph.findings.map(f => f.code)).toContain('invalid-feature-entry')
    expect(() => validateCatalogProposal(graph, [{slug:'x',name:'X',goal:'X',entries:[{file:'components/Form.tsx',symbol:'Imagined'}]}])).toThrow('Unknown symbol')
  })
  it('handles cycles in both traversal directions', () => {
    const edges = [{from:'a',to:'b',kind:'calls' as const,file:'x',line:1},{from:'b',to:'a',kind:'calls' as const,file:'x',line:2}]
    expect([...walkGraph({edges}, ['a']).keys()]).toEqual(['a','b'])
    expect([...walkGraph({edges}, ['b'], {reverse:true}).keys()]).toEqual(['b','a'])
  })
  it('check mode never advances the baseline or writes derived files', async () => {
    const { root, put } = fixture()
    expect((await runProjectScan({rootDir:root})).drift).toBe(true)
    const file = path.join(root, '.atelier/generated/graph.json')
    const before = readFileSync(file, 'utf8')
    put('actions/student.ts', 'export async function createStudent() { return {ok: false} }')
    const check = await runProjectScan({rootDir:root,check:true})
    expect(check.drift).toBe(true)
    expect(check.report.recheck.frames).toContain('.atelier/mocks/Form.frame.tsx')
    expect(readFileSync(file,'utf8')).toBe(before)
    await runProjectScan({rootDir:root})
    expect((await runProjectScan({rootDir:root,check:true})).drift).toBe(false)
  })
  it('invalidates only dependent coverage and distinguishes assertions from execution', async () => {
    const {root,put} = fixture()
    const graph = scanProject(root)
    const fid = frameId('.atelier/mocks/Form.frame.tsx')
    const digest = dependencyFingerprint(graph,fid)
    const receipt: CoverageReceipt = {schemaVersion:2,id:'test',frame:'Form',frameId:fid,state:'idle',variants:{auth:'guest'},fingerprint:digest,servedFingerprint:graph.fingerprint,loadedSources:{},capturedAt:'2026-11-05T00:00:00Z',plan:{frame:'Form',state:'idle',variants:{auth:'guest'},settleMs:0,steps:[]},status:'executed',assertions:0,errors:[],hits:{},checkpoints:[]}
    await writeJson(path.join(root,'.atelier/coverage/test.json'),receipt)
    expect((await coverageFindings(root,graph)).map(f=>f.code)).toContain('unasserted-renders')
    put('components/Other.tsx','export function Other(){return <p>Changed unrelated component</p>}')
    expect(dependencyFingerprint(scanProject(root),fid)).toBe(digest)
    put('actions/student.ts','export async function createStudent(){return {ok:false}}')
    expect((await coverageFindings(root,scanProject(root))).map(f=>f.code)).toContain('stale-frame-coverage')
    const plan = defaultCoveragePlans(graph,'Form')
    expect(plan.plans).toHaveLength(4)
    expect(defaultCoveragePlans(graph,'Form',undefined,1).omissions).toHaveLength(1)
  })
  it('invalidates execution evidence when the preview renderer or instrumenter changes',()=>{
    const {root,put}=fixture()
    put('.atelier/main.tsx', `import {Canvas} from './ComponentCanvas'; export const render=Canvas`)
    put('.atelier/ComponentCanvas.tsx', 'export function Canvas(){return <div/>}')
    put('ai/tools/project-graph/branches.ts', 'export const instrumentVersion=1')
    const fid=frameId('.atelier/mocks/Form.frame.tsx')
    const before=dependencyFingerprint(scanProject(root),fid)
    put('.atelier/ComponentCanvas.tsx', 'export function Canvas(){return <main/>}')
    const rendered=dependencyFingerprint(scanProject(root),fid)
    expect(rendered).not.toBe(before)
    put('ai/tools/project-graph/branches.ts', 'export const instrumentVersion=2')
    expect(dependencyFingerprint(scanProject(root),fid)).not.toBe(rendered)
  })
})
