import type { User } from "./user.js";
export const valid: User = {
	id: "u1",
	name: "Ada",
	age: 36,
	role: "admin",
	tags: ["typescript", "validation"],
	profile: { bio: "Engineer", active: true },
};
export type Fixture = { name: string; input: unknown; expected: boolean };
export const fixtures: Fixture[] = [
	{ name: "valid", input: valid, expected: true },
	{
		name: "minimum bounds",
		input: { ...valid, name: "a", age: 18, role: "user", tags: [] },
		expected: true,
	},
	{
		name: "maximum bounds",
		input: { ...valid, name: "a".repeat(100), age: 120 },
		expected: true,
	},
	{
		name: "50 emoji = 100 UTF-16 units",
		input: { ...valid, name: "😀".repeat(50) },
		expected: true,
	},
	{
		name: "51 emoji = 102 UTF-16 units",
		input: { ...valid, name: "😀".repeat(51) },
		expected: false,
	},
	...Object.entries({
		id: 1,
		name: "",
		age: 17,
		role: "guest",
		tags: ["ok", 1],
		profile: null,
	}).map(([key, value]) => ({
		name: `wrong ${key}`,
		input: { ...valid, [key]: value },
		expected: false,
	})),
	{
		name: "name 101",
		input: { ...valid, name: "a".repeat(101) },
		expected: false,
	},
	{ name: "name wrong type", input: { ...valid, name: 1 }, expected: false },
	...[121, 18.5, "36", null].map((age) => ({
		name: `age ${age}`,
		input: { ...valid, age },
		expected: false,
	})),
	{
		name: "tags wrong container",
		input: { ...valid, tags: "tag" },
		expected: false,
	},
	{
		name: "profile bio wrong",
		input: { ...valid, profile: { ...valid.profile, bio: 1 } },
		expected: false,
	},
	{
		name: "profile active wrong",
		input: { ...valid, profile: { ...valid.profile, active: 1 } },
		expected: false,
	},
	{ name: "extra root key", input: { ...valid, extra: true }, expected: false },
	{
		name: "extra profile key",
		input: { ...valid, profile: { ...valid.profile, extra: true } },
		expected: false,
	},
	...[null, [], "user", 42, true].map((input) => ({
		name: `root ${JSON.stringify(input)}`,
		input,
		expected: false,
	})),
	...Object.keys(valid).map((key) => ({
		name: `missing ${key}`,
		input: Object.fromEntries(Object.entries(valid).filter(([k]) => k !== key)),
		expected: false,
	})),
	{
		name: "missing profile bio",
		input: { ...valid, profile: { active: true } },
		expected: false,
	},
	{
		name: "missing profile active",
		input: { ...valid, profile: { bio: "" } },
		expected: false,
	},
];
export const probes: { name: string; input: unknown }[] = [
	{ name: "sparse tags", input: { ...valid, tags: new Array(2) } },
	{ name: "inherited fields", input: Object.create(valid) },
	{ name: "extra symbol", input: { ...valid, [Symbol("extra")]: true } },
	{
		name: "extra nonenumerable",
		input: Object.defineProperty({ ...valid }, "extra", { value: true }),
	},
	{
		name: "own nonenumerable id",
		input: Object.defineProperty({ ...valid }, "id", {
			value: "u1",
			enumerable: false,
		}),
	},
	{ name: "extra undefined", input: { ...valid, extra: undefined } },
	...[NaN, Infinity, -Infinity, undefined].map((age) => ({
		name: `nonJSON age ${String(age)}`,
		input: { ...valid, age },
	})),
	{ name: "undefined root", input: undefined },
	{ name: "undefined tag", input: { ...valid, tags: [undefined] } },
	{
		name: "throwing getter",
		input: Object.defineProperty({ ...valid }, "name", {
			enumerable: true,
			get() {
				throw new Error("getter executed");
			},
		}),
	},
];
