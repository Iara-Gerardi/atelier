/**
 * Atelier shim for `next/headers`.
 *
 * These APIs are server-only (cookies, headers, draft mode) and have no
 * meaning in the client-side preview. They throw a guiding error rather than
 * silently returning empty data: a component reaching them should have its
 * server dependency mocked instead of being rendered directly.
 */
const GUIDANCE =
  '[atelier] next/headers is server-only and unavailable in the preview. ' +
  'Mock the server action/data source this component depends on, or render a ' +
  'client child that receives the resolved value as props.'

export function cookies(): never {
  throw new Error(`${GUIDANCE} (cookies())`)
}

export function headers(): never {
  throw new Error(`${GUIDANCE} (headers())`)
}

export function draftMode(): never {
  throw new Error(`${GUIDANCE} (draftMode())`)
}
