import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'
import { runFrameCoverage } from './capture'
import { scanProject } from './scan'

vi.mock('playwright',()=>({chromium:{launch:vi.fn()}}))
const roots:string[]=[]
afterEach(()=>{vi.unstubAllGlobals();vi.mocked(chromium.launch).mockReset();for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true})})

describe('preview provenance',()=>{
  it('rejects another checkout before launching a browser or writing receipts',async()=>{
    const root=mkdtempSync(path.join(os.tmpdir(),'atelier-capture-'));roots.push(root)
    const graph=scanProject(root)
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({enabled:true,version:2,fingerprint:'another-checkout'}))))
    await expect(runFrameCoverage({rootDir:root,url:'http://localhost:5173',plans:[],graph})).rejects.toThrow('does not match')
    expect(chromium.launch).not.toHaveBeenCalled()
  })
  it('rejects an old recorder that cannot attest source identity',async()=>{
    const root=mkdtempSync(path.join(os.tmpdir(),'atelier-capture-'));roots.push(root)
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({enabled:true,version:1}))))
    await expect(runFrameCoverage({rootDir:root,url:'http://localhost:5173',plans:[]})).rejects.toThrow('outdated')
    expect(chromium.launch).not.toHaveBeenCalled()
  })
})
