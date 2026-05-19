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
