/**
 * Atelier shim for `next/navigation`.
 *
 * Aliased over the real module in the Vite preview (see the Vite config's
 * `nextShims`). Client components that call `useRouter()`, `usePathname()`,
 * etc. render without a Next.js runtime. In scene mode, `router.push(href)` /
 * `router.replace(href)` dispatch the outcome whose `href` matches — so a
 * component's ordinary navigation drives the scene with no Atelier-specific
 * code. Outside scenes the navigation methods are no-ops.
 */
import { useSceneOutcome } from '../SceneActionContext'

export interface AtelierRouter {
  push: (href: string) => void
  replace: (href: string) => void
  prefetch: () => void
  back: () => void
  forward: () => void
  refresh: () => void
}

export function useRouter(): AtelierRouter {
  const scene = useSceneOutcome()
  const navigate = (href: string) => {
    if (scene?.dispatchByHref(href)) return
    if (import.meta.env.DEV) {
      console.info(`[atelier] router navigation to "${href}" ignored (no matching outcome).`)
    }
  }
  return {
    push: navigate,
    replace: navigate,
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  }
}

export function usePathname(): string {
  return typeof window === 'undefined' ? '/' : window.location.pathname
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}

export function useParams<T = Record<string, string | string[]>>(): T {
  return {} as T
}

export function useSelectedLayoutSegment(): string | null {
  return null
}

export function useSelectedLayoutSegments(): string[] {
  return []
}

export function redirect(href: string): never {
  if (import.meta.env.DEV) {
    console.info(`[atelier] redirect("${href}") is a no-op in the preview.`)
  }
  throw new Error(`ATELIER_REDIRECT:${href}`)
}

export const permanentRedirect = redirect

export function notFound(): never {
  throw new Error('ATELIER_NOT_FOUND')
}

export enum RedirectType {
  push = 'push',
  replace = 'replace',
}
