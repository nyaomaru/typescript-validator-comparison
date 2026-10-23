import type { User } from "../user.js";
const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
const hasExactKeys = (
	value: Record<string, unknown>,
	keys: readonly string[],
): boolean =>
	Object.keys(value).length === keys.length &&
	keys.every((key) => Object.hasOwn(value, key));
export const isUser = (value: unknown): value is User => {
	if (
		!isRecord(value) ||
		!hasExactKeys(value, ["id", "name", "age", "role", "tags", "profile"])
	)
		return false;
	if (
		!isRecord(value.profile) ||
		!hasExactKeys(value.profile, ["bio", "active"])
	)
		return false;
	return (
		typeof value.id === "string" &&
		typeof value.name === "string" &&
		value.name.length >= 1 &&
		value.name.length <= 100 &&
		typeof value.age === "number" &&
		Number.isInteger(value.age) &&
		value.age >= 18 &&
		value.age <= 120 &&
		(value.role === "admin" || value.role === "user") &&
		Array.isArray(value.tags) &&
		value.tags.every((tag) => typeof tag === "string") &&
		typeof value.profile.bio === "string" &&
		typeof value.profile.active === "boolean"
	);
};
