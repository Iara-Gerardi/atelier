import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import path from 'node:path'
import type { Plugin } from 'vite'
import type { RegistryEntry } from './.atelier/registry/types'
import { buildAliases, resolveConfig, writeTsconfigPaths } from './.atelier/config'
import userConfig from './atelier.config'
import { renderCoveragePlugin } from './ai/tools/project-graph/coverage-plugin'

const root = __dirname
const atelier = resolveConfig(userConfig, root)

const SHIMS_DIR = path.resolve(root, '.atelier/shims')
const STYLES_ALIAS = 'atelier:styles'
const TSCONFIG_PATH = path.resolve(root, '.atelier/tsconfig.json')

/**
 * Aliases for the built-in Next.js module shims. Only registered when
 * `nextShims` is enabled. Each maps the bare module specifier to a shim file
 * so client components importing them render in the Vite preview.
 */
function shimAliases() {
  return [
    { find: /^next\/navigation$/, replacement: path.join(SHIMS_DIR, 'next-navigation.tsx') },
    { find: /^next\/link$/, replacement: path.join(SHIMS_DIR, 'next-link.tsx') },
    { find: /^next\/image$/, replacement: path.join(SHIMS_DIR, 'next-image.tsx') },
    { find: /^next\/headers$/, replacement: path.join(SHIMS_DIR, 'next-headers.ts') },
  ]
}

/**
 * Expose `process.env.<PREFIX>*` (from `.env` / `.env.local`) and
 * `process.env.NODE_ENV` to the preview so modules that read
 * `process.env.NEXT_PUBLIC_*` (e.g. a zod-validated `env.ts`) don't crash
 * under Vite, which normally only populates `import.meta.env`.
 */
function envDefine(mode: string): Record<string, string> {
  const define: Record<string, string> = {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  }
  for (const prefix of atelier.envPrefixes) {
    const env = loadEnv(mode, root, prefix)
    for (const [key, value] of Object.entries(env)) {
      define[`process.env.${key}`] = JSON.stringify(value)
    }
  }
  return define
}

/**
 * Keep `.atelier/tsconfig.json` `paths` in sync with the mirrored mocks on
 * every preview start, so `tsc` resolves imports exactly like the preview.
 */
function tsconfigSyncPlugin(): Plugin {
  return {
    name: 'atelier-tsconfig-sync',
    configResolved() {
      try {
        writeTsconfigPaths(atelier, TSCONFIG_PATH)
      } catch (err) {
        console.warn('[atelier] could not sync tsconfig paths:', err)
      }
    },
  }
}

function registryApiPlugin(): Plugin {
  return {
    name: 'atelier-registry-api',
    configureServer(server) {
      server.middlewares.use('/api/registry', async (_req, res) => {
        try {
          const mod = await server.ssrLoadModule('/.atelier/registry/index.ts')
          const entries: RegistryEntry[] = mod.registry
          const payload = entries.map((entry) => ({
            name: entry.name,
            category: entry.category,
            tags: entry.tags ?? [],
            states: Object.fromEntries(
              Object.entries(entry.states).map(([key, state]) => [
                key,
                { description: state.description ?? null },
              ])
            ),
          }))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [renderCoveragePlugin(root), react(), tsconfigSyncPlugin(), registryApiPlugin()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  define: envDefine(mode),
  resolve: {
    alias: [
      // Global stylesheet, imported by main.tsx as `atelier:styles`.
      ...(atelier.globalCss ? [{ find: STYLES_ALIAS, replacement: atelier.globalCss }] : []),
      // Built-in Next.js shims (before the mirrored mocks / prefix aliases).
      ...(atelier.nextShims ? shimAliases() : []),
      // Mirrored mocks (regex, first-match wins) then alias prefixes.
      ...buildAliases(atelier),
    ],
  },
  root: '.',
  server: {
    port: atelier.port,
    open: '/.atelier/index.html',
  },
}))
