import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { reviewAffectedStates, reviewJevQuestions } from './review'
import { scanProject } from './scan'

const roots: string[]=[]
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true})})
function fixture(){
  const root=mkdtempSync(path.join(os.tmpdir(),'atelier-review-'));roots.push(root)
  const put=(file:string,source:string)=>{mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),source)}
  put('actions/save.ts','export function save(){return true}')
  put('components/Form.tsx',`import {save} from '../actions/save'; export function Form({error}){if(error)return <p>Error</p>; return <button onClick={save}>Save</button>}`)
  put('.atelier/mocks/Form.frame.tsx',`import {Form} from '../../components/Form'; export const meta={name:'Form'};export default {idle:{render:()=> <Form error={false}/>}}`)
  return {root,put}
}
describe('incremental Jev review',()=>{
  it('reuses evidence until relevant source changes, including in check mode',async()=>{
    const {root,put}=fixture()
    vi.stubEnv('TYPESAFE_API_KEY','test-key')
    const fetcher=vi.fn(async(_url:unknown,options:RequestInit)=>{
      const body=JSON.parse(String(options.body))
      return new Response(JSON.stringify({answers:Object.fromEntries(Object.keys(body.questions).map(key=>[key,{noul:0.9}]))}),{status:200})
    })
    vi.stubGlobal('fetch',fetcher)
    await reviewAffectedStates(root,scanProject(root),{write:true})
    await reviewAffectedStates(root,scanProject(root),{write:false})
    expect(fetcher).toHaveBeenCalledTimes(1)
    put('components/Unrelated.tsx','export function Unrelated(){return <p>Unrelated</p>}')
    await reviewAffectedStates(root,scanProject(root),{write:true})
    expect(fetcher).toHaveBeenCalledTimes(1)
    put('actions/save.ts','export function save(){return false}')
    await reviewAffectedStates(root,scanProject(root),{write:true})
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('rejects missing or out-of-range provider answers',async()=>{
    const {root}=fixture();vi.stubEnv('TYPESAFE_API_KEY','test-key')
    const questions={one:{type:'noul' as const,instructions:'Is this supported?'}}
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({answers:{}}),{status:200})))
    await expect(reviewJevQuestions(root,{},questions)).rejects.toThrow('omitted answer')
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({answers:{one:{noul:2}}}),{status:200})))
    await expect(reviewJevQuestions(root,{},questions)).rejects.toThrow()
  })
})
