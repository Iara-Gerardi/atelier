import path from 'node:path'
import type { Plugin } from 'vite'
import { instrumentRenderBranches } from './branches'
import { hash, posix } from './source'
import { scanProject } from './scan'

export function renderCoveragePlugin(root: string): Plugin {
  return {
    name: 'atelier-render-coverage',
    enforce: 'pre',
    transform(source, id) {
      if (process.env.ATELIER_COVERAGE !== '1') return
      const file = posix(path.relative(root, id.split('?')[0]))
      if (file.startsWith('../') || file.includes('node_modules/') || !/\.[cm]?[jt]sx?$/.test(file)) return
      const code = /^(?:src\/)?(?:components|app)\/.*\.[jt]sx$/.test(file) && !/\.(test|spec)\./.test(file)
        ? instrumentRenderBranches(source, file).code : source
      const provenance = `globalThis.__ATELIER_BRANCH_COVERAGE__?.register(${JSON.stringify(file)}, ${JSON.stringify(hash(source))});\n`
      return { code: provenance + code, map: null }
    },
    configureServer(server) {
      server.middlewares.use('/api/atelier-coverage', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          const enabled = process.env.ATELIER_COVERAGE === '1'
          res.end(JSON.stringify({ enabled, version: 2, fingerprint: enabled ? scanProject(root).fingerprint : undefined }))
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(error) }))
        }
      })
    },
  }
}
