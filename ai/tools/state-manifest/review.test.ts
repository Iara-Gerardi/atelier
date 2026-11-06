import { describe, expect, it } from 'vitest'
import { buildJevQuestions } from './review'

describe('buildJevQuestions', () => {
  it('builds one atomic boolean decision per candidate', () => {
    const questions = buildJevQuestions([
      {
        id: 'loading',
        axis: 'status',
        value: 'loading',
        evidence: [
          {
            kind: 'branch-comparison',
            line: 8,
            expression: "status === 'loading'",
          },
        ],
      },
      {
        id: 'error',
        axis: 'status',
        value: 'error',
        evidence: [
          {
            kind: 'branch-comparison',
            line: 9,
            expression: "status === 'error'",
          },
        ],
      },
    ])

    expect(Object.keys(questions)).toEqual(['candidate_0', 'candidate_1'])
    expect(questions.candidate_0).toMatchObject({
      type: 'noul',
      instructions: expect.stringContaining('"loading"'),
    })
  })
})
