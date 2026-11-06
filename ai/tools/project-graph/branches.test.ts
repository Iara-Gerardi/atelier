import { describe, expect, it } from 'vitest'
import { runInNewContext } from 'node:vm'
import { analyzeBranches, instrumentRenderBranches } from './branches'
import ts from 'typescript'

function execute(source: string, props: unknown) {
  const {code,branches} = instrumentRenderBranches(source,'components/Test.tsx')
  const js = ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
  const hits: Record<string, unknown[]> = {}
  const sandbox = { exports:{} as {Test:(props:unknown)=>unknown}, React:{createElement:(...args:unknown[])=>args}, __ATELIER_BRANCH_COVERAGE__:{hit:(id:string,value:unknown)=>{(hits[id]??=[]).push(value)}} }
  runInNewContext(js,sandbox)
  const result = sandbox.exports.Test(props)
  return {result,hits,branches}
}

describe('render branch evidence',()=>{
  it('preserves negation and both early-return alternatives',()=>{
    const source='export function Test({loading}) { if (!loading) return <p>Ready</p>; return <p>Loading</p> }'
    const ready=execute(source,{loading:false})
    const loading=execute(source,{loading:true})
    expect(ready.hits[ready.branches[0].id]).toEqual([true])
    expect(loading.hits[loading.branches[0].id]).toEqual([false])
    expect(ready.result).not.toEqual(loading.result)
  })
  it('evaluates side effects once and preserves falsy JSX values',()=>{
    const source='export function Test({next}) { return <p>{next() && <span>Child</span>}</p> }'
    let calls=0
    const run=execute(source,{next:()=>{calls++;return 0}})
    expect(calls).toBe(1)
    expect(run.result).toEqual(['p',null,0])
  })
  it('tracks conditional attributes and distinguishes nullish decisions',()=>{
    const source='export function Test({value,disabled}) { return <button disabled={disabled}>{value ?? "Empty"}</button> }'
    const run=execute(source,{value:0,disabled:true})
    expect(run.branches.map(branch=>branch.kind)).toEqual(['attribute','logical'])
    expect(run.branches[1].outcomes).toEqual(['nullish','present'])
    expect(Object.keys(run.hits)).toHaveLength(2)
    expect(run.result).toEqual(['button',{disabled:true},0])
  })
  it('uses stable IDs across line movement but changes the source fingerprint',()=>{
    const source='export function Test({error}) { return error ? <p>Error</p> : <p>Ready</p> }'
    const before=analyzeBranches(source,'components/Test.tsx')
    const after=analyzeBranches('\n\n'+source,'components/Test.tsx')
    expect(after[0].id).toBe(before[0].id)
    expect(after[0].sourceHash).not.toBe(before[0].sourceHash)
  })
  it('does not count event-handler business branches as render decisions',()=>{
    const source='export function Test({value}) { const click=()=>{if(value) return 1; return 2}; return <button onClick={click}>Save</button> }'
    expect(analyzeBranches(source,'components/Test.tsx')).toEqual([])
  })
  it('instruments switch cases including default without changing return values',()=>{
    const source='export function Test({value}) { switch(value){case "ok": return <p>OK</p>; default: return <p>Other</p>} }'
    const run=execute(source,{value:'ok'})
    expect(run.branches).toHaveLength(2)
    expect(Object.keys(run.hits)).toEqual([run.branches[0].id])
    expect(run.result).toEqual(['p',null,'OK'])
  })
  it('does not collide with local or imported helper names',()=>{
    const source='export function Test({__atelierBranch, __atelierBranch_}) { return __atelierBranch && __atelierBranch_ ? <p>Yes</p> : <p>No</p> }'
    const run=execute(source,{__atelierBranch:true,__atelierBranch_:true})
    expect(run.result).toEqual(['p',null,'Yes'])
    expect(Object.keys(run.hits)).toHaveLength(2)
  })
})
