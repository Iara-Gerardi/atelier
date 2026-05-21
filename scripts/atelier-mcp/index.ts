import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { chromium, type Browser, type Page } from 'playwright'
import { z } from 'zod'
import { generateFrameInputSchema, runGenerateFrame } from '../../ai/tools/generate-frame'

const ATELIER_URL = process.env.ATELIER_URL ?? 'http://localhost:5173'
const REGISTRY_URL = `${ATELIER_URL}/api/registry`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StateInfo {
  description: string | null
}

interface StoryInfo {
  name: string
  category: string
  tags: string[]
  states: Record<string, StateInfo>
}

// ---------------------------------------------------------------------------
// Registry fetch (always live — driven by running Atelier server)
// ---------------------------------------------------------------------------

async function fetchRegistry(): Promise<StoryInfo[]> {
  const res = await fetch(REGISTRY_URL)
  if (!res.ok) throw new Error(`Registry fetch failed: ${res.status} ${res.statusText}`)
  return res.json() as Promise<StoryInfo[]>
}

function findStory(registry: StoryInfo[], name: string): StoryInfo {
  const story = registry.find((s) => s.name === name)
  if (!story) {
    const available = registry.map((s) => s.name).join(', ')
    throw new Error(`Story "${name}" not found. Available: ${available}`)
  }
  return story
}

// ---------------------------------------------------------------------------
// Playwright browser (lazy, shared)
// ---------------------------------------------------------------------------

let browser: Browser | null = null
let activePage: Page | null = null

async function getPage(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch({ headless: true })
  }
  if (!activePage || activePage.isClosed()) {
    activePage = await browser.newPage()
    await activePage.setViewportSize({ width: 1280, height: 800 })
  }
  return activePage
}

process.on('exit', () => { browser?.close() })
process.on('SIGINT', () => { browser?.close(); process.exit(0) })
process.on('SIGTERM', () => { browser?.close(); process.exit(0) })

async function navigateToStory(story: string, state: string): Promise<void> {
  const page = await getPage()
  const url = `${ATELIER_URL}/?story=${encodeURIComponent(story)}&state=${encodeURIComponent(state)}`
  await page.goto(url, { waitUntil: 'networkidle' })
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: 'atelier',
  version: '0.1.0',
})

// list_stories ---------------------------------------------------------------

server.tool(
  'list_stories',
  'Use only during a QA verification pass to enumerate registered component stories. Do not call to answer general questions about what components exist in the codebase — read source files instead.',

  {
    category: z.string().optional().describe('Filter by category name (case-sensitive)'),
    tag: z.string().optional().describe('Filter by tag (case-sensitive)'),
  },
  async ({ category, tag }) => {
    const registry = await fetchRegistry()
    const filtered = registry.filter((s) => {
      if (category && s.category !== category) return false
      if (tag && !s.tags.includes(tag)) return false
      return true
    })
    const text = filtered
      .map((s) => `${s.name} [${s.category}]${s.tags.length ? ` (${s.tags.join(', ')})` : ''} — states: ${Object.keys(s.states).join(', ')}`)
      .join('\n')
    return { content: [{ type: 'text', text: text || 'No stories match the filter.' }] }
  }
)

// get_story_info -------------------------------------------------------------

server.tool(
  'get_story_info',
  'Use during a QA verification pass to inspect a story\'s states and metadata. Do not call speculatively — only when verifying a specific component as part of a QA run.',

  {
    story: z.string().describe('Exact story name (e.g. "Badge", "ExampleSearchTab")'),
  },
  async ({ story }) => {
    const registry = await fetchRegistry()
    const entry = findStory(registry, story)
    const lines = [
      `Story: ${entry.name}`,
      `Category: ${entry.category}`,
      `Tags: ${entry.tags.join(', ') || '(none)'}`,
      '',
      'States:',
      ...Object.entries(entry.states).map(
        ([key, { description }]) => `  ${key}: ${description ?? '(no description)'}`
      ),
    ]
    return { content: [{ type: 'text', text: lines.join('\n') }] }
  }
)

// navigate_to_story ----------------------------------------------------------

server.tool(
  'navigate_to_story',
  'Open a story state in the live Atelier browser preview. Only use when the running Atelier dev server is needed for QA verification. Requires Atelier to be running on localhost. Do not call unless explicitly performing a QA verification run.',

  {
    story: z.string().describe('Exact story name'),
    state: z.string().describe('State key to activate'),
  },
  async ({ story, state }) => {
    const registry = await fetchRegistry()
    const entry = findStory(registry, story)
    if (!(state in entry.states)) {
      const available = Object.keys(entry.states).join(', ')
      throw new Error(`State "${state}" not found in "${story}". Available: ${available}`)
    }
    await navigateToStory(story, state)
    return {
      content: [{ type: 'text', text: `Navigated to ${story} / ${state}` }],
    }
  }
)

// generate_frame -------------------------------------------------------------

server.tool(
  'generate_frame',
  'Generate a strongly-typed Atelier frame from one source component file. Use mode=preview to inspect output without writing files, or mode=write to create/update the frame under .atelier/frames/.',
  {
    componentPath: generateFrameInputSchema.shape.componentPath,
    componentName: generateFrameInputSchema.shape.componentName,
    category: generateFrameInputSchema.shape.category,
    tags: generateFrameInputSchema.shape.tags,
    stateHints: generateFrameInputSchema.shape.stateHints,
    variants: generateFrameInputSchema.shape.variants,
    mode: generateFrameInputSchema.shape.mode,
    outputPath: generateFrameInputSchema.shape.outputPath,
    model: generateFrameInputSchema.shape.model,
  },
  async (input) => {
    const result = await runGenerateFrame(input, { rootDir: process.cwd() })
    const header = [
      `Mode: ${result.mode}`,
      `Output path: ${result.outputPath}`,
      `Component path: ${result.componentPath}`,
      `Model: ${result.model}`,
      '',
    ].join('\n')

    const text =
      result.mode === 'preview'
        ? `${header}${result.frameSource}`
        : `${header}Frame file written successfully.`

    return { content: [{ type: 'text', text }] }
  }
)

// generate_frame_from_chat ---------------------------------------------------

server.tool(
  'generate_frame_from_chat',
  'Chat-friendly wrapper for generate_frame that accepts a component name and infers components/<name>.tsx. Use mode=preview to inspect output or mode=write to create/update a frame under .atelier/frames/.',
  {
    componentName: z
      .string()
      .min(1)
      .describe('Component file base name under components/ (for example "StatusCard").'),
    category: generateFrameInputSchema.shape.category,
    tags: generateFrameInputSchema.shape.tags,
    stateHints: generateFrameInputSchema.shape.stateHints,
    variants: generateFrameInputSchema.shape.variants,
    mode: generateFrameInputSchema.shape.mode,
    outputPath: generateFrameInputSchema.shape.outputPath,
    model: generateFrameInputSchema.shape.model,
  },
  async ({ componentName, ...input }) => {
    const normalizedComponentName = componentName.replace(/\.(tsx|ts|jsx|js)$/i, '')
    const componentPath = `components/${normalizedComponentName}.tsx`
    const result = await runGenerateFrame(
      {
        ...input,
        componentName: normalizedComponentName,
        componentPath,
      },
      { rootDir: process.cwd() }
    )

    const header = [
      `Mode: ${result.mode}`,
      `Output path: ${result.outputPath}`,
      `Component path: ${result.componentPath}`,
      `Model: ${result.model}`,
      '',
    ].join('\n')

    const text =
      result.mode === 'preview'
        ? `${header}${result.frameSource}`
        : `${header}Frame file written successfully.`

        console.log
    return { content: [{ type: 'text', text }] }
  }
)

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`atelier-mcp failed: ${message}`)
  process.exitCode = 1
})
