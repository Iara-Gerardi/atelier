import { useMemo } from 'react'
import { registry } from './registry'
import type { RegistryEntry, SceneEntry, SceneNode, StateKey } from './registry/types'
import type { VariantKey, VariantValues } from './variants'

interface SceneGraphProps {
  scene: SceneEntry
  variants: VariantValues
  /** Navigate the live scene to a node (clears any outcome override). */
  onNavigateNode: (nodeId: string) => void
}

interface Screen {
  key: string
  frame: string
  state: StateKey
  /** Present when this screen is a scene node (navigable). */
  nodeId?: string
  /** True when this is a node screen whose gate fails under the variant. */
  gatedOut?: boolean
  level: number
  row: number
}

interface Edge {
  from: string
  to: string
  label: string
  kind: 'outcome' | 'gate'
}

// Card + layout geometry.
const CARD_W = 264
const PREVIEW_H = 176
const HEADER_H = 40
const CARD_H = HEADER_H + PREVIEW_H
const COL_W = CARD_W + 120
const ROW_H = CARD_H + 56
const PAD = 36
const SCALE = 0.34

function passesGate(node: SceneNode, variants: VariantValues): boolean {
  if (!node.gate) return true
  try {
    return node.gate({ variants })
  } catch {
    return false
  }
}

const screenKey = (frame: string, state: StateKey) => `${frame}\u0000${state}`

/**
 * Walk the scene under the CURRENT variant assignment and produce a directed
 * graph of *screens* (frame@state). Gates are evaluated live: a node whose
 * gate fails is drawn dimmed with a dashed edge to its fallback; every
 * non-no-op outcome becomes an arrow to the target screen. Screens are then
 * layered (longest-path columns) and rowed for an auto-layout canvas.
 */
function buildGraph(
  scene: SceneEntry,
  variants: VariantValues,
): { screens: Screen[]; edges: Edge[] } {
  const nodes = scene.scene.nodes
  const okNodeByScreen = new Map<string, { id: string; node: SceneNode }>()
  const gatedByScreen = new Map<string, { id: string; node: SceneNode }>()
  for (const [id, node] of Object.entries(nodes)) {
    const k = screenKey(node.frame, node.state)
    if (passesGate(node, variants)) okNodeByScreen.set(k, { id, node })
    else gatedByScreen.set(k, { id, node })
  }

  const screens = new Map<string, Screen>()
  const edges: Edge[] = []
  const edgeSet = new Set<string>()
  const queue: string[] = []

  function addScreen(frame: string, state: StateKey): string {
    const k = screenKey(frame, state)
    if (!screens.has(k)) {
      const ok = okNodeByScreen.get(k)
      const gated = gatedByScreen.get(k)
      screens.set(k, {
        key: k,
        frame,
        state,
        nodeId: ok?.id ?? gated?.id,
        gatedOut: !!gated,
        level: 0,
        row: 0,
      })
      queue.push(k)
    }
    return k
  }

  function addEdge(from: string, to: string, label: string, kind: Edge['kind']) {
    const id = `${from}|${to}|${label}`
    if (edgeSet.has(id)) return
    edgeSet.add(id)
    edges.push({ from, to, label, kind })
  }

  const initialNode = nodes[scene.scene.initial]
  if (!initialNode) return { screens: [], edges: [] }
  const seedKey = addScreen(initialNode.frame, initialNode.state)

  while (queue.length) {
    const k = queue.shift() as string
    const ok = okNodeByScreen.get(k)
    if (ok) {
      for (const o of (ok.node.outcomes ?? []).filter((o) => o.frame !== ok.node.frame)) {
        const tk = addScreen(o.frame, o.state)
        addEdge(k, tk, o.id, 'outcome')
      }
    }
    const gated = gatedByScreen.get(k)
    if (gated) {
      const fb = gated.node.fallback
      const fbNode = fb ? nodes[fb] : undefined
      if (fbNode) {
        const fk = addScreen(fbNode.frame, fbNode.state)
        addEdge(k, fk, gated.node.gateTrigger ?? 'gate failed', 'gate')
      }
    }
  }

  // Longest-path layering so a screen always sits to the right of its parents.
  const level = new Map<string, number>()
  for (const k of screens.keys()) level.set(k, 0)
  level.set(seedKey, 0)
  for (let i = 0; i < screens.size; i++) {
    let changed = false
    for (const e of edges) {
      const want = (level.get(e.from) ?? 0) + 1
      if (want > (level.get(e.to) ?? 0)) {
        level.set(e.to, want)
        changed = true
      }
    }
    if (!changed) break
  }

  const order = [...screens.values()]
  const rowCounter = new Map<number, number>()
  for (const s of order) {
    s.level = level.get(s.key) ?? 0
    const r = rowCounter.get(s.level) ?? 0
    s.row = r
    rowCounter.set(s.level, r + 1)
  }

  return { screens: order, edges }
}

function visibleVariantsFor(
  entry: RegistryEntry | undefined,
  variants: VariantValues,
): Partial<VariantValues> {
  const keys = (entry?.variants ?? []) as readonly VariantKey[]
  return Object.fromEntries(keys.map((k) => [k, variants[k]])) as Partial<VariantValues>
}

function ScreenCard({
  screen,
  variants,
  onNavigateNode,
}: {
  screen: Screen
  variants: VariantValues
  onNavigateNode: (nodeId: string) => void
}) {
  const entry = registry.find((e) => e.name === screen.frame)
  const stateObj =
    entry?.states[screen.state] ?? (entry ? entry.states[Object.keys(entry.states)[0]] : undefined)
  const visibleVariants = visibleVariantsFor(entry, variants)

  const headerInner = (
    <>
      {screen.nodeId && (
        <span
          className={`font-mono text-[10px] ${
            screen.gatedOut ? 'text-gray-400 line-through' : 'text-indigo-600'
          }`}
        >
          {screen.nodeId}
        </span>
      )}
      <span
        className="truncate text-[11px] text-gray-600"
        title={`${screen.frame} @ ${screen.state}`}
      >
        {screen.frame} <span className="text-gray-400">@ {screen.state}</span>
      </span>
      {screen.gatedOut && (
        <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
          gated
        </span>
      )}
    </>
  )

  const navigable = !!screen.nodeId && !screen.gatedOut

  return (
    <div
      className={`absolute overflow-hidden rounded-xl border bg-white shadow-sm ${
        screen.gatedOut ? 'border-dashed border-amber-300 opacity-70' : 'border-gray-200'
      }`}
      style={{ left: PAD + screen.level * COL_W, top: PAD + screen.row * ROW_H, width: CARD_W }}
    >
      {navigable ? (
        <button
          onClick={() => onNavigateNode(screen.nodeId!)}
          title={`Go to node ${screen.nodeId}`}
          className="flex w-full items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-2.5 text-left transition-colors hover:bg-indigo-50"
          style={{ height: HEADER_H }}
        >
          {headerInner}
        </button>
      ) : (
        <div
          className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-2.5"
          style={{ height: HEADER_H }}
        >
          {headerInner}
        </div>
      )}
      <div className="relative overflow-hidden bg-white" style={{ height: PREVIEW_H }}>
        <div
          className="pointer-events-none flex items-center justify-center p-6"
          style={{
            width: CARD_W / SCALE,
            height: PREVIEW_H / SCALE,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          {stateObj ? (
            stateObj.render({ variants: visibleVariants })
          ) : (
            <span className="text-2xl text-gray-300">frame not found</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SceneGraph({ scene, variants, onNavigateNode }: SceneGraphProps) {
  const { screens, edges } = useMemo(() => buildGraph(scene, variants), [scene, variants])

  const relevantKeys = useMemo(() => {
    const out = new Set<VariantKey>()
    for (const node of Object.values(scene.scene.nodes)) {
      const frames = new Set<string>([node.frame, ...(node.outcomes ?? []).map((o) => o.frame)])
      for (const frameName of frames) {
        const entry = registry.find((e) => e.name === frameName)
        for (const key of entry?.variants ?? []) out.add(key as VariantKey)
      }
    }
    return [...out]
  }, [scene])

  const byKey = useMemo(() => new Map(screens.map((s) => [s.key, s])), [screens])
  const maxLevel = screens.reduce((m, s) => Math.max(m, s.level), 0)
  const maxRow = screens.reduce((m, s) => Math.max(m, s.row), 0)
  const width = PAD * 2 + maxLevel * COL_W + CARD_W
  const height = PAD * 2 + maxRow * ROW_H + CARD_H

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
      <div className="z-10 flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-6 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Scene map
        </span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
          {screens.length} {screens.length === 1 ? 'screen' : 'screens'}
        </span>
        {relevantKeys.length > 0 && (
          <span className="ml-2 flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
            given
            {relevantKeys.map((k) => (
              <code key={k} className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-indigo-700">
                {k}={variants[k]}
              </code>
            ))}
          </span>
        )}
      </div>

      <div className="relative flex-1 overflow-auto">
        {screens.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No reachable screens for this scene.</p>
        ) : (
          <div className="relative" style={{ width, height }}>
            <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
              <defs>
                <marker
                  id="arrow-outcome"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0 0 L6 3 L0 6 Z" className="fill-indigo-400" />
                </marker>
                <marker
                  id="arrow-gate"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0 0 L6 3 L0 6 Z" className="fill-amber-400" />
                </marker>
              </defs>
              {edges.map((e, i) => {
                const from = byKey.get(e.from)
                const to = byKey.get(e.to)
                if (!from || !to) return null
                const sx = PAD + from.level * COL_W + CARD_W
                const sy = PAD + from.row * ROW_H + CARD_H / 2
                const tx = PAD + to.level * COL_W
                const ty = PAD + to.row * ROW_H + CARD_H / 2
                const dx = Math.max(50, Math.abs(tx - sx) / 2)
                const gate = e.kind === 'gate'
                return (
                  <path
                    key={i}
                    d={`M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`}
                    fill="none"
                    className={gate ? 'stroke-amber-400' : 'stroke-indigo-400'}
                    strokeWidth={1.5}
                    strokeDasharray={gate ? '4 3' : undefined}
                    markerEnd={`url(#${gate ? 'arrow-gate' : 'arrow-outcome'})`}
                  />
                )
              })}
            </svg>

            {edges.map((e, i) => {
              const from = byKey.get(e.from)
              const to = byKey.get(e.to)
              if (!from || !to) return null
              const sx = PAD + from.level * COL_W + CARD_W
              const sy = PAD + from.row * ROW_H + CARD_H / 2
              const tx = PAD + to.level * COL_W
              const ty = PAD + to.row * ROW_H + CARD_H / 2
              const gate = e.kind === 'gate'
              return (
                <span
                  key={i}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[9px] font-medium shadow-sm ${
                    gate
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-indigo-200 bg-white text-indigo-600'
                  }`}
                  style={{ left: (sx + tx) / 2, top: (sy + ty) / 2 }}
                >
                  {e.label}
                </span>
              )
            })}

            {screens.map((s) => (
              <ScreenCard
                key={s.key}
                screen={s}
                variants={variants}
                onNavigateNode={onNavigateNode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
