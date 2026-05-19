import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import path from 'path'
import { readdirSync } from 'fs'
import type { Plugin } from 'vite'
import type { RegistryEntry } from './.atelier/registry/types'

/**
 * Auto-scan .atelier/mocks/{category}/ and build one regex alias per file.
 * The regex matches the module name at any import depth and with any prefix
 * (@/, ../, ../../, etc.), so no per-file Vite config is needed.
 * Adding a new mock file in the right folder is all that's required.
 *
 * `category` may be a nested path (e.g. 'components/ui') — the regex still
 * matches `@/components/ui/Button` etc. correctly because slashes are
 * preserved verbatim.
 */
function buildMockAliases(category: string) {
  const dir = path.resolve(__dirname, `.atelier/mocks/${category}`)
  return readdirSync(dir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map(f => {
      const name = f.replace(/\.tsx?$/, '')
      return {
        find: new RegExp(`^.*/${category}/${name}$`),
        replacement: path.resolve(dir, f),
      }
    })
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

export default defineConfig({
  plugins: [react(), registryApiPlugin()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  resolve: {
    alias: [
      ...buildMockAliases('hooks'),
      ...buildMockAliases('actions'),
      ...buildMockAliases('components/ui'),
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  root: '.',
  server: {
    open: '/.atelier/index.html',
  },
})
