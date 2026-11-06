import { describe, expect, it } from 'vitest'
import { extractStateCandidates } from './extract'

describe('extractStateCandidates', () => {
  it('extracts and deduplicates prop union values and branch comparisons', () => {
    const source = `
      interface Props {
        tone: 'success' | 'error' | 'pending'
      }
      export function StatusCard({ tone }: Props) {
        const icon = tone === 'success' ? '✓' : tone === 'error' ? '!' : '…'
        return <div>{icon}</div>
      }
    `

    const states = extractStateCandidates(source, 'StatusCard.tsx')

    expect(states.map((state) => state.id)).toEqual(['success', 'error', 'pending'])
    expect(states.find((state) => state.id === 'success')?.evidence).toHaveLength(2)
  })

  it('extracts useState unions and lets Jev reject derived aliases', () => {
    const source = `
      function Form() {
        const [status] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle')
        const isLoading = status === 'submitting'
        return <button>{isLoading ? <Spinner /> : 'Submit'}</button>
      }
    `

    const states = extractStateCandidates(source, 'Form.tsx')

    expect(states.map((state) => state.id)).toEqual([
      'idle',
      'submitting',
      'error',
      'success',
      'loading',
    ])
  })

  it('adds a default state for boolean-only JSX branches', () => {
    const source = `
      export function Notice({ error, loading }) {
        if (error) return <p>Error</p>
        return <div>{loading ? <Spinner /> : <Content />}</div>
      }
    `

    const states = extractStateCandidates(source, 'Notice.jsx')

    expect(states.map((state) => state.id)).toEqual(['error', 'loading', 'default'])
  })

  it('extracts PropTypes.oneOf values from JavaScript components', () => {
    const source = `
      export function Banner({ status }) {
        return <div className={status}>{status}</div>
      }
      Banner.propTypes = {
        status: PropTypes.oneOf(['info', 'warning', 'critical'])
      }
    `

    const states = extractStateCandidates(source, 'Banner.jsx')

    expect(states.map((state) => state.id)).toEqual(['info', 'warning', 'critical'])
  })

  it('returns only a default state when the render has no branches', () => {
    const states = extractStateCandidates(
      `export const Label = ({ children }) => <span>{children}</span>`,
      'Label.jsx'
    )

    expect(states).toMatchObject([
      {
        id: 'default',
        axis: 'render',
        value: 'default',
        evidence: [{ kind: 'fallback-render' }],
      },
    ])
  })
})
