import { createContext, useContext } from 'react'
import type { Outcome } from './registry/types'

/**
 * Bridges a scene's active node to whatever component inside the rendered
 * frame wants to expose the node's outcomes (today: the mocked
 * `@/components/ui/Button`). The provider is mounted exclusively by
 * `SceneCanvas` — standalone frame mode never wraps the tree, so consumers
 * receive `null` and fall back to their non-scene behavior.
 */
export interface SceneActionContextValue {
  /** Current node's outcomes, in declaration order. */
  outcomes: Outcome[]
  /**
   * Triggered when the user clicks a mocked-button face. Applies the
   * outcome's `set` to variants and navigates to its (frame, state).
   */
  dispatch: (outcomeId: string) => void
  /**
   * Dispatch the outcome whose `href` matches `target` (exact match first,
   * then prefix). Used by the `next/navigation` and `next/link` shims so a
   * component's real `router.push('/x')` / `<Link href="/x">` drives the scene
   * without importing anything Atelier-specific. Returns `true` when an
   * outcome matched and was dispatched.
   */
  dispatchByHref: (target: string) => boolean
}

export const SceneActionContext = createContext<SceneActionContextValue | null>(null)

/**
 * Returns the active scene action handle, or `null` when not rendered inside
 * a scene. Components that branch on scene-vs-standalone should check for
 * `null` first and pass through to their normal behavior.
 */
export function useSceneAction(): SceneActionContextValue | null {
  return useContext(SceneActionContext)
}

/**
 * Public alias of {@link useSceneAction} for component/shim code that wants to
 * drive scene outcomes directly (e.g. dispatching an `auto` outcome from an
 * effect when a mocked promise resolves, or matching a navigation `href`).
 */
export const useSceneOutcome = useSceneAction
