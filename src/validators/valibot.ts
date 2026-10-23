import * as v from "valibot";
export const UserSchema = v.strictObject({
	id: v.string(),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	age: v.pipe(v.number(), v.integer(), v.minValue(18), v.maxValue(120)),
	role: v.picklist(["admin", "user"]),
	tags: v.array(v.string()),
	profile: v.strictObject({ bio: v.string(), active: v.boolean() }),
});
export const isUser = (input: unknown) => v.is(UserSchema, input);
export const parseUser = (input: unknown) => v.safeParse(UserSchema, input);
