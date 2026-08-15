/**
 * Atelier configuration machinery.
 *
 * This module is **Node-only** (it touches `node:fs` / `node:path`) and is
 * consumed by the Vite config and the MCP server. Browser/runtime code must
 * never import from here — it would pull filesystem APIs into the bundle.
 *
 * The user-facing config lives at the project root in `atelier.config.ts` and
 * is authored with {@link defineAtelierConfig}. Everything is optional: an
 * empty config resolves to defaults that match the reference layout
 * (`@` → project root, mocks under `.atelier/mocks`, `app/globals.css`).
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** User-authored config. Every field is optional. */
export interface AtelierUserConfig {
  /**
   * Import-alias prefixes mapped to a path relative to the project root.
   * These mirror the host `tsconfig.json` `paths` so mocks and source resolve
   * identically in the preview. Default: `{ '@': '.' }`.
   */
  alias?: Record<string, string>
  /**
   * Directory (relative to project root) that holds mock files. Any file here
   * that is **not** a `*.frame.tsx` / `*.scene.tsx` mirrors the source module
   * at the same relative path: `<mocksDir>/lib/api.ts` intercepts
   * `@/lib/api`. Default: `.atelier/mocks`.
   */
  mocksDir?: string
  /**
   * Global stylesheet imported once before any frame renders, relative to the
   * project root. Set to `false` to disable. Default: `app/globals.css`.
   */
  globalCss?: string | false
  /** Dev server port. Default: `5173`. */
  port?: number
  /**
   * Enable the built-in Next.js module shims (`next/navigation`, `next/link`,
   * `next/image`, `next/headers`) so client components that import them render
   * in the Vite preview. Default: `true`.
   */
  nextShims?: boolean
  /**
   * Environment-variable prefixes exposed to the preview via `process.env.*`
   * (read from `.env` / `.env.local`). Default: `['NEXT_PUBLIC_']`.
   */
  envPrefixes?: string[]
}

/** Fully-resolved config with absolute paths. Produced by {@link resolveConfig}. */
export interface ResolvedAtelierConfig {
  root: string
  alias: Record<string, string>
  mocksDir: string
  globalCss: string | null
  port: number
  nextShims: boolean
  envPrefixes: string[]
}

/** A single mirrored mock discovered under the mocks directory. */
export interface MockEntry {
  /** Absolute path to the mock file. */
  absPath: string
  /**
   * Module specifier the mock mirrors, without extension and using posix
   * separators, e.g. `lib/api` or `components/ui/Button`.
   */
  modulePath: string
}

const DEFAULTS: Required<Omit<AtelierUserConfig, 'alias'>> & { alias: Record<string, string> } = {
  alias: { '@': '.' },
  mocksDir: '.atelier/mocks',
  globalCss: 'app/globals.css',
  port: 5173,
  nextShims: true,
  envPrefixes: ['NEXT_PUBLIC_'],
}

/**
 * Identity helper that gives editors autocomplete and type-checking for the
 * root `atelier.config.ts`. Returns the config untouched.
 */
export function defineAtelierConfig(config: AtelierUserConfig = {}): AtelierUserConfig {
  return config
}

/**
 * Merge a user config with defaults and resolve every path to an absolute
 * location under `root`. Pure aside from the `globalCss` existence check.
 */
export function resolveConfig(
  userConfig: AtelierUserConfig | undefined,
  root: string,
): ResolvedAtelierConfig {
  const cfg = userConfig ?? {}
  const alias = cfg.alias ?? DEFAULTS.alias
  const resolvedAlias: Record<string, string> = {}
  for (const [prefix, target] of Object.entries(alias)) {
    resolvedAlias[prefix] = path.resolve(root, target)
  }

  const globalCssRel = cfg.globalCss ?? DEFAULTS.globalCss
  let globalCss: string | null = null
  if (globalCssRel !== false) {
    const abs = path.resolve(root, globalCssRel)
    globalCss = existsSync(abs) ? abs : null
  }

  return {
    root,
    alias: resolvedAlias,
    mocksDir: path.resolve(root, cfg.mocksDir ?? DEFAULTS.mocksDir),
    globalCss,
    port: cfg.port ?? DEFAULTS.port,
    nextShims: cfg.nextShims ?? DEFAULTS.nextShims,
    envPrefixes: cfg.envPrefixes ?? DEFAULTS.envPrefixes,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Files under the mocks dir that are frames/scenes/types are not mirror mocks. */
function isMockFile(fileName: string): boolean {
  if (!/\.tsx?$/.test(fileName)) return false
  if (fileName.endsWith('.d.ts')) return false
  if (fileName.endsWith('.frame.tsx')) return false
  if (fileName.endsWith('.scene.tsx')) return false
  return true
}

/**
 * Recursively discover every mirrored mock under `mocksDir`. A mock at
 * `<mocksDir>/lib/api.ts` yields `{ modulePath: 'lib/api' }`, which intercepts
 * any import ending in `/lib/api` (`@/lib/api`, `../lib/api`, …).
 */
export function scanMocks(mocksDir: string): MockEntry[] {
  if (!existsSync(mocksDir)) return []
  const entries: MockEntry[] = []

  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const abs = path.join(dir, name)
      if (statSync(abs).isDirectory()) {
        walk(abs)
        continue
      }
      if (!isMockFile(name)) continue
      const rel = path.relative(mocksDir, abs).replace(/\\/g, '/')
      const modulePath = rel.replace(/\.tsx?$/, '')
      entries.push({ absPath: abs, modulePath })
    }
  }

  walk(mocksDir)
  return entries
}

/**
 * Build Vite `resolve.alias` entries from the resolved config: one regex alias
 * per mirrored mock (evaluated first so they win over the generic prefix
 * aliases), then one string alias per configured prefix. Throws if two mocks
 * resolve to the same module path.
 */
export function buildAliases(config: ResolvedAtelierConfig): Array<{
  find: string | RegExp
  replacement: string
}> {
  const mocks = scanMocks(config.mocksDir)
  const seen = new Map<string, string>()
  const aliases: Array<{ find: string | RegExp; replacement: string }> = []

  for (const mock of mocks) {
    const prior = seen.get(mock.modulePath)
    if (prior) {
      throw new Error(
        `[atelier] Two mocks map to "${mock.modulePath}":\n  ${prior}\n  ${mock.absPath}\n` +
          'Remove one — each source module can have at most one mock.',
      )
    }
    seen.set(mock.modulePath, mock.absPath)
    aliases.push({
      find: new RegExp(`^.*/${escapeRegExp(mock.modulePath)}$`),
      replacement: mock.absPath,
    })
  }

  for (const [prefix, target] of Object.entries(config.alias)) {
    aliases.push({ find: prefix, replacement: target })
  }

  return aliases
}

function toRootRelative(root: string, abs: string): string {
  const rel = path.relative(root, abs).replace(/\\/g, '/')
  return rel === '' ? '.' : rel
}

/**
 * Compute the `compilerOptions.paths` map for `.atelier/tsconfig.json` (whose
 * `baseUrl` is the project root) from the mirrored mocks and alias prefixes,
 * so type-checking resolves imports exactly as the Vite preview does.
 */
export function computeTsconfigPaths(config: ResolvedAtelierConfig): Record<string, string[]> {
  const mocks = scanMocks(config.mocksDir)
  const paths: Record<string, string[]> = {}
  const prefixes = Object.keys(config.alias)

  for (const mock of mocks) {
    const rel = `./${toRootRelative(config.root, mock.absPath)}`
    for (const prefix of prefixes) {
      paths[`${prefix}/${mock.modulePath}`] = [rel]
    }
  }

  for (const [prefix, target] of Object.entries(config.alias)) {
    const relTarget = toRootRelative(config.root, target)
    paths[`${prefix}/*`] = [relTarget === '.' ? './*' : `./${relTarget}/*`]
  }

  return paths
}

/**
 * Rewrite the `paths` block of the given tsconfig from the current mocks,
 * preserving everything else. Returns `true` if the file changed. No-ops when
 * the file is missing.
 */
export function writeTsconfigPaths(config: ResolvedAtelierConfig, tsconfigPath: string): boolean {
  if (!existsSync(tsconfigPath)) return false
  const json = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as {
    compilerOptions?: { paths?: Record<string, string[]> }
  }
  json.compilerOptions = json.compilerOptions ?? {}
  const next = computeTsconfigPaths(config)
  if (JSON.stringify(json.compilerOptions.paths) === JSON.stringify(next)) return false
  json.compilerOptions.paths = next
  writeFileSync(tsconfigPath, `${JSON.stringify(json, null, 2)}\n`)
  return true
}
