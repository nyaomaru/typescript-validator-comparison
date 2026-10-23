import { writeFile } from "node:fs/promises";
import { probes } from "../dist/src/fixtures.js";
import { validators } from "../dist/src/registry.js";
const results = probes.map(({ name, input }) => ({
	name,
	results: Object.fromEntries(
		Object.entries(validators).map(([library, guard]) => {
			try {
				return [library, guard(input)];
			} catch {
				return [library, "throws"];
			}
		}),
	),
}));
await writeFile("probe-results.json", `${JSON.stringify(results, null, 2)}\n`);
console.table(results.map(({ name, results }) => ({ name, ...results })));
