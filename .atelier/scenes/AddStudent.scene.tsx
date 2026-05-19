import type { SceneDef, SceneMeta } from '@/.atelier/registry/types'

export const meta: SceneMeta = {
  name: 'AddStudent',
  category: 'Flows',
  tags: ['admin', 'demo'],
}

/**
 * Demo flow exercising every v3 concept against existing frames:
 *   - gate + fallback: the `form` node renders only when the user is a
 *     professor or admin; anyone else is rerouted to the `notFound` node.
 *   - outcomes (frame transitions only): the form's submit button (the mocked
 *     @/components/ui/Button) becomes a split dropdown labelled
 *     "Go to success" / "Go to error". Both transition to the
 *     AddStudentStatus frame at the chosen state.
 *   - StateBar vs. dropdown: AddStudentStatus has a third `pending_review`
 *     state that is NOT a declared outcome of `form` — it never shows in the
 *     dropdown, but you can still preview it via the StateBar after landing
 *     on the status frame.
 *   - Intra-frame state previews: the form's `loading` / `error` / `success`
 *     states (separate from the status frame's states) are controlled by the
 *     StateBar at the top of the canvas, not by outcomes.
 */
const scene: SceneDef = {
  initial: 'form',
  nodes: {
    form: {
      frame: 'ExampleForm',
      state: 'idle',
      gate: ({ variants }) =>
        variants.auth === 'professor' || variants.auth === 'admin',
      fallback: 'notFound',
      outcomes: [
        {
          id: 'success',
          frame: 'AddStudentStatus',
          state: 'success',
          description:
            'Submission accepted; student record created and the success card is shown.',
          default: true,
        },
        {
          id: 'error',
          frame: 'AddStudentStatus',
          state: 'error',
          description:
            'Server rejected the submission (e.g. email already registered) and surfaces the error card.',
        },
      ],
    },
    notFound: {
      frame: 'NotFound',
      state: 'default',
    },
  },
}

export default scene
