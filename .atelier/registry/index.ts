import type {
  ComponentState,
  MockMeta,
  RegistryEntry,
  SceneDef,
  SceneEntry,
  SceneMeta,
  StateKey,
} from './types'

type FrameModule = {
  default: Record<StateKey, ComponentState>
  meta: MockMeta
}

type SceneModule = {
  default: SceneDef
  meta: SceneMeta
}

const frameMods = import.meta.glob<FrameModule>('../mocks/**/*.frame.tsx', { eager: true })
const sceneMods = import.meta.glob<SceneModule>('../scenes/**/*.scene.tsx', { eager: true })

export const registry: RegistryEntry[] = Object.values(frameMods).map((mod) => ({
  ...mod.meta,
  states: mod.default,
}))

export const scenes: SceneEntry[] = Object.values(sceneMods).map((mod) => ({
  ...mod.meta,
  scene: mod.default,
}))
