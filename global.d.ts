declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// Virtual alias resolved by the Vite config to the configured global
// stylesheet (see `atelier.config.ts` → `globalCss`).
declare module 'atelier:styles'

