import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import path from 'path'
import { readdirSync } from 'fs'

/**
 * Auto-scan preview/mocks/{category}/ and build one regex alias per file.
 * The regex matches the module name at any import depth and with any prefix
 * (@/, ../, ../../, etc.), so no per-file Vite config is needed.
 * Adding a new mock file in the right folder is all that's required.
 */
function buildMockAliases(category: 'hooks' | 'actions') {
  const dir = path.resolve(__dirname, `preview/mocks/${category}`)
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

/**
 * Scans preview/mocks/*.mock.tsx and builds a virtual module `virtual:preview-registry`
 * that assembles the registry array from each file's default export (states) and
 * named `meta` export (name/category/tags). Adding a new mock file is all that's required.
 */
function buildRegistryPlugin() {
  const VIRTUAL_ID = 'virtual:preview-registry'
  const RESOLVED_ID = '\0virtual:preview-registry'
  const mocksDir = path.resolve(__dirname, 'preview/mocks')

  return {
    name: 'preview-registry',
    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id: string) {
      if (id !== RESOLVED_ID) return

      const files = readdirSync(mocksDir).filter(f => f.endsWith('.mock.tsx') || f.endsWith('.mock.ts'))

      const imports = files
        .map((f, i) => `import states${i}, { meta as meta${i} } from '${path.resolve(mocksDir, f).replace(/\\/g, '/')}'`)
        .join('\n')

      const entries = files.map((_, i) => `{ ...meta${i}, states: states${i} }`).join(',\n  ')

      return `${imports}\nexport const registry = [\n  ${entries},\n]`
    },
  }
}

export default defineConfig({
  plugins: [buildRegistryPlugin(), react()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  resolve: {
    alias: [
      ...buildMockAliases('hooks'),
      ...buildMockAliases('actions'),
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  root: '.',
  server: {
    open: '/preview/index.html',
  },
})
