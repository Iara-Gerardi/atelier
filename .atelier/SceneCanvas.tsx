import { registry } from './registry'
import type { Outcome, RegistryEntry, SceneEntry, SceneNode, StateKey } from './registry/types'
import type { VariantKey, VariantValues } from './variants'
import { SceneActionContext, type SceneActionContextValue } from './SceneActionContext'
import StateBar from './StateBar'

interface SceneCanvasProps {
  scene: SceneEntry
  currentNodeId: string
  /** Optional frame override, set after an outcome is dispatched. */
  displayedFrame?: string
  /** Optional state override, set by either an outcome dispatch or StateBar interaction. */
  displayedState?: StateKey
  variants: VariantValues
  onDispatch: (outcomeId: string) => void
  onStateChange: (state: StateKey) => void
  onRestart: () => void
}

function NodeBadge({ nodeId }: { nodeId: string }) {
  return (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">{nodeId}</code>
  )
}

function passesGate(node: SceneNode, variants: VariantValues): boolean {
  if (!node.gate) return true
  try {
    return node.gate({ variants })
  } catch {
    return false
  }
}

/**
 * Filter to outcomes that genuinely change the rendered frame. Outcomes whose
 * `frame` matches the current rendered frame are no-ops in v3 (same-frame
 * state changes are the StateBar's job) and would just confuse the dropdown.
 */
function visibleOutcomes(node: SceneNode, currentFrame: string): Outcome[] {
  return (node.outcomes ?? []).filter((o) => o.frame !== currentFrame)
}

function ErrorPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-white p-10 text-sm text-gray-500">
      {children}
    </div>
  )
}

export default function SceneCanvas({
  scene,
  currentNodeId,
  displayedFrame,
  displayedState,
  variants,
  onDispatch,
  onStateChange,
  onRestart,
}: SceneCanvasProps) {
  const intendedNode = scene.scene.nodes[currentNodeId]

  if (!intendedNode) {
    return (
      <ErrorPanel>
        Unknown node <NodeBadge nodeId={currentNodeId} /> in scene "{scene.name}".
      </ErrorPanel>
    )
  }

  const gateOk = passesGate(intendedNode, variants)

  // Resolve the *rendered* node. When the gate fails we render the fallback
  // node inline, but do NOT mutate currentNodeId — that way the user's intent
  // is preserved in the URL and re-evaluating the gate after a variant flip
  // immediately swings the render back to the intended node.
  let renderedNode: SceneNode = intendedNode
  let renderedNodeId = currentNodeId
  let redirected = false

  if (!gateOk) {
    if (!intendedNode.fallback) {
      return (
        <ErrorPanel>
          Node <NodeBadge nodeId={currentNodeId} /> has a failing <code>gate</code> but no{' '}
          <code>fallback</code> declared. Add one to the scene.
        </ErrorPanel>
      )
    }
    const fallbackNode = scene.scene.nodes[intendedNode.fallback]
    if (!fallbackNode) {
      return (
        <ErrorPanel>
          Fallback node <NodeBadge nodeId={intendedNode.fallback} /> referenced by{' '}
          <NodeBadge nodeId={currentNodeId} /> not found in scene.
        </ErrorPanel>
      )
    }
    renderedNode = fallbackNode
    renderedNodeId = intendedNode.fallback
    redirected = true
  }

  // Outcome dispatch ⇒ frame transition. We compute the *actual* frame to
  // render from the displayed-* props (set by dispatch or StateBar). When the
  // gate failed we ignore those overrides — the user is looking at the
  // fallback, any prior outcome is conceptually invalidated.
  const overrideFrame = redirected ? undefined : displayedFrame
  const overrideState = redirected ? undefined : displayedState
  const frameName = overrideFrame ?? renderedNode.frame
  const frame: RegistryEntry | undefined = registry.find((e) => e.name === frameName)

  if (!frame) {
    return (
      <ErrorPanel>
        Frame <NodeBadge nodeId={frameName} /> referenced by node{' '}
        <NodeBadge nodeId={renderedNodeId} /> not found in registry.
      </ErrorPanel>
    )
  }

  const availableStates = Object.keys(frame.states)
  let stateKey: StateKey = overrideState ?? renderedNode.state
  // Defensive: if the override state doesn't exist on the new frame (e.g.
  // dispatch from a frame whose state name doesn't transfer to the target),
  // fall back to the frame's first state.
  if (!frame.states[stateKey]) {
    stateKey = availableStates[0] ?? stateKey
  }
  const state = frame.states[stateKey]

  if (!state) {
    return (
      <ErrorPanel>
        Frame <NodeBadge nodeId={frameName} /> has no states defined.
      </ErrorPanel>
    )
  }

  const variantKeys = (frame.variants ?? []) as readonly VariantKey[]
  const visibleVariants = Object.fromEntries(
    variantKeys.map((k) => [k, variants[k]]),
  ) as Partial<VariantValues>
  const renderKey = `${scene.name}:${renderedNodeId}:${frameName}:${stateKey}:${variantKeys
    .map((k) => `${k}=${variants[k]}`)
    .join(',')}`

  // Outcomes flow from the *intended* (entry) node only. The user is
  // conceptually "at the form" until they restart — even if they're now
  // viewing the status frame after dispatching, the form's outcomes are still
  // their next-step menu. We then strip any outcome whose target equals the
  // currently-rendered frame, because same-frame transitions are nonsense in
  // v3. When the gate failed we expose no outcomes at all (the user is at the
  // fallback, no real action is in scope).
  const outcomesForContext = redirected ? [] : visibleOutcomes(intendedNode, frameName)
  const action: SceneActionContextValue = {
    outcomes: outcomesForContext,
    dispatch: onDispatch,
  }

  const atInitial =
    currentNodeId === scene.scene.initial && !displayedFrame && !displayedState

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-1.5 text-[11px] text-gray-500">
        <span className="font-semibold uppercase tracking-wider text-gray-400">Node</span>
        <NodeBadge nodeId={currentNodeId} />
        {redirected && (
          <>
            <span className="text-gray-300">→</span>
            <NodeBadge nodeId={renderedNodeId} />
            <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              gate failed
            </span>
          </>
        )}
        <span className="text-gray-300">/</span>
        <span>{frameName}</span>
        <span className="text-gray-300">@</span>
        <span>{stateKey}</span>
        {!redirected && overrideFrame && overrideFrame !== intendedNode.frame && (
          <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
            via outcome
          </span>
        )}
        {variantKeys.length > 0 && (
          <span className="ml-2 text-gray-400">
            consumes: {variantKeys.map((k) => `${k}=${variants[k]}`).join(', ')}
          </span>
        )}
        <button
          onClick={onRestart}
          disabled={atInitial}
          className="ml-auto rounded-md px-2.5 py-0.5 text-[11px] text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
        >
          Restart
        </button>
      </div>

      {availableStates.length > 1 && (
        <StateBar
          states={availableStates}
          activeState={stateKey}
          onChange={onStateChange}
        />
      )}

      <div key={renderKey} className="flex flex-1 items-center justify-center bg-white p-10">
        <SceneActionContext.Provider value={action}>
          {state.render({ variants: visibleVariants })}
        </SceneActionContext.Provider>
      </div>
    </div>
  )
}
