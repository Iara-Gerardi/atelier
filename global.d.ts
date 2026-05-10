declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module 'virtual:preview-registry' {
  import type { RegistryEntry } from './registry/types'
  export const registry: RegistryEntry[]
}
