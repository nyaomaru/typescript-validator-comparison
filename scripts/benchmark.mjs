import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { cpus, platform, arch, release } from "node:os";
const names = [
	"native",
	"is-kit",
	"runtypes",
	"valibot",
	"zod",
	"arktype",
	"typia",
];
const results = [];
const selected = process.argv.slice(2);
for (const name of selected)
	if (!names.includes(name)) throw new Error(`Unknown validator: ${name}`);
const environment = {
	node: process.version,
	v8: process.versions.v8,
	platform: platform(),
	arch: arch(),
	kernel: release(),
	cpu: cpus()[0]?.model,
};
const previous = selected.length
	? JSON.parse(await readFile("benchmark-results.json", "utf8"))
	: undefined;
if (previous)
	for (const [key, value] of Object.entries(environment))
		if (previous[key] !== value)
			throw new Error(`Partial rerun requires the same ${key}`);
const pkg = JSON.parse(await readFile("package.json", "utf8"));
for (const name of selected.length ? selected : names) {
	const child = spawnSync(
		process.execPath,
		["scripts/benchmark-worker.mjs", name],
		{ encoding: "utf8" },
	);
	if (child.error) throw child.error;
	if (child.status !== 0) throw new Error(`${name}: ${child.stderr}`);
	const result = JSON.parse(child.stdout);
	result.measuredAt = new Date().toISOString();
	result.package = pkg.dependencies[name] ?? "native";
	results.push(result);
	console.log(
		`${name}: ${result.cases.map((c) => `${c.scenario} ${c.medianNs.toFixed(1)} ns`).join(", ")}`,
	);
}
await writeFile(
	"benchmark-results.json",
	`${JSON.stringify(previous ? { ...previous, results: previous.results.map((old) => results.find((result) => result.name === old.name) ?? old) } : { measuredAt: new Date().toISOString(), ...environment, results }, null, 2)}\n`,
);
