import ts from 'typescript'
import path from 'node:path'
import { readFeatures } from './catalog'
import { analyzeBranches } from './branches'
import { arrayValues, compare, defaultValue, fileId, frameId, hash, lineOf, namedValue, objectEntries, posix, property, readSources, sourceFingerprint, stateId, stringValue, symbolId } from './source'
import type { EntryPoint, Finding, FrameInfo, GraphEdge, GraphNode, ProjectGraph } from './types'

export const EXTRACTOR_VERSION = '1'
const runtimeEdges = new Set(['contains', 'renders', 'calls', 'uses', 'references', 'represents', 'entry'])

export function walkGraph(graph: Pick<ProjectGraph, 'edges'>, initial: string[], options: { reverse?: boolean; kinds?: Set<string>; exclude?: Set<string> } = {}): Map<string, string[]> {
  const adjacent = new Map<string, string[]>()
  for (const edge of graph.edges) {
    if (options.kinds && !options.kinds.has(edge.kind)) continue
    const [from, to] = options.reverse ? [edge.to, edge.from] : [edge.from, edge.to]
    adjacent.set(from, [...(adjacent.get(from) ?? []), to])
  }
  const paths = new Map<string, string[]>()
  const queue = [...initial].sort()
  for (const id of queue) if (!options.exclude?.has(id)) paths.set(id, [id])
  for (let index = 0; index < queue.length; index++) {
    const from = queue[index]
    if (!paths.has(from)) continue
    for (const to of (adjacent.get(from) ?? []).sort()) {
      if (paths.has(to) || options.exclude?.has(to)) continue
      paths.set(to, [...paths.get(from)!, to])
      queue.push(to)
    }
  }
  return paths
}

export function scanProject(rootDir = process.cwd()): ProjectGraph {
  const root = path.resolve(rootDir)
  const sources = readSources(root)
  const files = Object.fromEntries(Object.entries(sources).map(([file, text]) => [file, hash(text)]))
  const catalog = readFeatures(sources)
  const findings: Finding[] = [...catalog.findings]
  const nodes = new Map<string, GraphNode>()
  const edges = new Map<string, GraphEdge>()
  const addNode = (node: GraphNode) => nodes.set(node.id, node)
  const addEdge = (from: string, to: string, kind: GraphEdge['kind'], file: string, line = 1) => {
    if (from === to) return
    const edge = { from, to, kind, file, line }
    edges.set(JSON.stringify(edge), edge)
  }
  const warn = (code: string, file: string, message: string, severity: Finding['severity'] = 'warning') => findings.push({ code, file, message, severity })
  for (const [file, digest] of Object.entries(files)) addNode({ id: fileId(file), kind: 'file', file, name: file, hash: digest })

  const configFile = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json')
  const config = configFile ? ts.readConfigFile(configFile, ts.sys.readFile) : { config: {} }
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const options: ts.CompilerOptions = { ...parsed.options, noEmit: true, allowJs: true, jsx: ts.JsxEmit.Preserve }
  const sourcePaths = Object.keys(sources).filter(file => /\.[cm]?[jt]sx?$/.test(file))
  const host = ts.createCompilerHost(options)
  const snapshot = new Map(Object.entries(sources).map(([file, source]) => [path.resolve(root, file), source]))
  const diskRead = host.readFile.bind(host)
  const diskExists = host.fileExists.bind(host)
  host.readFile = file => snapshot.get(path.resolve(file)) ?? diskRead(file)
  host.fileExists = file => snapshot.has(path.resolve(file)) || diskExists(file)
  host.getSourceFile = (file, languageVersion) => {
    const source = host.readFile(file)
    return source === undefined ? undefined : ts.createSourceFile(file, source, languageVersion, true)
  }
  const program = ts.createProgram(sourcePaths.map(file => path.join(root, file)), options, host)
  const checker = program.getTypeChecker()
  const sourceFiles = sourcePaths.map(file => program.getSourceFile(path.join(root, file))).filter((sf): sf is ts.SourceFile => Boolean(sf))
  const relative = (sf: ts.SourceFile) => posix(path.relative(root, sf.fileName))
  const declarations = new Map<ts.Node, string>()
  const byName = new Map<string, string>()

  // Symbol identity is scoped by file and named declaration, not line numbers.
  for (const sf of sourceFiles) {
    const file = relative(sf)
    const register = (node: ts.Node, parentId: string, scope: string) => {
      let name: string | undefined
      if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) name = node.name?.text ?? (ts.getModifiers(node)?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) ? 'default' : undefined)
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) name = node.name.text
      let owner = parentId
      let nextScope = scope
      if (name) {
        const qualified = scope ? `${scope}.${name}` : name
        owner = symbolId(file, qualified)
        declarations.set(node, owner)
        byName.set(`${file}#${qualified}`, owner)
        addNode({ id: owner, kind: 'symbol', file, name: qualified, line: lineOf(node), hash: hash(node.getText(sf)) })
        addEdge(parentId, owner, 'contains', file, lineOf(node))
        nextScope = qualified
      }
      ts.forEachChild(node, child => register(child, owner, nextScope))
    }
    register(sf, fileId(file), '')
  }

  function symbolTarget(node: ts.Node): string | undefined {
    let symbol = checker.getSymbolAtLocation(node)
    if (!symbol) return undefined
    if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
    if (!declaration) return undefined
    let current: ts.Node | undefined = declaration
    while (current && !ts.isSourceFile(current)) {
      const id = declarations.get(current)
      if (id) return id
      current = current.parent
    }
    const file = relative(declaration.getSourceFile())
    return files[file] ? fileId(file) : undefined
  }
  const isTypeReference = (node: ts.Node): boolean => {
    for (let p = node.parent; p && !ts.isStatement(p); p = p.parent) if (ts.isTypeNode(p)) return true
    return false
  }
  const frameComponents = new Map<string, Set<string>>()
  for (const sf of sourceFiles) {
    const file = relative(sf)
    const visit = (node: ts.Node, enclosing: string) => {
      const owner = declarations.get(node) ?? enclosing
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text
        const resolved = ts.resolveModuleName(specifier, sf.fileName, options, host).resolvedModule
        const targetFile = resolved && posix(path.relative(root, resolved.resolvedFileName))
        if (targetFile && files[targetFile]) addEdge(fileId(file), fileId(targetFile), (ts.isExportDeclaration(node) && node.isTypeOnly) || (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) ? 'type' : 'imports', file, lineOf(node))
        else if (specifier.startsWith('.') || specifier.startsWith('@/')) warn('unresolved-import', file, `Cannot statically resolve ${specifier}.`, 'info')
        return
      }
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const target = symbolTarget(node.tagName)
        if (target) {
          addEdge(owner, target, 'renders', file, lineOf(node))
          if (file.endsWith('.frame.tsx') && !nodes.get(target)!.file.startsWith('.atelier/')) {
            const components = frameComponents.get(file) ?? new Set<string>()
            components.add(target)
            frameComponents.set(file, components)
          }
        }
      }
      if (ts.isCallExpression(node)) {
        const target = symbolTarget(node.expression)
        if (target) addEdge(owner, target, 'calls', file, lineOf(node))
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword && !ts.isStringLiteralLike(node.arguments[0] ?? node)) warn('dynamic-import', file, 'Computed dynamic import cannot be resolved; dependency coverage is partial.')
      }
      if (ts.isIdentifier(node) && !ts.isImportSpecifier(node.parent)) {
        const target = symbolTarget(node)
        if (target) addEdge(owner, target, isTypeReference(node) ? 'type' : 'uses', file, lineOf(node))
      }
      ts.forEachChild(node, child => visit(child, owner))
    }
    visit(sf, fileId(file))
    for (const diagnostic of program.getSyntacticDiagnostics(sf)) warn('syntax-error', file, ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'), 'error')
  }

  const variants: ProjectGraph['variants'] = {}
  const variantFile = sourceFiles.find(sf => relative(sf) === '.atelier/variants.ts')
  if (variantFile) {
    const entries = objectEntries(namedValue(variantFile, 'variantAxes'))
    if (!entries) warn('dynamic-variants', relative(variantFile), 'variantAxes must be a static object for validation.')
    for (const [name, value] of entries ?? []) {
      const values = arrayValues(property(value, 'values'))?.map(v => stringValue(property(v, 'value')))
      const defaultValue = stringValue(property(value, 'default'))
      if (!values || values.some(v => !v) || !defaultValue) { warn('dynamic-variant', relative(variantFile), `Cannot resolve ${name}.`); continue }
      variants[name] = { values: values as string[], default: defaultValue }
      const id = `variant:${name}`
      addNode({ id, name, file: relative(variantFile), kind: 'variant', hash: hash(value.getText()) })
      addEdge(id, fileId(relative(variantFile)), 'references', relative(variantFile))
      if (!values.includes(defaultValue)) warn('invalid-variant-default', relative(variantFile), `${name} default is not an allowed value.`, 'error')
    }
  }

  const frames: FrameInfo[] = []
  for (const sf of sourceFiles.filter(sf => sf.fileName.endsWith('.frame.tsx'))) {
    const file = relative(sf)
    const meta = namedValue(sf, 'meta')
    const name = stringValue(property(meta, 'name'))
    const stateEntries = objectEntries(defaultValue(sf))
    const axesNode = property(meta, 'variants')
    const axes = axesNode ? arrayValues(axesNode)?.map(v => stringValue(v)) : []
    if (!name || !stateEntries || !axes || axes.some(v => !v)) { warn('dynamic-frame', file, 'Cannot resolve frame name, states or variants statically.', 'error'); continue }
    if (frames.some(frame => frame.name === name)) warn('duplicate-frame', file, `Duplicate registry name ${name}.`, 'error')
    const id = frameId(file)
    addNode({ id, kind: 'frame', name, file, hash: files[file] })
    addEdge(id, fileId(file), 'references', file)
    for (const [state, expression] of stateEntries) {
      const sid = stateId(file, state)
      addNode({ id: sid, kind: 'state', name: state, file, line: lineOf(expression), hash: hash(expression.getText()) })
      addEdge(id, sid, 'contains', file, lineOf(expression))
    }
    for (const axis of axes as string[]) {
      if (!variants[axis]) warn('unknown-variant', file, `Unknown variant ${axis}.`, 'error')
      else addEdge(id, `variant:${axis}`, 'variant', file)
    }
    const components = [...(frameComponents.get(file) ?? [])].sort()
    for (const target of components) addEdge(id, target, 'represents', file)
    frames.push({ id, file, name, states: stateEntries.map(([key]) => key), variants: axes as string[], components })
  }

  const referenceFrame = (from: string, file: string, value: ts.Expression, parentFrame?: string) => {
    const name = stringValue(property(value, 'frame'))
    const state = stringValue(property(value, 'state'))
    const frame = frames.find(f => f.name === name)
    if (!frame || !state || !frame.states.includes(state)) warn('broken-scene-reference', file, `Unknown frame/state: ${name ?? '?'}/${state ?? '?'}.`, 'error')
    if (frame) {
      addEdge(from, frame.id, 'references', file, lineOf(value))
      if (state && frame.states.includes(state)) addEdge(from, stateId(frame.file, state), 'references', file, lineOf(value))
    }
    if (parentFrame && name === parentFrame) warn('same-frame-outcome', file, `Outcome points to its own frame ${name}. Use StateBar for local states.`, 'error')
    return name
  }
  for (const sf of sourceFiles.filter(sf => sf.fileName.endsWith('.scene.tsx'))) {
    const file = relative(sf)
    const id = `scene:${file}`
    addNode({ id, name: stringValue(property(namedValue(sf, 'meta'), 'name')) ?? file, file, kind: 'scene', hash: files[file] })
    addEdge(id, fileId(file), 'references', file)
    const scene = defaultValue(sf)
    const sceneNodes = objectEntries(property(scene, 'nodes'))
    const initial = stringValue(property(scene, 'initial'))
    if (!sceneNodes) { warn('dynamic-scene', file, 'Scene nodes cannot be resolved statically.', 'error'); continue }
    const keys = sceneNodes.map(([key]) => key)
    if (!initial || !keys.includes(initial)) warn('invalid-scene-initial', file, 'Scene initial must reference an existing node.', 'error')
    for (const [name, node] of sceneNodes) {
      const frameName = referenceFrame(id, file, node)
      if (property(node, 'gate')) {
        const fallback = stringValue(property(node, 'fallback'))
        if (!fallback || !keys.includes(fallback)) warn('invalid-fallback', file, `${name} gate has no valid fallback.`, 'error')
        if (!stringValue(property(node, 'gateTrigger'))) warn('missing-gate-trigger', file, `${name} has no gateTrigger.`)
      }
      const outcomesNode = property(node, 'outcomes')
      const outcomes = outcomesNode ? arrayValues(outcomesNode) : []
      if (!outcomes) warn('dynamic-outcomes', file, `${name} outcomes cannot be resolved statically.`)
      for (const outcome of outcomes ?? []) {
        referenceFrame(id, file, outcome, frameName)
        if (!stringValue(property(outcome, 'trigger')) || !stringValue(property(outcome, 'description'))) warn('invalid-outcome', file, `${name} outcome needs trigger and description.`, 'error')
        for (const [axis, value] of objectEntries(property(outcome, 'set')) ?? []) {
          if (!variants[axis]?.values.includes(stringValue(value) ?? '')) warn('invalid-variant-set', file, `Invalid outcome variant assignment ${axis}.`, 'error')
          else addEdge(id, `variant:${axis}`, 'variant', file, lineOf(value))
        }
      }
    }
    const visit = (node: ts.Node) => {
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'variants') {
        if (!variants[node.name.text]) warn('unknown-gate-variant', file, `Unknown variant ${node.name.text}.`, 'error')
        else addEdge(id, `variant:${node.name.text}`, 'variant', file, lineOf(node))
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }

  // Mirror aliases are dependencies even when only the real implementation is imported.
  for (const file of sourcePaths.filter(f => f.startsWith('.atelier/mocks/') && !f.endsWith('.frame.tsx'))) {
    const target = file.slice('.atelier/mocks/'.length)
    if (files[target]) {
      addEdge(fileId(file), fileId(target), 'mocks', file)
      const real = program.getSourceFile(path.join(root, target))!
      const mock = program.getSourceFile(path.join(root, file))!
      const realModule = checker.getSymbolAtLocation(real)
      const mockModule = checker.getSymbolAtLocation(mock)
      const exported = (mod: ts.Symbol | undefined) => mod ? checker.getExportsOfModule(mod) : []
      for (const realSymbol of exported(realModule).filter(s => Boolean(s.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.Alias)))) {
        const mocked = exported(mockModule).find(s => s.name === realSymbol.name)
        if (!mocked) warn('missing-mock-export', file, `Missing runtime export ${realSymbol.name} from ${target}.`, 'error')
        else {
          const actual = checker.getTypeOfSymbolAtLocation(mocked, mock)
          const expected = checker.getTypeOfSymbolAtLocation(realSymbol, real)
          if (!checker.isTypeAssignableTo(actual, expected)) warn('mock-contract-mismatch', file, `${realSymbol.name} is incompatible with ${target}.`, 'error')
        }
      }
      // Frame setters resolve to mocks in preview, even when absent in the real module.
      for (const edge of [...edges.values()]) if ((edge.kind === 'imports' || edge.kind === 'uses' || edge.kind === 'calls') && nodes.get(edge.to)?.file === target) addEdge(edge.from, fileId(file), 'mocks', edge.file, edge.line)
    }
  }

  const resolveEntry = (entry: EntryPoint): string | undefined => {
    if (entry.symbol) {
      const direct = byName.get(`${entry.file}#${entry.symbol}`)
      if (direct) return direct
      const sf = program.getSourceFile(path.join(root, entry.file))
      const moduleSymbol = sf && checker.getSymbolAtLocation(sf)
      const exported = moduleSymbol && checker.getExportsOfModule(moduleSymbol).find(s => s.name === entry.symbol)
      const declaration = exported?.declarations?.[0]
      if (declaration) return symbolTarget((declaration as ts.NamedDeclaration).name ?? declaration)
      return undefined
    }
    if (entry.file.endsWith('.scene.tsx') && nodes.has(`scene:${entry.file}`)) return `scene:${entry.file}`
    return nodes.has(fileId(entry.file)) ? fileId(entry.file) : undefined
  }
  const usages: ProjectGraph['usages'] = []
  const classified = new Set<string>()
  for (const feature of catalog.features) {
    const file = `features/${feature.slug}/index.md`
    const fid = `feature:${feature.slug}`
    addNode({ id: fid, name: feature.name, file, kind: 'feature', hash: files[file] })
    const starts: string[] = []
    for (const entry of feature.entries) {
      const id = resolveEntry(entry)
      if (!id) warn('invalid-feature-entry', file, `Missing entry ${entry.file}${entry.symbol ? `#${entry.symbol}` : ''}.`, 'error')
      else { starts.push(id); addEdge(fid, id, 'entry', file) }
    }
    const excluded = new Set<string>()
    for (const entry of feature.exclude ?? []) {
      const id = resolveEntry(entry)
      if (!id) warn('invalid-feature-exclusion', file, `Missing exclusion ${entry.file}.`, 'error')
      else {
        excluded.add(id)
        if (!entry.symbol) for (const node of nodes.values()) if (node.file === entry.file) excluded.add(node.id)
      }
    }
    for (const scene of feature.scenes ?? []) {
      if (!nodes.has(`scene:${scene}`)) warn('invalid-feature-scene', file, `Unknown scene ${scene}.`, 'error')
      else { starts.push(`scene:${scene}`); addEdge(fid, `scene:${scene}`, 'entry', file) }
    }
    const reachable = walkGraph({ edges: [...edges.values()] }, starts, { kinds: runtimeEdges, exclude: excluded })
    for (const id of reachable.keys()) classified.add(id)
    for (const frame of frames) {
      const represented = [frame.id, ...frame.components].find(id => reachable.has(id))
      if (represented) usages.push({ feature: feature.slug, frame: frame.id, path: [fid, ...reachable.get(represented)!] })
    }
  }
  for (const file of sourcePaths.filter(f => /^(?:src\/)?app\/(?:.*\/)?page\.[jt]sx?$/.test(f))) {
    if (!classified.has(fileId(file)) && ![...nodes.values()].some(n => n.file === file && classified.has(n.id))) warn('unclassified-entry', file, 'Route has no declared feature entry. Extend the catalog; do not rediscover existing features.')
  }
  for (const frame of frames) if (!usages.some(u => u.frame === frame.id)) warn('unclassified-frame', frame.file, `${frame.name} has no path from a feature entry. Shared or preview-only frames may remain unclassified.`, 'info')
  const branches = Object.entries(sources).filter(([file]) => /^(?:src\/)?(?:components|app)\/.*\.[jt]sx$/.test(file)).flatMap(([file, source]) => analyzeBranches(source, file))
  for (const branch of branches) {
    addNode({ id: branch.id, name: branch.expression, file: branch.file, kind: 'branch', line: branch.line, hash: hash(`${branch.kind}:${branch.expression}`) })
    const owner = byName.get(`${branch.file}#${branch.owner.replace(/^module\./, '')}`) ?? fileId(branch.file)
    addEdge(owner, branch.id, 'contains', branch.file, branch.line)
  }
  const sortedEdges = [...edges.values()].sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)))
  return {
    schemaVersion: 1, extractorVersion: EXTRACTOR_VERSION,
    fingerprint: sourceFingerprint(sources, EXTRACTOR_VERSION), files,
    nodes: [...nodes.values()].sort((a, b) => compare(a.id, b.id)), edges: sortedEdges,
    frames: frames.sort((a, b) => compare(a.id, b.id)), features: catalog.features,
    usages: usages.sort((a, b) => compare(`${a.feature}:${a.frame}`, `${b.feature}:${b.frame}`)), variants, branches,
    findings: findings.sort((a, b) => compare(`${a.file}:${a.code}:${a.message}`, `${b.file}:${b.code}:${b.message}`)),
  }
}
