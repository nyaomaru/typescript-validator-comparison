import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { valid } from "../dist/src/fixtures.js";
const name = process.argv[2];
const { isUser } = await import(`../dist/src/validators/${name}.js`);
const scenarios = {
	valid: { input: valid, expected: true },
	root: { input: { ...valid, id: 42 }, expected: false },
	deep: {
		input: { ...valid, profile: { ...valid.profile, active: "yes" } },
		expected: false,
	},
};
const warmup = 20000,
	iterations = 50000,
	samples = 9;
let sink = 0;
function batch(input, count) {
	const start = performance.now();
	for (let i = 0; i < count; i++) sink += Number(isUser(input));
	return ((performance.now() - start) * 1e6) / count;
}
for (const { input, expected } of Object.values(scenarios)) {
	assert.equal(isUser(input), expected);
	batch(input, warmup);
}
const timings = Object.fromEntries(
	Object.keys(scenarios).map((key) => [key, []]),
);
// Rotate case order between samples to reduce fixed-order effects.
const keys = Object.keys(scenarios);
for (let sample = 0; sample < samples; sample++) {
	for (let offset = 0; offset < keys.length; offset++) {
		const key = keys[(sample + offset) % keys.length];
		timings[key].push(batch(scenarios[key].input, iterations));
	}
}
const cases = Object.entries(timings).map(([scenario, values]) => {
	const sorted = [...values].sort((a, b) => a - b);
	return {
		scenario,
		medianNs: sorted[Math.floor(sorted.length / 2)],
		minNs: sorted[0],
		maxNs: sorted.at(-1),
		samplesNs: values,
	};
});
assert.equal(sink, warmup + samples * iterations);
console.log(JSON.stringify({ name, warmup, iterations, samples, cases, sink }));
