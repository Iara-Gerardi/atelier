import ts from 'typescript'
import { hash } from './source'

export interface RenderBranch {
  id: string
  file: string
  owner: string
  kind: 'if' | 'conditional' | 'logical' | 'attribute' | 'case'
  expression: string
  line: number
  outcomes: string[]
  sourceHash: string
  start: number
}

function hasOwnJsx(node: ts.Node): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true
  return Boolean(ts.forEachChild(node, child => ts.isFunctionLike(child) ? false : hasOwnJsx(child)))
}

function functionName(node: ts.Node): string {
  if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name) return node.name.text
  if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) return node.parent.name.text
  return `anonymous`
}

/** Conservative inventory of render decisions. It deliberately does not call branches "states". */
export function analyzeBranches(source: string, file: string): RenderBranch[] {
  return prepare(source, file).branches
}

function prepare(source: string, file: string) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const branches: RenderBranch[] = []
  const tracked = new Map<ts.Node, RenderBranch>()
  const counts = new Map<string, number>()
  const sourceHash = hash(source)
  const printer = ts.createPrinter({ removeComments: true })
  function add(node: ts.Node, expression: ts.Node, owner: string, kind: RenderBranch['kind'], outcomes = ['false', 'true']) {
    const text = printer.printNode(ts.EmitHint.Unspecified, expression, sf).replace(/\s+/g, ' ').trim()
    const key = `${file}#${owner}:${kind}:${text}`
    const occurrence = counts.get(key) ?? 0
    counts.set(key, occurrence + 1)
    const branch: RenderBranch = { id: `branch:${hash(`${key}:${occurrence}`).slice(0, 24)}`, file, owner, kind, expression: text, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, outcomes, sourceHash, start: node.getStart(sf) }
    branches.push(branch)
    tracked.set(node, branch)
  }
  function visit(node: ts.Node, owner = 'module', rendering = false) {
    if (ts.isFunctionLike(node)) {
      owner = `${owner}.${functionName(node)}`
      rendering = hasOwnJsx(node)
    }
    if (rendering) {
      if (ts.isIfStatement(node)) add(node.expression, node.expression, owner, 'if')
      else if (ts.isConditionalExpression(node)) add(node.condition, node.condition, owner, 'conditional')
      else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
        // ?? records nullishness instead of truthiness; the original value is returned unchanged.
        add(node.left, node.left, owner, 'logical', node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ? ['nullish', 'present'] : ['false', 'true'])
      } else if (ts.isJsxAttribute(node) && /^(disabled|hidden|checked|selected|readOnly|required|multiple|open)$/.test(node.name.getText(sf)) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const expression = node.initializer.expression
        if (expression.kind !== ts.SyntaxKind.TrueKeyword && expression.kind !== ts.SyntaxKind.FalseKeyword) add(expression, expression, owner, 'attribute')
      } else if (ts.isCaseClause(node)) add(node, node.expression, owner, 'case', ['entered'])
      else if (ts.isDefaultClause(node)) add(node, node, owner, 'case', ['entered'])
    }
    ts.forEachChild(node, child => visit(child, owner, rendering))
  }
  visit(sf)
  return { sf, branches, tracked }
}

/** Instrument preview-only modules; no edits to application source and no dependency on Jest. */
export function instrumentRenderBranches(source: string, file: string): { code: string; map?: string; branches: RenderBranch[] } {
  const inventory = prepare(source, file)
  const byPosition = new Map([...inventory.tracked].map(([node, branch]) => [`${node.getStart(inventory.sf)}:${node.end}:${node.kind}`, branch]))
  const identifiers = new Set<string>()
  const collect = (node: ts.Node) => { if (ts.isIdentifier(node)) identifiers.add(node.text); ts.forEachChild(node, collect) }
  collect(inventory.sf)
  let helper = '__atelierBranch'
  while (identifiers.has(helper)) helper += '_'
  // transpileModule parses a new tree; stable source offsets join it to the inventory.
  const transformer: ts.TransformerFactory<ts.SourceFile> = context => sf => {
    const factory = context.factory
    const hit = (branch: RenderBranch, expression: ts.Expression) => factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(helper), 'hit'), undefined,
      [factory.createStringLiteral(branch.id), expression, factory.createStringLiteral(branch.outcomes[0] === 'nullish' ? 'nullish' : branch.kind === 'case' ? 'case' : 'boolean')],
    )
    const visit: ts.Visitor = node => {
      const branch = byPosition.get(`${node.getStart(sf)}:${node.end}:${node.kind}`)
      const updated = ts.visitEachChild(node, visit, context)
      if (!branch) return updated
      if (ts.isCaseClause(updated)) return factory.updateCaseClause(updated, updated.expression, [factory.createExpressionStatement(hit(branch, factory.createTrue())), ...updated.statements])
      if (ts.isDefaultClause(updated)) return factory.updateDefaultClause(updated, [factory.createExpressionStatement(hit(branch, factory.createTrue())), ...updated.statements])
      return hit(branch, updated as ts.Expression)
    }
    return ts.visitNode(sf, visit) as ts.SourceFile
  }
  const result = ts.transpileModule(source, { fileName: file, compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, sourceMap: true }, transformers: { before: [transformer] } })
  // Capture remains opt-in at runtime; ordinary preview renders have no active recorder.
  const preamble = `const ${helper} = { hit(id, value, kind) { const recorder = globalThis.__ATELIER_BRANCH_COVERAGE__; if (recorder) recorder.hit(id, value, kind); return value; } };\n`
  return { code: preamble + result.outputText, branches: inventory.branches }
}
