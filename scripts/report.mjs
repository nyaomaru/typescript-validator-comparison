import { readFile, writeFile } from "node:fs/promises";
import { fixtures } from "../dist/src/fixtures.js";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const bundle = JSON.parse(await readFile("bundle-results.json", "utf8"));
const bench = JSON.parse(await readFile("benchmark-results.json", "utf8"));
const probes = JSON.parse(await readFile("probe-results.json", "utf8"));
const kitPackage = JSON.parse(
	await readFile("node_modules/is-kit/package.json", "utf8"),
);
const kitMeasurement = bench.results.find((result) => result.name === "is-kit");
const snapshotNote = `is-kit uses the published npm release ${kitPackage.version}. ${bench.results.some((result) => !result.measuredAt) ? "Only is-kit's runtime and bundle measurements were refreshed; other libraries retain the original snapshot. " : ""}is-kit runtime measured: ${kitMeasurement.measuredAt ?? bench.measuredAt}.`;
const versions = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
	.map(([name, pinned]) => {
		// package.json is not exported by every library; the exact lockfile pins remain authoritative.
		return `| ${name} | ${name === "is-kit" ? kitPackage.version : pinned} |`;
	})
	.join("\n");
const sizeTable = [
	"| Validator | Raw bytes | gzip bytes | Brotli bytes |",
	"| --- | ---: | ---: | ---: |",
	...bundle.sizes.map(
		(s) => `| ${s.name} | ${s.raw} | ${s.gzip} | ${s.brotli} |`,
	),
].join("\n");
const fmt = (c) =>
	`${c.medianNs.toFixed(1)} (${c.minNs.toFixed(1)}–${c.maxNs.toFixed(1)})`;
const runtimeTable = [
	"| Validator | Valid ns/call | Wrong id ns/call | Wrong profile.active ns/call |",
	"| --- | ---: | ---: | ---: |",
	...bench.results.map(
		(r) => `| ${r.name} | ${r.cases.map(fmt).join(" | ")} |`,
	),
].join("\n");
const names = Object.keys(probes[0].results);
const probeTable = [
	`| JavaScript probe | ${names.join(" | ")} |`,
	`| --- | ${names.map(() => "---").join(" | ")} |`,
	...probes.map(
		(p) =>
			`| ${p.name} | ${names.map((n) => String(p.results[n])).join(" | ")} |`,
	),
].join("\n");
const output = `# Runtime validator comparison: measured results

Measured: ${bench.measuredAt}. These are observations for the pinned implementations, not a universal ranking.

${snapshotNote}

## Reproduce

\`\`\`sh
cd research/runtime-validators
corepack pnpm install --frozen-lockfile
corepack pnpm verify
\`\`\`

Or run each stage: \`pnpm lint\`, \`pnpm typecheck\`, \`pnpm build\`, \`pnpm test\`, \`pnpm bundle\`, \`pnpm benchmark\`, \`pnpm probes\`, \`pnpm report\`.

Use Node ${bench.node} and ${pkg.packageManager}. This is a one-package pnpm workspace isolated from the article repository. Do not re-resolve latest versions when reproducing this snapshot. On a cold cache typia's Go source plugin can take several minutes to build and may require network access. ttsc compiled the Go source plugin successfully; a standalone go command was not available in the shell. All compiles use official TypeScript 7 \`ttsc\` integration and typia's auto-discovered transform; there is no ts-patch configuration.

The workspace explicitly sets \`minimumReleaseAge: 0\` for the original latest-stable experiment, including ttsc published on the measurement day. It permits only esbuild's install script via \`allowBuilds\`. Transitive versions and integrity hashes are recorded in pnpm-lock.yaml.

## Environment and exact direct versions

- Node: ${bench.node}; V8: ${bench.v8}
- OS: ${bench.platform} ${bench.arch}; kernel: ${bench.kernel}
- CPU: ${bench.cpu}
- zlib: ${process.versions.zlib}; Brotli: ${process.versions.brotli}

| Package | Resolved exact version |
| --- | --- |
${versions}

## Contract and checks

The comparison covers ordinary JSON-decoded data: string-keyed enumerable objects and dense arrays. Name length is **1..100 UTF-16 code units** using JavaScript string.length. There is no coercion. Integers 18..120 are required for age. Root and profile extras are rejected. Other rules are in src/user.ts and src/fixtures.ts.

- ${fixtures.length} shared JSON fixtures × 7 validators = ${fixtures.length * 7} boolean assertions, with expected outcomes, including boundary values, Unicode, wrong fields, missing fields, and root/nested extra keys.
- Input mutation is checked after every common guard call.
- Six richer result APIs are checked against every shared fixture; valid outputs are compared by value (identity is not required).
- Eleven Node test groups pass; browser ESM bundles also pass all ${fixtures.length * 7} shared checks when imported in Node. A real browser was not executed.
- Strict typecheck passes with noUncheckedIndexedAccess, exactOptionalPropertyTypes, noEmitOnError, explicit node types, and skipLibCheck=false.
- Narrowing checks cover native, is-kit, Runtypes, Valibot, ArkType, and typia. is-kit infers readonly arrays, so its output matches ReadonlyUser rather than mutable User.tags. No cast conceals this difference.
- The Zod boolean adapter intentionally has no type predicate; safeParse narrows result.data. A negative compile-time test ensures the boolean adapter does not narrow unknown.
- Biome recommended lint rules pass; ttsc builds all validator, entry, and test files.

This matrix is evidence, not a proof for every possible input. A manually declared predicate can lie to TypeScript; compilation alone does not verify its body.

## Changes from the supplied draft

1. **Unicode length is not equivalent out of the box.** Zod ${pkg.dependencies.zod} min/max and typia ${pkg.dependencies.typia} MinLength/MaxLength accept 51 emoji (51 code points, 102 UTF-16 units). Regression tests preserve that observation. Zod now uses refine(value => value.length >= 1 && value.length <= 100); typia uses a custom tags.TagBase with the same expression. Other samples keep their original string-length checks. This custom tag does not provide the built-in MinLength/MaxLength JSON Schema metadata.
2. **Runtypes shadows global constructors.** Imports are aliased (Number as RtNumber, etc.) so the constraint calls native Number.isInteger. The unaliased draft's Number import would hide that function.
3. **typia setup changed.** Latest typia ${pkg.dependencies.typia}, TypeScript ${pkg.devDependencies.typescript}, and ttsc ${pkg.devDependencies.ttsc} use the current official native transform. Stock tsc does not perform the transform. TypeScript 7 requires explicit node types for this project.
4. **is-kit is readonly at the type level.** The original mutable User type is not exactly its inferred type. Runtime acceptance and input mutability are separate questions.
5. **Zod API wording.** The schema's idiomatic operations are safeParse/parse. “safeParse / validate” is removed from the comparison table.
6. **AOT is not a capability ladder.** Code generation is a build/runtime choice, orthogonal to rich errors and integrations. ArkType can JIT compile traversal at runtime.
7. **No broadest/largest ecosystem claim.** Integration breadth is illustrated by the official Zod ecosystem directory, without an unmeasured superlative.

## Browser bundle size

${sizeTable}

Each src/entries file exposes only validate. esbuild ${bundle.esbuild} bundles the emitted JavaScript with platform=browser, format=esm, target=es2022, minify=true, treeShaking=true, legalComments=none. Each emitted file is compressed independently: gzip level 9, Brotli quality 11 using Node zlib. Units are bytes, not rounded KB. Test and benchmark frameworks are absent. These are standalone costs; marginal costs in an app that already imports a package differ. Schema initialization is included, but no construction time is measured here. Zod Mini is **not measured**.

**typia detail:** its separate browser entry creates only createEquals<User>(). Importing the richer module directly originally retained unused createValidateEquals initialization and yielded 5,722 raw bytes. That is excluded from the guard-only table. The final emitted typia entry imports typia and _isTypeUint32; esbuild retains the uint32 helper and drops unused exports. Final ESM has no external imports and measures 772 raw bytes. Generated validation has a runtime helper cost; there is no general schema interpreter in the guard. Inspect bundles/typia.meta.json for bytesInOutput, rather than treating every visited input module as retained code.

## Steady-state validation

${runtimeTable}

Values are **median (minimum–maximum)** across nine samples, in nanoseconds per call. Each sample makes 50,000 calls per case; each case warms up for 20,000 calls. A fresh sequential Node process is used for each library. Schemas and generated guards are constructed outside the timed loop. Case order rotates between samples. Each case repeatedly validates the same object; successful results feed an asserted numeric sink.

The exact APIs are native/is-kit predicates, Runtypes.guard, Valibot.is, Zod.safeParse(...).success, ArkType.allows, and typia.createEquals. Returning the same boolean does **not** mean doing the same work: some paths construct outputs/issues, some stop early, some validate more fields. In particular Zod safeParse creates output and Runtypes.guard wraps an inspect operation. This comparison does not measure the richer APIs or claim equal diagnostics cost.

The wrong-id case still supplies an object with the complete root shape. It is not a null/primitive early bailout. The deep case changes only profile.active to a string.

Limits: one small schema, three fixed objects, one engine/machine, shared workstation/WSL2, ordinary JIT and GC noise, no throughput for varied real payloads. Nanosecond-scale values are particularly sensitive to JIT optimization. Schema creation, import/startup cost, build cost, application latency, CSP behavior, cold validation, and error reporting UI are not benchmarked. Minimum/maximum are observed spread, not confidence intervals. Change the inputs and repeat before using these numbers for an application decision.

## JavaScript-only probes: equivalence stops here

${probeTable}

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
`;
await writeFile("RESULTS.md", output);
console.log("Wrote RESULTS.md");
