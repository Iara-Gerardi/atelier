import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { bootstrapCatalog } from './bootstrap'
import { generateAtelierText } from '../provider'
import { reviewJevQuestions } from './review'
import { readFeatures } from './catalog'

vi.mock('../provider',()=>({generateAtelierText:vi.fn()}))
vi.mock('./review',()=>({reviewJevQuestions:vi.fn()}))
let root: string
beforeEach(()=>{
  root=mkdtempSync(path.join(os.tmpdir(),'atelier-catalog-'))
  mkdirSync(path.join(root,'app'),{recursive:true})
  writeFileSync(path.join(root,'app/page.tsx'),'export default function Home(){return <h1>Browse</h1>}')
  vi.mocked(generateAtelierText).mockReset()
  vi.mocked(reviewJevQuestions).mockReset()
})
afterEach(()=>rmSync(root,{recursive:true,force:true}))
const proposal=[{slug:'browse',name:'Browse',goal:'Browse content',entries:[{file:'app/page.tsx',symbol:'Home'}]}]

describe('initial feature catalog',()=>{
  it('uses the configured proposer and Jev, then writes a valid compact contract exactly once',async()=>{
    vi.mocked(generateAtelierText).mockResolvedValue(JSON.stringify(proposal))
    vi.mocked(reviewJevQuestions).mockResolvedValue({feature_0:0.95})
    const preview=await bootstrapCatalog({rootDir:root,model:'configured-model'})
    expect(preview.written).toBe(false)
    expect(existsSync(path.join(root,'features'))).toBe(false)
    expect(generateAtelierText).toHaveBeenCalledWith(expect.objectContaining({rootDir:root,model:'configured-model'}))
    const result=await bootstrapCatalog({rootDir:root,write:true})
    expect(result.written).toBe(true)
    const source=readFileSync(path.join(root,'features/browse/index.md'),'utf8')
    expect(readFeatures({'features/browse/index.md':source}).features).toEqual(proposal)
    await expect(bootstrapCatalog({rootDir:root,write:true})).rejects.toThrow('already exists')
    expect(readFileSync(path.join(root,'features/browse/index.md'),'utf8')).toBe(source)
  })
  it('does not persist rejected hypotheses',async()=>{
    vi.mocked(reviewJevQuestions).mockResolvedValue({feature_0:0.2})
    await expect(bootstrapCatalog({rootDir:root,write:true,proposal})).rejects.toThrow('needs revision')
    expect(existsSync(path.join(root,'features'))).toBe(false)
    expect(generateAtelierText).not.toHaveBeenCalled()
  })
  it('rejects fabricated entries before making an AI review request',async()=>{
    await expect(bootstrapCatalog({rootDir:root,proposal:[{...proposal[0],entries:[{file:'missing.tsx'}]}]})).rejects.toThrow('Unknown feature entry')
    expect(reviewJevQuestions).not.toHaveBeenCalled()
  })
  it('does not write a proposal whose source changed during review',async()=>{
    vi.mocked(reviewJevQuestions).mockImplementation(async()=>{
      writeFileSync(path.join(root,'app/page.tsx'),'export default function Home(){return <h1>Different capability</h1>}')
      return {feature_0:0.95}
    })
    await expect(bootstrapCatalog({rootDir:root,write:true,proposal})).rejects.toThrow('Source changed')
    expect(existsSync(path.join(root,'features'))).toBe(false)
  })
})
