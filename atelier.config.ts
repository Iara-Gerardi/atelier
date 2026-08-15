import { defineAtelierConfig } from './.atelier/config'

/**
 * Atelier preview configuration. Every field is optional — the defaults below
 * match the reference layout, so this file mostly documents the knobs you can
 * turn when adapting Atelier to a different Next.js project.
 */
export default defineAtelierConfig({
  // Import-alias prefixes → path relative to the project root. Mirror your
  // tsconfig `paths` here. Default: { '@': '.' }.
  // alias: { '@': 'src' },

  // Directory holding mirrored mocks. A file at `<mocksDir>/lib/api.ts`
  // intercepts every `@/lib/api` import. Default: '.atelier/mocks'.
  // mocksDir: '.atelier/mocks',

  // Global stylesheet imported before any frame renders. Default 'app/globals.css'.
  // globalCss: 'app/globals.css',

  // Dev server port. Default 5173.
  // port: 5173,

  // Built-in next/navigation, next/link, next/image, next/headers shims. Default true.
  // nextShims: true,

  // Env prefixes exposed to the preview via process.env.*. Default ['NEXT_PUBLIC_'].
  // envPrefixes: ['NEXT_PUBLIC_'],
})
