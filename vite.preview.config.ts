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
        find: new RegExp(`/${category}/${name}$`),
        replacement: path.resolve(dir, f),
      }
    })
}

export default defineConfig({
  plugins: [react()],
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
