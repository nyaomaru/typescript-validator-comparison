# Runtime validator comparison: measured results

Measured: 2026-10-23T16:17:32.639Z. These are observations for the pinned implementations, not a universal ranking.

is-kit uses the published npm release 1.15.3. is-kit runtime measured: 2026-10-23T16:17:16.365Z.

## Reproduce

```sh
cd typescript-validator-comparison
corepack pnpm install --frozen-lockfile
corepack pnpm verify
```

Or run each stage: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm bundle`, `pnpm benchmark`, `pnpm probes`, `pnpm report`.

Use Node v24.22.1 and pnpm@11.22.0. This is a one-package pnpm workspace isolated from the article repository. Do not re-resolve latest versions when reproducing this snapshot. On a cold cache typia's Go source plugin can take several minutes to build and may require network access. ttsc compiled the Go source plugin successfully; a standalone go command was not available in the shell. All compiles use official TypeScript 7 `ttsc` integration and typia's auto-discovered transform; there is no ts-patch configuration.

The workspace explicitly sets `minimumReleaseAge: 0` for the original latest-stable experiment, including ttsc published on the measurement day. It permits only esbuild's install script via `allowBuilds`. Transitive versions and integrity hashes are recorded in pnpm-lock.yaml.

## Environment and exact direct versions

- Node: v24.22.1; V8: 13.6.233.17-node.58
- OS: linux x64; kernel: 6.6.87.2-microsoft-standard-WSL2
- CPU: AMD Ryzen 9 7900 12-Core Processor
- zlib: 1.3.2.1-motley-285e94b; Brotli: 1.2.0

| Package | Resolved exact version |
| --- | --- |
| arktype | 2.2.8 |
| is-kit | 1.15.3 |
| runtypes | 7.0.5 |
| typia | 15.1.0 |
| valibot | 1.5.0 |
| zod | 4.6.5 |
| @biomejs/biome | 2.5.15 |
| @types/node | 26.6.5 |
| esbuild | 0.28.2 |
| ttsc | 0.31.3 |
| typescript | 7.0.2 |

## Contract and checks

The comparison covers ordinary JSON-decoded data: string-keyed enumerable objects and dense arrays. Name length is **1..100 UTF-16 code units** using JavaScript string.length. There is no coercion. Integers 18..120 are required for age. Root and profile extras are rejected. Other rules are in src/user.ts and src/fixtures.ts.

- 35 shared JSON fixtures × 7 validators = 245 boolean assertions, with expected outcomes, including boundary values, Unicode, wrong fields, missing fields, and root/nested extra keys.
- Input mutation is checked after every common guard call.
- Six richer result APIs are checked against every shared fixture; valid outputs are compared by value (identity is not required).
- Eleven Node test groups pass; browser ESM bundles also pass all 245 shared checks when imported in Node. A real browser was not executed.
- Strict typecheck passes with noUncheckedIndexedAccess, exactOptionalPropertyTypes, noEmitOnError, explicit node types, and skipLibCheck=false.
- Narrowing checks cover native, is-kit, Runtypes, Valibot, Zod, ArkType, and typia. is-kit infers readonly arrays, so its output matches ReadonlyUser rather than mutable User.tags. No cast conceals this difference.
- The Zod adapter is a type predicate because this schema has no transforms. For a transforming schema, `safeParse().data` is the safe typed value because the original input can differ from the output.
- Biome recommended lint rules pass; ttsc builds all validator, entry, and test files.

This matrix is evidence, not a proof for every possible input. A manually declared predicate can lie to TypeScript; compilation alone does not verify its body.

## Changes from the supplied draft

1. **Unicode length is not equivalent out of the box.** Zod 4.6.5 min/max and typia 15.1.0 MinLength/MaxLength accept 51 emoji (51 code points, 102 UTF-16 units). Regression tests preserve that observation. Zod now uses refine(value => value.length >= 1 && value.length <= 100); typia uses a custom tags.TagBase with the same expression. Other samples keep their original string-length checks. This custom tag does not provide the built-in MinLength/MaxLength JSON Schema metadata.
2. **Runtypes shadows global constructors.** Imports are aliased (Number as RtNumber, etc.) so the constraint calls native Number.isInteger. The unaliased draft's Number import would hide that function.
3. **typia setup changed.** Latest typia 15.1.0, TypeScript 7.0.2, and ttsc 0.31.3 use the current official native transform. Stock tsc does not perform the transform. TypeScript 7 requires explicit node types for this project.
4. **is-kit is readonly at the type level.** The original mutable User type is not exactly its inferred type. Runtime acceptance and input mutability are separate questions.
5. **Zod narrowing.** Zod has no built-in `is()` method, but a `safeParse(...).success` adapter can be a sound type predicate when the schema has no transforms. Transforming schemas must use `safeParse().data` instead.
6. **AOT is not a capability ladder.** Code generation is a build/runtime choice, orthogonal to rich errors and integrations. ArkType can JIT compile traversal at runtime.
7. **No broadest/largest ecosystem claim.** Integration breadth is illustrated by the official Zod ecosystem directory, without an unmeasured superlative.

## Browser bundle size

| Validator | Raw bytes | gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: |
| native | 588 | 337 | 295 |
| is-kit | 3421 | 1530 | 1423 |
| runtypes | 16667 | 5188 | 4657 |
| valibot | 5722 | 1853 | 1675 |
| zod | 89888 | 26212 | 23331 |
| arktype | 155549 | 47603 | 41956 |
| typia | 772 | 403 | 339 |

Each src/entries file exposes only validate. esbuild 0.28.2 bundles the emitted JavaScript with platform=browser, format=esm, target=es2022, minify=true, treeShaking=true, legalComments=none. Each emitted file is compressed independently: gzip level 9, Brotli quality 11 using Node zlib. Units are bytes, not rounded KB. Test and benchmark frameworks are absent. These are standalone costs; marginal costs in an app that already imports a package differ. Schema initialization is included, but no construction time is measured here. Zod Mini is **not measured**.

**typia detail:** its separate browser entry creates only createEquals<User>(). Importing the richer module directly originally retained unused createValidateEquals initialization and yielded 5,722 raw bytes. That is excluded from the guard-only table. The final emitted typia entry imports typia and _isTypeUint32; esbuild retains the uint32 helper and drops unused exports. Final ESM has no external imports and measures 772 raw bytes. Generated validation has a runtime helper cost; there is no general schema interpreter in the guard. Inspect bundles/typia.meta.json for bytesInOutput, rather than treating every visited input module as retained code.

## Steady-state validation

| Validator | Valid ns/call | Wrong id ns/call | Wrong profile.active ns/call |
| --- | ---: | ---: | ---: |
| native | 79.9 (77.3–114.1) | 73.6 (72.1–84.9) | 80.8 (79.0–96.3) |
| is-kit | 232.0 (225.7–257.5) | 34.5 (33.1–38.9) | 210.3 (203.6–218.1) |
| runtypes | 5804.0 (5425.5–6298.0) | 9221.8 (8443.2–11063.2) | 10101.2 (9287.6–10503.5) |
| valibot | 951.2 (425.2–1782.7) | 200.2 (96.1–422.3) | 1112.1 (648.4–1538.1) |
| zod | 612.6 (351.3–1203.5) | 1491.6 (862.9–2824.6) | 2208.5 (1592.4–4757.4) |
| arktype | 291.5 (278.1–614.4) | 9.6 (6.6–17.7) | 12.0 (11.3–37.6) |
| typia | 21.9 (20.5–46.1) | 2.0 (1.9–6.4) | 11.5 (10.8–17.2) |

Values are **median (minimum–maximum)** across nine samples, in nanoseconds per call. Each sample makes 50,000 calls per case; each case warms up for 20,000 calls. A fresh sequential Node process is used for each library. Schemas and generated guards are constructed outside the timed loop. Case order rotates between samples. Each case repeatedly validates the same object; successful results feed an asserted numeric sink.

The exact APIs are native/is-kit predicates, Runtypes.guard, Valibot.is, Zod.safeParse(...).success, ArkType.allows, and typia.createEquals. Returning the same boolean does **not** mean doing the same work: some paths construct outputs/issues, some stop early, some validate more fields. In particular Zod safeParse creates output and Runtypes.guard wraps an inspect operation. This comparison does not measure the richer APIs or claim equal diagnostics cost.

The wrong-id case still supplies an object with the complete root shape. It is not a null/primitive early bailout. The deep case changes only profile.active to a string.

Limits: one small schema, three fixed objects, one engine/machine, shared workstation/WSL2, ordinary JIT and GC noise, no throughput for varied real payloads. Nanosecond-scale values are particularly sensitive to JIT optimization. Schema creation, import/startup cost, build cost, application latency, CSP behavior, cold validation, and error reporting UI are not benchmarked. Minimum/maximum are observed spread, not confidence intervals. Change the inputs and repeat before using these numbers for an application decision.

## JavaScript-only probes: equivalence stops here

| JavaScript probe | native | is-kit | runtypes | valibot | zod | arktype | typia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sparse tags | true | false | true | false | false | false | true |
| inherited fields | false | false | false | true | true | true | true |
| extra symbol | true | true | false | true | true | false | true |
| extra nonenumerable | true | true | true | true | true | true | true |
| own nonenumerable id | false | true | false | true | true | true | true |
| extra undefined | false | false | false | false | false | false | true |
| nonJSON age NaN | false | false | false | false | false | false | false |
| nonJSON age Infinity | false | false | false | false | false | false | false |
| nonJSON age -Infinity | false | false | false | false | false | false | false |
| nonJSON age undefined | false | false | false | false | false | false | false |
| undefined root | false | false | false | false | false | false | false |
| undefined tag | false | false | false | false | false | false | false |
| throwing getter | throws | throws | throws | throws | throws | throws | throws |

These probes are deliberately outside the JSON contract and are recorded rather than normalized away. Sparse arrays, inherited fields, symbols, descriptors, undefined-valued extras, and accessors are not ordinary JSON values. Some guards read getters and can throw. “unknown keys” means different things across libraries outside plain JSON; all validators ignore the added non-enumerable extra in this probe. typia equals also accepts an extra enumerable key with value undefined. A strict boundary for arbitrary JavaScript values needs an explicit policy and additional tests, rather than a claim of universal equivalence.

## Official references checked

- [TypeScript narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [is-kit source and exact-mode contract](https://github.com/nyaomaru/is-kit)
- [Runtypes APIs and structured failures](https://github.com/runtypes/runtypes)
- [Valibot modular design](https://valibot.dev/guides/introduction/) and [strictObject](https://valibot.dev/api/strictObject/)
- [Zod string-length unit and strictObject](https://zod.dev/api), [ecosystem](https://zod.dev/ecosystem), [Mini](https://zod.dev/packages/mini)
- [ArkType objects](https://arktype.io/docs/objects); installed onDeepUndeclaredKey declarations were compiled and exercised
- [typia current setup](https://typia.io/docs/setup/), [generated guards/custom tags](https://typia.io/docs/validators/is/)

Pinned package sources were also inspected, notably typia's _stringLengthGte and Zod's codePointLength checks. Documentation can advance independently of installed releases; the lockfile and executed source define this snapshot.
