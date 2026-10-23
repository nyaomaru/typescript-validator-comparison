import * as z from "zod";
import typia, { type tags } from "typia";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fixtures, valid } from "../src/fixtures.js";
import { validators } from "../src/registry.js";
import { parseUser as kitParse } from "../src/validators/is-kit.js";
import {
	checkUser,
	parseUser as rtParse,
	inspectUser,
} from "../src/validators/runtypes.js";
import { parseUser as vParse } from "../src/validators/valibot.js";
import { parseUser as zParse } from "../src/validators/zod.js";
import { parseUser as aParse, ArkErrors } from "../src/validators/arktype.js";
import { validateUser } from "../src/validators/typia.js";
for (const [name, guard] of Object.entries(validators)) {
	test(`${name}: shared contract (${fixtures.length} fixtures)`, () => {
		for (const fixture of fixtures) {
			const input: unknown = JSON.parse(JSON.stringify(fixture.input));
			const before = structuredClone(input);
			assert.equal(guard(input), fixture.expected, fixture.name);
			assert.deepEqual(input, before, `${fixture.name}: input mutated`);
		}
	});
}
test("richer APIs accept valid output without value changes", () => {
	const k = kitParse(valid);
	assert.equal(k.valid, true);
	if (k.valid) assert.deepEqual(k.value, valid);
	assert.deepEqual(checkUser(valid), valid);
	assert.deepEqual(rtParse(valid), valid);
	const v = vParse(valid);
	assert.equal(v.success, true);
	if (v.success) assert.deepEqual(v.output, valid);
	const z = zParse(valid);
	assert.equal(z.success, true);
	if (z.success) assert.deepEqual(z.data, valid);
	assert.deepEqual(aParse(valid), valid);
	const t = validateUser(valid);
	assert.equal(t.success, true);
	if (t.success) assert.deepEqual(t.data, valid);
});
test("richer APIs report deep failure", () => {
	const bad = { ...valid, profile: { ...valid.profile, active: "yes" } };
	assert.equal(kitParse(bad).valid, false);
	assert.equal(inspectUser(bad).success, false);
	assert.throws(() => checkUser(bad));
	const v = vParse(bad);
	assert.equal(v.success, false);
	if (!v.success) assert.ok(v.issues.length);
	const z = zParse(bad);
	assert.equal(z.success, false);
	if (!z.success)
		assert.deepEqual(z.error.issues[0]?.path, ["profile", "active"]);
	assert.ok(aParse(bad) instanceof ArkErrors);
	const t = validateUser(bad);
	assert.equal(t.success, false);
	if (!t.success)
		assert.ok(t.errors.some((e) => e.path === "$input.profile.active"));
});

test("all richer APIs agree on every shared fixture", () => {
	for (const { name, input, expected } of fixtures) {
		assert.equal(kitParse(input).valid, expected, name);
		assert.equal(inspectUser(input).success, expected, name);
		assert.equal(vParse(input).success, expected, name);
		assert.equal(zParse(input).success, expected, name);
		assert.equal(!(aParse(input) instanceof ArkErrors), expected, name);
		assert.equal(validateUser(input).success, expected, name);
	}
});

type DefaultName = { name: string & tags.MinLength<1> & tags.MaxLength<100> };
const defaultTypiaName = typia.createEquals<DefaultName>();
test("default length checks differ from the UTF-16 contract", () => {
	const name = "😀".repeat(51);
	assert.equal(name.length, 102);
	assert.equal(z.string().min(1).max(100).safeParse(name).success, true);
	assert.equal(defaultTypiaName({ name }), true);
});
