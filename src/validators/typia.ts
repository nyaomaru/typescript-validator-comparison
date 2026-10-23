import typia, { type tags } from "typia";
// MinLength/MaxLength count code points in typia 15. Use a custom tag for this contract.
type Utf16Name = tags.TagBase<{
	kind: "utf16Name";
	target: "string";
	value: undefined;
	validate: "$input.length >= 1 && $input.length <= 100";
}>;
export interface User {
	id: string;
	name: string & Utf16Name;
	age: number & tags.Type<"uint32"> & tags.Minimum<18> & tags.Maximum<120>;
	role: "admin" | "user";
	tags: string[];
	profile: { bio: string; active: boolean };
}
export const isUser = typia.createEquals<User>();
export const validateUser = typia.createValidateEquals<User>();
