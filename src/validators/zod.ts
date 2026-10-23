import * as z from "zod";
export const UserSchema = z.strictObject({
	id: z.string(),
	name: z
		.string()
		.refine(
			(value) => value.length >= 1 && value.length <= 100,
			"name must contain 1..100 UTF-16 code units",
		),
	age: z.int().min(18).max(120),
	role: z.enum(["admin", "user"]),
	tags: z.array(z.string()),
	profile: z.strictObject({ bio: z.string(), active: z.boolean() }),
});
export const parseUser = (input: unknown) => UserSchema.safeParse(input);
// This schema has no transforms, so its output type is also safe for the input.
export const isUser = (input: unknown): input is z.output<typeof UserSchema> =>
	parseUser(input).success;
