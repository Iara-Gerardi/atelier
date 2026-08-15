import path from 'node:path'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'

/** One registered frame, statically parsed from a `*.frame.tsx` file. */
export interface FrameCatalogEntry {
  name: string
  states: string[]
  variants: string[]
}

/** The available variant axes, statically parsed from `.atelier/variants.ts`. */
export interface VariantRegistry {
  axes: string[]
  source: string
}

async function walkFrameFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFrameFiles(full)))
    } else if (entry.isFile() && entry.name.endsWith('.frame.tsx')) {
      files.push(full)
    }
  }
  return files
}

/** Find the object literal that begins at/after `fromIndex` and return its inner body. */
function readObjectBody(source: string, fromIndex: number): string | null {
  const open = source.indexOf('{', fromIndex)
  if (open === -1) return null

  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      i += 1
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2
          continue
        }
        if (source[i] === quote) break
        i += 1
      }
      continue
    }
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return null
}

/** Extract the depth-0 object keys from an object body string. */
function extractTopLevelKeys(body: string): string[] {
  const keys: string[] = []
  let depth = 0
  let expectKey = true

  for (let i = 0; i < body.length; ) {
    const ch = body[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      i += 1
      while (i < body.length) {
        if (body[i] === '\\') {
          i += 2
          continue
        }
        if (body[i] === quote) {
          i += 1
          break
        }
        i += 1
      }
      continue
    }
    if (ch === '{' || ch === '[' || ch === '(') {
      depth += 1
      i += 1
      continue
    }
    if (ch === '}' || ch === ']' || ch === ')') {
      depth -= 1
      i += 1
      continue
    }
    if (depth === 0 && expectKey) {
      const match = body.slice(i).match(/^\s*([A-Za-z_$][\w$]*|'[^']*'|"[^"]*")\s*:/)
      if (match) {
        let key = match[1]
        if (/^['"]/.test(key)) key = key.slice(1, -1)
        keys.push(key)
        i += match[0].length
        expectKey = false
        continue
      }
    }
    if (depth === 0 && ch === ',') {
      expectKey = true
      i += 1
      continue
    }
    i += 1
  }

  return keys
}

function parseFrameFile(source: string): FrameCatalogEntry | null {
  const nameMatch = source.match(/name:\s*['"]([^'"]+)['"]/)
  if (!nameMatch) return null
  const name = nameMatch[1]

  const variants: string[] = []
  const variantsMatch = source.match(/variants:\s*\[([^\]]*)\]/)
  if (variantsMatch) {
    for (const literal of variantsMatch[1].matchAll(/['"]([^'"]+)['"]/g)) {
      variants.push(literal[1])
    }
  }

  let states: string[] = []
  const statesAnchor = source.search(/Record<\s*StateKey\s*,\s*ComponentState/)
  const body = readObjectBody(source, statesAnchor === -1 ? 0 : statesAnchor)
  if (body) states = extractTopLevelKeys(body)

  return { name, states, variants }
}

/** Build the frame catalog by statically parsing every `.atelier/mocks/*.frame.tsx`. */
export async function buildFrameCatalog(rootDir: string): Promise<FrameCatalogEntry[]> {
  const mocksDir = path.resolve(rootDir, '.atelier', 'mocks')
  const files = await walkFrameFiles(mocksDir)
  const catalog: FrameCatalogEntry[] = []
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const entry = parseFrameFile(source)
    if (entry) catalog.push(entry)
  }
  return catalog.sort((a, b) => a.name.localeCompare(b.name))
}

/** Read the variant registry so scene gates can reference valid axes. */
export async function readVariantRegistry(rootDir: string): Promise<VariantRegistry> {
  const variantsPath = path.resolve(rootDir, '.atelier', 'variants.ts')
  if (!existsSync(variantsPath)) return { axes: [], source: '' }
  const source = await readFile(variantsPath, 'utf8')

  const axes: string[] = []
  const anchor = source.search(/variantAxes\s*=/)
  const body = readObjectBody(source, anchor === -1 ? 0 : anchor)
  if (body) axes.push(...extractTopLevelKeys(body))

  return { axes, source }
}
