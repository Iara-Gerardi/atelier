export function makeVariantGeneric(variants: string[]): string {
  if (variants.length === 0) return ''
  const union = variants.map((value) => `'${value}'`).join(' | ')
  return `<${union}>`
}

export function unwrapFence(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:tsx|ts|jsx|js)?\s*([\s\S]*?)\s*```$/)
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
