import path from 'node:path'

export function toPosix(value: string): string {
  return value.replaceAll('\\', '/')
}

function stripExtension(filePath: string): string {
  const ext = path.extname(filePath)
  return filePath.slice(0, filePath.length - ext.length)
}

function ensureInside(parentDir: string, candidatePath: string, label: string): void {
  const relative = path.relative(parentDir, candidatePath)
  if (!relative || relative === '.') return
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside ${toPosix(parentDir)}`)
  } 
}

export function resolveComponentPath(rootDir: string, componentPath: string): string {
  const projectRoot = path.resolve(rootDir)
  const componentsRoot = path.resolve(projectRoot, 'components')
  const absolute = path.resolve(projectRoot, componentPath)

  ensureInside(componentsRoot, absolute, 'componentPath')

  const ext = path.extname(absolute).toLowerCase()
  if (!['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
    throw new Error('componentPath must point to a .tsx/.ts/.jsx/.js source file.')
  }

  return absolute
}

export function makeComponentImportPath(rootDir: string, componentAbsolutePath: string): string {
  const relativeToComponents = path.relative(path.resolve(rootDir, 'components'), componentAbsolutePath)
  const noExt = stripExtension(toPosix(relativeToComponents))
  return `@/components/${noExt}`
}

export function resolveOutputPath(
  rootDir: string,
  componentName: string,
  outputPath?: string
): string {
  const projectRoot = path.resolve(rootDir)
  const framesRoot = path.resolve(projectRoot, '.atelier', 'frames')
  const fallback = path.resolve(framesRoot, `${componentName}.frame.tsx`)
  const resolved = outputPath ? path.resolve(projectRoot, outputPath) : fallback

  ensureInside(framesRoot, resolved, 'outputPath')
  return resolved
}
