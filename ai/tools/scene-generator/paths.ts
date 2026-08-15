import path from 'node:path'
import { toPosix } from '../frame-generator/paths'

function ensureInside(parentDir: string, candidatePath: string, label: string): void {
  const relative = path.relative(parentDir, candidatePath)
  if (!relative || relative === '.') return
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside ${toPosix(parentDir)}`)
  }
}

export function resolveScenesDir(rootDir: string): string {
  return path.resolve(path.resolve(rootDir), '.atelier', 'scenes')
}

export function resolveSceneOutputPath(
  rootDir: string,
  sceneName: string,
  outputPath?: string
): string {
  const scenesRoot = resolveScenesDir(rootDir)
  const fallback = path.resolve(scenesRoot, `${sceneName}.scene.tsx`)
  const resolved = outputPath ? path.resolve(path.resolve(rootDir), outputPath) : fallback

  ensureInside(scenesRoot, resolved, 'outputPath')
  return resolved
}

export { toPosix }
