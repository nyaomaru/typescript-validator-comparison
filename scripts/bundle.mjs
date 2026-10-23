import assert from "node:assert/strict";
import { build, version } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { fixtures } from "../dist/src/fixtures.js";
const names = [
	"native",
	"is-kit",
	"runtypes",
	"valibot",
	"zod",
	"arktype",
	"typia",
];
await mkdir("bundles", { recursive: true });
const sizes = [];
const selected = process.argv.slice(2);
for (const name of selected)
	if (!names.includes(name)) throw new Error(`Unknown validator: ${name}`);
const previous = selected.length
	? JSON.parse(await readFile("bundle-results.json", "utf8"))
	: undefined;
if (previous && previous.esbuild !== version)
	throw new Error("Partial rerun requires the same esbuild version");
for (const name of selected.length ? selected : names) {
	// Compile typia with ttsc first; esbuild consumes generated JS for every entry.
	const result = await build({
		entryPoints: [`dist/src/entries/${name}.js`],
		bundle: true,
		platform: "browser",
		format: "esm",
		target: "es2022",
		minify: true,
		treeShaking: true,
		legalComments: "none",
		write: false,
		metafile: true,
	});
	const bytes = result.outputFiles[0].contents;
	await writeFile(`bundles/${name}.mjs`, bytes);
	await writeFile(
		`bundles/${name}.meta.json`,
		JSON.stringify(result.metafile, null, 2),
	);
	const { validate } = await import(`../bundles/${name}.mjs`);
	for (const fixture of fixtures)
		assert.equal(
			validate(fixture.input),
			fixture.expected,
			`${name} bundle: ${fixture.name}`,
		);
	sizes.push({
		name,
		raw: bytes.length,
		gzip: gzipSync(bytes, { level: 9 }).length,
		brotli: brotliCompressSync(bytes, {
			params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
		}).length,
		inputs: Object.keys(result.metafile.inputs),
		externalImports: Object.values(result.metafile.outputs).flatMap(
			(o) => o.imports,
		),
	});
}
await writeFile(
	"bundle-results.json",
	`${JSON.stringify(previous ? { ...previous, sizes: previous.sizes.map((old) => sizes.find((size) => size.name === old.name) ?? old) } : { esbuild: version, settings: { platform: "browser", format: "esm", target: "es2022", minify: true, treeShaking: true, legalComments: "none", gzipLevel: 9, brotliQuality: 11 }, sizes }, null, 2)}\n`,
);
console.table(
	sizes.map(({ name, raw, gzip, brotli }) => ({ name, raw, gzip, brotli })),
);
