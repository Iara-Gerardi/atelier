import ts from 'typescript'

export type StateEvidenceKind =
  | 'prop-union'
  | 'react-state-union'
  | 'branch-comparison'
  | 'switch-case'
  | 'boolean-render-guard'
  | 'fallback-render'

export interface StateEvidence {
  kind: StateEvidenceKind
  line: number
  expression: string
}

export interface StateCandidate {
  id: string
  axis: string
  value: string | boolean
  evidence: StateEvidence[]
}

interface MutableCandidate {
  axis: string
  value: string | boolean
  evidence: StateEvidence[]
}

const VISUAL_BOOLEAN_NAME =
  /^(?:is|has|show|can)?(?:loading|loaded|pending|error|empty|disabled|success|open|closed|active|selected|expanded|collapsed|checked|visible|hidden|invalid)$/i

function scriptKindFor(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (fileName.endsWith('.js')) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
}

function compactExpression(sourceFile: ts.SourceFile, node: ts.Node): string {
  return node.getText(sourceFile).replace(/\s+/g, ' ').trim().slice(0, 240)
}

function stringLiterals(type: ts.TypeNode): string[] {
  const nodes = ts.isUnionTypeNode(type) ? type.types : [type]
  return nodes.flatMap((node) =>
    ts.isLiteralTypeNode(node) && ts.isStringLiteralLike(node.literal)
      ? [node.literal.text]
      : []
  )
}

function expressionAxis(node: ts.Expression): string | null {
  if (ts.isIdentifier(node)) return node.text
  if (ts.isPropertyAccessExpression(node)) return node.name.text
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression &&
    ts.isStringLiteralLike(node.argumentExpression)
  ) {
    return node.argumentExpression.text
  }
  return null
}

function booleanAxis(node: ts.Expression): string | null {
  const expression =
    ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken
      ? node.operand
      : node
  const axis = expressionAxis(expression)
  return axis && VISUAL_BOOLEAN_NAME.test(axis) ? axis : null
}

function booleanStateId(axis: string): string {
  return axis
    .replace(/^(?:is|has|show|can)(?=[A-Z_])/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

function stateId(value: string | boolean): string {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function hasJsx(node: ts.Node): boolean {
  if (
    ts.isJsxElement(node) ||
    ts.isJsxSelfClosingElement(node) ||
    ts.isJsxFragment(node)
  ) {
    return true
  }
  return node.getChildren().some(hasJsx)
}

function nearestSwitch(node: ts.Node): ts.SwitchStatement | null {
  let current: ts.Node | undefined = node.parent
  while (current) {
    if (ts.isSwitchStatement(current)) return current
    current = current.parent
  }
  return null
}

function firstBindingName(node: ts.VariableDeclaration): string | null {
  if (!ts.isArrayBindingPattern(node.name)) return null
  const first = node.name.elements[0]
  return first && ts.isBindingElement(first) && ts.isIdentifier(first.name)
    ? first.name.text
    : null
}

function findFirstReturn(node: ts.Node): ts.ReturnStatement | null {
  if (ts.isReturnStatement(node)) return node
  for (const child of node.getChildren()) {
    const match = findFirstReturn(child)
    if (match) return match
  }
  return null
}

export function extractStateCandidates(componentSource: string, fileName: string): StateCandidate[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    componentSource,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName)
  )
  const candidates = new Map<string, MutableCandidate>()

  function add(
    axis: string,
    value: string | boolean,
    kind: StateEvidenceKind,
    node: ts.Node
  ): void {
    const key = `${axis}\u0000${String(value)}`
    const evidence: StateEvidence = {
      kind,
      line: lineOf(sourceFile, node),
      expression: compactExpression(sourceFile, node),
    }
    const existing = candidates.get(key)
    if (existing) {
      if (
        !existing.evidence.some(
          (item) =>
            item.kind === evidence.kind &&
            item.line === evidence.line &&
            item.expression === evidence.expression
        )
      ) {
        existing.evidence.push(evidence)
      }
      return
    }
    candidates.set(key, { axis, value, evidence: [evidence] })
  }

  function visit(node: ts.Node): void {
    if (
      ts.isPropertySignature(node) &&
      node.type &&
      (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name))
    ) {
      const axis = node.name.text
      for (const value of stringLiterals(node.type)) {
        add(axis, value, 'prop-union', node)
      }
    }

    if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name)) &&
      ts.isCallExpression(node.initializer) &&
      ts.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.name.text === 'oneOf'
    ) {
      const values = node.initializer.arguments[0]
      if (values && ts.isArrayLiteralExpression(values)) {
        for (const element of values.elements) {
          if (ts.isStringLiteralLike(element)) {
            add(node.name.text, element.text, 'prop-union', node)
          }
        }
      }
    }

    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === 'useState'
    ) {
      const axis = firstBindingName(node)
      const stateType = node.initializer.typeArguments?.[0]
      if (axis && stateType) {
        for (const value of stringLiterals(stateType)) {
          add(axis, value, 'react-state-union', node)
        }
      }
    }

    if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.EqualsEqualsToken,
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsToken,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ].includes(node.operatorToken.kind)
    ) {
      const leftLiteral = ts.isStringLiteralLike(node.left) ? node.left.text : null
      const rightLiteral = ts.isStringLiteralLike(node.right) ? node.right.text : null
      const axis = leftLiteral
        ? expressionAxis(node.right)
        : rightLiteral
          ? expressionAxis(node.left)
          : null
      const value = leftLiteral ?? rightLiteral
      if (axis && value !== null) add(axis, value, 'branch-comparison', node)
    }

    if (ts.isCaseClause(node) && ts.isStringLiteralLike(node.expression)) {
      const switchStatement = nearestSwitch(node)
      const axis = switchStatement ? expressionAxis(switchStatement.expression) : null
      if (axis) add(axis, node.expression.text, 'switch-case', node)
    }

    let guard: ts.Expression | null = null
    if (ts.isIfStatement(node) && hasJsx(node.thenStatement)) {
      guard = node.expression
    } else if (ts.isConditionalExpression(node) && (hasJsx(node.whenTrue) || hasJsx(node.whenFalse))) {
      guard = node.condition
    } else if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      hasJsx(node.right)
    ) {
      guard = node.left
    }
    if (guard) {
      const axis = booleanAxis(guard)
      if (axis) add(axis, true, 'boolean-render-guard', guard)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  const extracted = [...candidates.values()]
  const hasNonBooleanCandidate = extracted.some((candidate) => typeof candidate.value === 'string')
  if (extracted.length === 0 || !hasNonBooleanCandidate) {
    const firstReturn = findFirstReturn(sourceFile) ?? sourceFile
    add('render', 'default', 'fallback-render', firstReturn)
  }

  const mutable = [...candidates.values()]
  const baseIds = mutable.map((candidate) =>
    typeof candidate.value === 'boolean'
      ? booleanStateId(candidate.axis)
      : stateId(candidate.value)
  )
  const counts = new Map<string, number>()
  for (const id of baseIds) counts.set(id, (counts.get(id) ?? 0) + 1)

  const usedIds = new Map<string, number>()
  return mutable
    .map((candidate, index) => {
      const baseId = baseIds[index] || stateId(candidate.axis) || `state-${index + 1}`
      const qualifiedId =
        (counts.get(baseId) ?? 0) > 1
          ? `${stateId(candidate.axis)}-${baseId}`
          : baseId
      const seen = usedIds.get(qualifiedId) ?? 0
      usedIds.set(qualifiedId, seen + 1)
      const id = seen === 0 ? qualifiedId : `${qualifiedId}-${seen + 1}`
      return {
        id,
        axis: candidate.axis,
        value: candidate.value,
        evidence: candidate.evidence.sort((a, b) => a.line - b.line),
      }
    })
    .sort((a, b) => {
      const aFallback = a.evidence[0].kind === 'fallback-render'
      const bFallback = b.evidence[0].kind === 'fallback-render'
      if (aFallback !== bFallback) return aFallback ? 1 : -1
      return a.evidence[0].line - b.evidence[0].line
    })
}
