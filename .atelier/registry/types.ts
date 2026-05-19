import type { ReactNode } from 'react'
import type { PartialVariants, VariantKey, VariantValues } from '../variants'

export type StateKey = string

export interface RenderContext<TKeys extends VariantKey = VariantKey> {
  variants: Pick<VariantValues, TKeys>
}

export interface ComponentState<TKeys extends VariantKey = never> {
  render: (ctx: RenderContext<TKeys>) => ReactNode
  description?: string
}

export interface MockMeta<TKeys extends VariantKey = never> {
  name: string
  category: string
  tags?: string[]
  variants?: readonly TKeys[]
}

export interface RegistryEntry extends MockMeta {
  states: Record<StateKey, ComponentState>
}

/**
 * One possible result of a user action at a scene node. Outcomes are
 * **frame-to-frame transitions** — `frame` must point at a *different* frame
 * than the node's own. Same-frame state navigation belongs on the StateBar at
 * the top of the canvas, not in this dropdown.
 *
 * The mocked `@/components/ui/Button` reads the active node's outcomes and
 * renders a split-button dropdown whose primary face fires the outcome marked
 * `default: true`. Each outcome's `state` is the initial state shown on the
 * target `frame`; the user can then use the StateBar to preview any other
 * state of that frame, but the dropdown only lists the states that are
 * actually reachable from this node in the real feature.
 */
export interface Outcome {
  id: string
  /**
   * Required. Frame name to render after dispatch. Must differ from the
   * node's `frame` — outcomes are frame transitions. Use the StateBar for
   * intra-frame state changes.
   */
  frame: string
  /**
   * Initial state shown on the target `frame` after dispatch. The user may
   * subsequently navigate to any of that frame's other states via the
   * StateBar; only the states declared here are "reachable as outcomes" from
   * this node.
   */
  state: StateKey
  /**
   * Required. Plain-language explanation of why this outcome exists; surfaces
   * as the dropdown item subtitle and is consumed by the scene-coverage skill
   * when generating qa cases.
   */
  description: string
  /**
   * Exactly one outcome per node should be marked default. The split-button's
   * primary face fires this outcome on click. If none is marked, the first
   * outcome is used.
   */
  default?: boolean
  /** Optional variant flips applied when this outcome is dispatched. */
  set?: PartialVariants
}

export interface SceneNode {
  frame: string
  state: StateKey
  outcomes?: Outcome[]
  /**
   * Optional access control. Runs whenever this node is entered (initial mount
   * or after an outcome dispatch). When it returns false, the scene navigates
   * to `fallback` instead.
   */
  gate?: (ctx: RenderContext) => boolean
  /** Node id to redirect to when `gate` fails. Required when `gate` is set. */
  fallback?: string
}

export interface SceneMeta {
  name: string
  category: string
  tags?: string[]
}

export interface SceneDef {
  initial: string
  nodes: Record<string, SceneNode>
}

export interface SceneEntry extends SceneMeta {
  scene: SceneDef
}
