import { useEffect, useState } from 'react'
import type { RegistryEntry, SceneEntry, StateKey } from '@/.atelier/registry/types'
import { registry, scenes } from '@/.atelier/registry'
import {
  defaultVariants,
  variantAxes,
  type VariantKey,
  type VariantValues,
} from './variants'
import StateBar from './StateBar'
import ComponentCanvas from './ComponentCanvas'
import CanvasGrid from './CanvasGrid'
import VariantBar from './VariantBar'
import SceneCanvas from './SceneCanvas'

type Mode = 'frame' | 'scene' | 'canvas'

interface Selection {
  mode: Mode
  frameIndex: number
  stateKey: StateKey
  sceneIndex: number
  nodeId: string
  /**
   * Scene-mode-only override of the rendered frame, set after the user
   * dispatches an outcome. Undefined means "render the node's frame".
   */
  sceneFrame?: string
  /**
   * Scene-mode-only override of the rendered state, set by either an outcome
   * dispatch (= outcome.state) or a StateBar interaction.
   */
  sceneState?: StateKey
}

function parseVariantsParam(raw: string | null): Partial<VariantValues> {
  if (!raw) return {}
  const out: Partial<VariantValues> = {}
  for (const piece of raw.split(',')) {
    const [key, value] = piece.split(':')
    if (!key || !value) continue
    if (!(key in variantAxes)) continue
    const axis = variantAxes[key as VariantKey]
    if (axis.values.some((v) => v.value === value)) {
      ;(out as Record<string, string>)[key] = value
    }
  }
  return out
}

function serializeVariants(values: VariantValues): string {
  // Only encode non-default values so URLs stay short and round-trip cleanly.
  return (Object.keys(variantAxes) as VariantKey[])
    .filter((k) => values[k] !== defaultVariants[k])
    .map((k) => `${k}:${values[k]}`)
    .join(',')
}

function resolveInitialSelection(): Selection {
  const params = new URLSearchParams(window.location.search)
  const sceneName = params.get('scene')
  if (sceneName) {
    const sceneIndex = scenes.findIndex((s) => s.name === sceneName)
    if (sceneIndex !== -1) {
      const scene = scenes[sceneIndex]
      const nodeParam = params.get('node')
      const nodeId =
        nodeParam && scene.scene.nodes[nodeParam] ? nodeParam : scene.scene.initial
      const frameParam = params.get('frame') ?? undefined
      const sceneFrame =
        frameParam && registry.some((r) => r.name === frameParam) ? frameParam : undefined
      const stateParam = params.get('state') ?? undefined
      const stateFrame =
        sceneFrame ?? scene.scene.nodes[nodeId]?.frame ?? ''
      const stateRegistry = registry.find((r) => r.name === stateFrame)
      const sceneState =
        stateParam && stateRegistry?.states[stateParam] ? stateParam : undefined
      return {
        mode: 'scene',
        sceneIndex,
        nodeId,
        sceneFrame,
        sceneState,
        frameIndex: 0,
        stateKey: registry.length > 0 ? Object.keys(registry[0].states)[0] : '',
      }
    }
  }
  if (params.get('mode') === 'canvas') {
    return {
      mode: 'canvas',
      sceneIndex: 0,
      nodeId: scenes.length > 0 ? scenes[0].scene.initial : '',
      frameIndex: 0,
      stateKey: registry.length > 0 ? Object.keys(registry[0].states)[0] : '',
    }
  }
  const story = params.get('story')
  let frameIndex = 0
  if (story) {
    const idx = registry.findIndex((e) => e.name === story)
    if (idx !== -1) frameIndex = idx
  }
  const state = params.get('state')
  const stateKeys = registry.length > 0 ? Object.keys(registry[frameIndex].states) : []
  const stateKey = state && stateKeys.includes(state) ? state : stateKeys[0] ?? ''
  return {
    mode: 'frame',
    frameIndex,
    stateKey,
    sceneIndex: 0,
    nodeId: scenes.length > 0 ? scenes[0].scene.initial : '',
  }
}

function resolveInitialVariants(): VariantValues {
  const params = new URLSearchParams(window.location.search)
  return { ...defaultVariants, ...parseVariantsParam(params.get('v')) }
}

function groupByCategory(entries: RegistryEntry[]): Record<string, RegistryEntry[]> {
  return entries.reduce<Record<string, RegistryEntry[]>>((acc, entry) => {
    const group = acc[entry.category] ?? []
    return { ...acc, [entry.category]: [...group, entry] }
  }, {})
}

function groupScenesByCategory(entries: SceneEntry[]): Record<string, SceneEntry[]> {
  return entries.reduce<Record<string, SceneEntry[]>>((acc, entry) => {
    const group = acc[entry.category] ?? []
    return { ...acc, [entry.category]: [...group, entry] }
  }, {})
}

function allTags(entries: RegistryEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.tags ?? []))].sort()
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  )
}

function SingleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  )
}

/**
 * Variants the scene cares about = union of `meta.variants` across every
 * frame referenced by any node (entry or outcome target). Frames that don't
 * opt in contribute nothing.
 */
function sceneRelevantVariants(scene: SceneEntry): VariantKey[] {
  const out = new Set<VariantKey>()
  for (const node of Object.values(scene.scene.nodes)) {
    const frames = new Set<string>([node.frame])
    for (const outcome of node.outcomes ?? []) {
      frames.add(outcome.frame)
    }
    for (const frameName of frames) {
      const entry = registry.find((e) => e.name === frameName)
      for (const key of entry?.variants ?? []) {
        out.add(key as VariantKey)
      }
    }
  }
  return [...out]
}

export default function PreviewShell() {
  const [selection, setSelection] = useState<Selection>(() => resolveInitialSelection())
  const [variants, setVariants] = useState<VariantValues>(() => resolveInitialVariants())
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  useEffect(() => {
    const params = new URLSearchParams()
    if (selection.mode === 'scene') {
      const scene = scenes[selection.sceneIndex]
      if (scene) {
        params.set('scene', scene.name)
        params.set('node', selection.nodeId)
        if (selection.sceneFrame) params.set('frame', selection.sceneFrame)
        if (selection.sceneState) params.set('state', selection.sceneState)
      }
    } else if (selection.mode === 'canvas') {
      params.set('mode', 'canvas')
    } else {
      const frame = registry[selection.frameIndex]
      if (frame) {
        params.set('story', frame.name)
        params.set('state', selection.stateKey)
      }
    }
    const serialized = serializeVariants(variants)
    if (serialized) params.set('v', serialized)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [selection, variants])

  const frameGroups = groupByCategory(registry)
  const sceneGroups = groupScenesByCategory(scenes)
  const tags = allTags(registry)

  const filteredEntries = registry.filter((entry) => {
    const categoryMatch = activeCategories.size === 0 || activeCategories.has(entry.category)
    const tagMatch =
      activeTags.size === 0 || (entry.tags ?? []).some((t: string) => activeTags.has(t))
    return categoryMatch && tagMatch
  })

  function toggleCategory(cat: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  function selectFrame(idx: number) {
    const stateKey = Object.keys(registry[idx].states)[0]
    setSelection((prev) => ({
      ...prev,
      mode: 'frame',
      frameIndex: idx,
      stateKey,
      sceneFrame: undefined,
      sceneState: undefined,
    }))
  }

  function selectScene(idx: number) {
    const scene = scenes[idx]
    setSelection((prev) => ({
      ...prev,
      mode: 'scene',
      sceneIndex: idx,
      nodeId: scene.scene.initial,
      sceneFrame: undefined,
      sceneState: undefined,
    }))
  }

  function setActiveState(stateKey: StateKey) {
    setSelection((prev) => ({ ...prev, stateKey }))
  }

  function setMode(mode: Mode) {
    setSelection((prev) => ({ ...prev, mode }))
  }

  function handleDispatch(outcomeId: string) {
    const scene = scenes[selection.sceneIndex]
    if (!scene) return
    const node = scene.scene.nodes[selection.nodeId]
    const outcome = node?.outcomes?.find((o) => o.id === outcomeId)
    if (!outcome) return
    if (outcome.set) {
      setVariants((prev) => ({ ...prev, ...outcome.set }))
    }
    setSelection((prev) => ({
      ...prev,
      sceneFrame: outcome.frame,
      sceneState: outcome.state,
    }))
  }

  function handleSceneStateChange(stateKey: StateKey) {
    setSelection((prev) => {
      const scene = scenes[prev.sceneIndex]
      // If no frame override is set yet, lock it to the entry node's frame so
      // the URL captures what the user is looking at unambiguously.
      const sceneFrame =
        prev.sceneFrame ?? scene?.scene.nodes[prev.nodeId]?.frame ?? prev.sceneFrame
      return { ...prev, sceneFrame, sceneState: stateKey }
    })
  }

  function restartScene() {
    const scene = scenes[selection.sceneIndex]
    if (!scene) return
    setSelection((prev) => ({
      ...prev,
      nodeId: scene.scene.initial,
      sceneFrame: undefined,
      sceneState: undefined,
    }))
  }

  const activeFrame = registry[selection.frameIndex]
  const activeScene = scenes[selection.sceneIndex]
  const availableStates = activeFrame ? Object.keys(activeFrame.states) : []

  let topBarTitle = 'Canvas'
  if (selection.mode === 'frame' && activeFrame) topBarTitle = activeFrame.name
  if (selection.mode === 'scene' && activeScene) {
    const fragments = [activeScene.name, selection.nodeId]
    if (selection.sceneFrame && selection.sceneFrame !== activeScene.scene.nodes[selection.nodeId]?.frame) {
      fragments.push(selection.sceneFrame)
    }
    topBarTitle = fragments.join(' · ')
  }

  let relevantVariantKeys: VariantKey[] = []
  if (selection.mode === 'frame' && activeFrame) {
    relevantVariantKeys = (activeFrame.variants ?? []) as readonly unknown[] as VariantKey[]
  } else if (selection.mode === 'scene' && activeScene) {
    relevantVariantKeys = sceneRelevantVariants(activeScene)
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans text-sm">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col overflow-y-auto bg-gray-900 py-4">
        <div className="mb-4 px-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Atelier
          </span>
        </div>

        {scenes.length > 0 && (
          <div className="mb-4">
            <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Scenes
            </p>
            {Object.entries(sceneGroups).map(([category, entries]) => (
              <div key={category} className="mb-2">
                {Object.keys(sceneGroups).length > 1 && (
                  <p className="mb-0.5 px-4 text-[10px] uppercase tracking-wider text-gray-600">
                    {category}
                  </p>
                )}
                {entries.map((entry) => {
                  const idx = scenes.indexOf(entry)
                  const isActive = selection.mode === 'scene' && idx === selection.sceneIndex
                  return (
                    <button
                      key={entry.name}
                      onClick={() => selectScene(idx)}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-gray-800 font-medium text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      }`}
                    >
                      {entry.name}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {Object.entries(frameGroups).map(([category, entries]) => (
          <div key={category} className="mb-4">
            <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {category}
            </p>
            {entries.map((entry) => {
              const idx = registry.indexOf(entry)
              const isActive = idx === selection.frameIndex && selection.mode === 'frame'
              return (
                <button
                  key={entry.name}
                  onClick={() => selectFrame(idx)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-800 font-medium text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {entry.name}
                </button>
              )
            })}
          </div>
        ))}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="font-medium text-gray-800">{topBarTitle}</span>
          <button
            onClick={() => setMode(selection.mode === 'canvas' ? 'frame' : 'canvas')}
            title={selection.mode === 'canvas' ? 'Back to single view' : 'Open canvas view'}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            {selection.mode === 'canvas' ? <SingleIcon /> : <GridIcon />}
          </button>
        </div>

        {/* Variant bar — only when at least one axis applies to the active frame/scene */}
        {selection.mode !== 'canvas' && relevantVariantKeys.length > 0 && (
          <VariantBar
            keys={relevantVariantKeys}
            values={variants}
            onChange={setVariants}
          />
        )}

        {selection.mode === 'frame' && activeFrame && (
          <>
            <StateBar
              states={availableStates}
              activeState={selection.stateKey}
              onChange={setActiveState}
            />
            <ComponentCanvas
              entry={activeFrame}
              activeState={selection.stateKey}
              variants={variants}
            />
          </>
        )}

        {selection.mode === 'scene' && activeScene && (
          <SceneCanvas
            scene={activeScene}
            currentNodeId={selection.nodeId}
            displayedFrame={selection.sceneFrame}
            displayedState={selection.sceneState}
            variants={variants}
            onDispatch={handleDispatch}
            onStateChange={handleSceneStateChange}
            onRestart={restartScene}
          />
        )}

        {selection.mode === 'canvas' && (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-6 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Category
              </span>
              {Object.keys(frameGroups).map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    activeCategories.has(cat)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {tags.length > 0 && (
                <>
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Tag
                  </span>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        activeTags.has(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </>
              )}
            </div>
            <CanvasGrid entries={filteredEntries} />
          </>
        )}
      </div>
    </div>
  )
}
