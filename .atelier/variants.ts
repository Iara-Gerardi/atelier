export interface VariantValue<T extends string = string> {
  value: T
  label: string
  description: string
}

export interface VariantAxis<T extends string = string> {
  label: string
  description: string
  values: readonly VariantValue<T>[]
  default: T
}

/**
 * The single source of truth for cross-cutting global axes the whole app
 * reacts to. Anything that's really "this page is in state X" belongs on a
 * frame's `states`, not here.
 *
 * Adding an axis here automatically:
 *   - appears in the VariantBar dropdown (when at least one visible frame
 *     opts into it via `meta.variants`),
 *   - is enumerable by the scene-coverage skill,
 *   - gets a typed value union via the derived `VariantValues` map below.
 */
export const variantAxes = {
  auth: {
    label: 'Auth',
    description:
      'User role and authentication status. Gates which routes render and which UI actions appear.',
    values: [
      {
        value: 'guest',
        label: 'Guest',
        description:
          'Not signed in. Most authenticated routes 404 or redirect to login.',
      },
      {
        value: 'student',
        label: 'Student',
        description:
          'Signed-in student. Cannot access teacher/admin tools — those routes 404.',
      },
      {
        value: 'professor',
        label: 'Professor',
        description:
          'Signed-in professor. Can manage student records and view class data.',
      },
      {
        value: 'admin',
        label: 'Admin',
        description: 'Full access to every route and action.',
      },
    ],
    default: 'guest',
  },
} as const satisfies Record<string, VariantAxis>

export type VariantAxes = typeof variantAxes
export type VariantKey = keyof VariantAxes
export type VariantValues = {
  [K in VariantKey]: VariantAxes[K]['values'][number]['value']
}
export type PartialVariants = Partial<VariantValues>

export const defaultVariants: VariantValues = Object.fromEntries(
  (Object.keys(variantAxes) as VariantKey[]).map((key) => [key, variantAxes[key].default]),
) as VariantValues

/**
 * Lookup helper: returns the rich metadata for a single value of an axis, or
 * `undefined` if the value isn't in the axis's enum. Used by VariantBar and
 * by the scene-coverage skill to render or document a chosen variant value.
 */
export function describeValue<K extends VariantKey>(
  axis: K,
  value: VariantValues[K],
): VariantValue | undefined {
  return (variantAxes[axis].values as readonly VariantValue[]).find((v) => v.value === value)
}
