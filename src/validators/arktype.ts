import { type } from "arktype";
export const UserSchema = type({
	id: "string",
	name: "0 < string <= 100",
	age: "18 <= number.integer <= 120",
	role: "'admin' | 'user'",
	tags: "string[]",
	profile: { bio: "string", active: "boolean" },
}).onDeepUndeclaredKey("reject");
export const isUser = (input: unknown) => UserSchema.allows(input);
export const parseUser = (input: unknown) => UserSchema(input);
export const ArkErrors = type.errors;
