import path from 'node:path'
import { loadEnvConfig } from '@next/env'
import type { StateCandidate } from './extract'

export const DEFAULT_JEV_MODEL = 'jev-latest'
const TYPESAFE_SYSTEM_ONE_URL = 'https://api.typesafe.ai/v1/systemone'

export interface StateReview {
  id: string
  probability: number
}

export function buildJevQuestions(candidates: StateCandidate[]) {
  return Object.fromEntries(
    candidates.map((candidate, index) => [
      `candidate_${index}`,
      {
        type: 'noul' as const,
        instructions: `Is candidate "${candidate.id}" a real, independently observable render state of this React component?`,
      },
    ])
  )
}

export async function reviewStateCandidatesWithJev(params: {
  componentSource: string
  componentName: string
  candidates: StateCandidate[]
  model?: string
  rootDir?: string
}): Promise<StateReview[]> {
  const rootDir = path.resolve(params.rootDir ?? process.cwd())
  loadEnvConfig(rootDir)

  const apiKey = process.env.TYPESAFE_API_KEY ?? process.env.JEV_API
  if (!apiKey) {
    throw new Error(
      'Jev validation requires TYPESAFE_API_KEY or JEV_API. Set your TypeSafe AI key in .env.local, or pass --no-review.'
    )
  }

  const questions = buildJevQuestions(params.candidates)
  const response = await fetch(TYPESAFE_SYSTEM_ONE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model ?? DEFAULT_JEV_MODEL,
      state: {
        definition:
          'A component state is a reachable condition that produces a distinct user-visible render or interaction affordance.',
        component: params.componentName,
        source: params.componentSource,
        candidates: params.candidates.map((candidate) => ({
          id: candidate.id,
          axis: candidate.axis,
          value: candidate.value,
        })),
      },
      questions,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `TypeSafe AI Jev validation failed (${response.status}): ${detail || response.statusText}`
    )
  }

  const result = (await response.json()) as {
    answers?: Record<string, { noul?: unknown }>
  }
  if (!result.answers) {
    throw new Error('TypeSafe AI Jev validation response did not include answers.')
  }

  return params.candidates.map((candidate, index) => {
    const answer = result.answers[`candidate_${index}`]
    if (typeof answer?.noul !== 'number' || answer.noul < 0 || answer.noul > 1) {
      throw new Error(`Jev returned an invalid Noul answer for candidate "${candidate.id}".`)
    }
    return { id: candidate.id, probability: answer.noul }
  })
}
