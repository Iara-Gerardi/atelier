import ts from 'typescript'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

export const hash = (text: string): string => createHash('sha256').update(text).digest('hex')
export const posix = (value: string): string => value.split(path.sep).join('/')
export const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0
export const fileId = (file: string): string => `file:${file}`
export const symbolId = (file: string, name: string): string => `symbol:${file}#${name}`
export const frameId = (file: string): string => `frame:${file}`
export const stateId = (file: string, state: string): string => `state:${file}#${state}`
export const lineOf = (node: ts.Node): number => node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1

const omitted = new Set(['node_modules', '.git', '.next', '.vercel', 'coverage', 'dist', 'build', 'out', '.devtools', '.cache', 'generated', 'reports'])
export function projectFiles(root: string): string[] {
  let files: string[]
  try {
    // Git respects ignore rules and includes untracked source, without reading .env files.
    files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean)
  } catch {
    const walk = (dir: string): string[] => readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
      if (omitted.has(entry.name) || entry.name.startsWith('.env')) return []
      const file = posix(path.join(dir, entry.name))
      return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : []
    })
    files = walk('')
  }
  return [...new Set(files)].filter(file => !file.split('/').some(part => omitted.has(part)) && (
    /\.[cm]?[jt]sx?$/.test(file) || /^(?:features\/[^/]+\/index\.md|package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(file) || /(?:^|\/)tsconfig[^/]*\.json$/.test(file)
  )).filter(file => !/(?:\.test|\.spec|\.d)\.[cm]?[jt]sx?$/.test(file)).sort()
}

export function readSources(root: string): Record<string, string> {
  return Object.fromEntries(projectFiles(root).filter(file => {
    const absolute = path.join(root, file)
    return existsSync(absolute) && lstatSync(absolute).isFile()
  }).map(file => [file, readText(root, file)]))
}

export function sourceFingerprint(sources: Record<string, string>, version: string): string {
  return hash(JSON.stringify({ files: Object.fromEntries(Object.entries(sources).map(([file, text]) => [file, hash(text)])), version }))
}

/** Static subset only: never import or evaluate application / scene code. */
export function unwrap(node: ts.Expression): ts.Expression {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node) || ts.isTypeAssertionExpression(node)) node = node.expression
  return node
}

export function initializer(node: ts.Expression, seen = new Set<string>()): ts.Expression {
  node = unwrap(node)
  if (!ts.isIdentifier(node) || seen.has(node.text)) return node
  seen.add(node.text)
  for (const statement of node.getSourceFile().statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === node.text && declaration.initializer) return initializer(declaration.initializer, seen)
    }
  }
  return node
}

export function property(node: ts.Expression | undefined, name: string): ts.Expression | undefined {
  if (!node) return undefined
  node = initializer(node)
  if (!ts.isObjectLiteralExpression(node)) return undefined
  const prop = node.properties.find(p => p.name && propertyName(p.name) === name)
  return prop && ts.isPropertyAssignment(prop) ? prop.initializer : undefined
}
export function propertyName(node: ts.PropertyName): string | undefined {
  return ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node) ? node.text : undefined
}
export function stringValue(node?: ts.Expression): string | undefined {
  if (!node) return undefined
  node = initializer(node)
  return ts.isStringLiteralLike(node) ? node.text : undefined
}
export function arrayValues(node?: ts.Expression): ts.Expression[] | undefined {
  if (!node) return undefined
  node = initializer(node)
  return ts.isArrayLiteralExpression(node) ? [...node.elements] : undefined
}
export function objectEntries(node?: ts.Expression): [string, ts.Expression][] | undefined {
  if (!node) return undefined
  node = initializer(node)
  if (!ts.isObjectLiteralExpression(node) || node.properties.some(p => !ts.isPropertyAssignment(p) || !p.name || propertyName(p.name) === undefined)) return undefined
  return node.properties.map(p => { const prop = p as ts.PropertyAssignment; return [propertyName(prop.name)!, prop.initializer] })
}
export function namedValue(sf: ts.SourceFile, name: string): ts.Expression | undefined {
  for (const statement of sf.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return declaration.initializer
      }
    }
  }
  return undefined
}
export function defaultValue(sf: ts.SourceFile): ts.Expression | undefined {
  const exp = sf.statements.find(ts.isExportAssignment)
  return exp?.expression
}
export function readText(root: string, file: string): string { return readFileSync(path.join(root, file), 'utf8') }
