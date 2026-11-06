# Component state manifests

`generate_states` is the low-cost state-discovery workflow. It does not use a
generative language model.

## How it works

1. The TypeScript compiler parses a `.jsx` or `.tsx` component.
2. A deterministic AST pass extracts candidates from string-union props,
   `useState` unions, `PropTypes.oneOf`, equality branches, switch cases, and
   boolean JSX guards.
3. One TypeSafe AI System One request sends the source and all candidates to
   `jev-latest`.
4. Jev answers one boolean question per candidate. The YAML records each
   `validityProbability` and whether it meets the threshold.

Jev validates candidates; it does not generate names or source evidence. All
candidates remain in the manifest so consumers can inspect rejected states.

## CLI

```bash
npm run gen-states -- --src components/ExampleForm.tsx
```

Set `TYPESAFE_API_KEY` in `.env.local` before running the review. `JEV_API`
is also accepted for existing setups.

The default output is `.atelier/states/<Component>.states.yaml`. Useful flags:

- `--preview` prints YAML without writing.
- `--threshold 0.8` changes the `valid` cutoff.
- `--no-review` runs the free AST-only stage and emits `null` validity fields.
- `--output .atelier/states/custom.states.yaml` changes the output path.

The MCP server exposes the same workflow as `generate_states` with
`preview`/`write` modes.

## Limits

The extractor deliberately avoids guessing. States hidden entirely inside an
imported hook, server action, or child component are not candidates unless this
component branches on their values. Jev can reject an extracted candidate, but
it cannot recover a state the AST pass did not find.
