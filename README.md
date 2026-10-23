# Runtime validator comparison

Reproducible companion to [“There Is No Best TypeScript Runtime Validator”](https://github.com/nyaomaru/contents/blob/update/typescript-runtime-validation/2026/global-article/typescript-runtime-validation-comparison.md). See [RESULTS.md](RESULTS.md) for the recorded results, environment, scope, and limitations.

```sh
cd typescript-validator-comparison
corepack pnpm install --frozen-lockfile
corepack pnpm verify
```

Use the Node and pnpm versions recorded in [RESULTS.md](RESULTS.md). typia's current TypeScript 7/ttsc transform may compile a Go source plugin on its first run; allow several minutes and network access on a cold cache.

- `src/validators`: seven implementations with boolean entry points and richer APIs.
- `src/entries`: browser entries exporting only `validate`, with a separate typia guard-only factory.
- `src/fixtures.ts`: 35 JSON contract fixtures and 13 JavaScript-only probes.
- `tests`: runtime agreement, unchanged values, structured failure checks, Unicode regression, and compile-time narrowing.
- `scripts`: esbuild bundles, independent-process benchmarks, probes, and report generation.
- `bundle-results.json`, `benchmark-results.json`, `probe-results.json`: saved evidence.
- `dist` and `bundles`: regenerated locally and excluded from git; bundle metafiles show retained byte contributions.

The contract defines name length as UTF-16 code units. Zod and typia have explicit adaptations because their standard length checks count code points in these versions. Equivalence is tested for JSON-decoded data, not every possible JavaScript object.

`pnpm verify` runs lint, strict typecheck, build, tests, bundle checks, measurements, probes, and report generation. To review an existing snapshot without rerunning timing, use `pnpm report` after building. Results vary with the machine and workload; update the article tables only from the committed `RESULTS.md` snapshot.

To start a new latest-version experiment rather than reproduce this one, run `pnpm update --latest --save-exact`, then `pnpm verify`; review semantic changes before updating the article.
