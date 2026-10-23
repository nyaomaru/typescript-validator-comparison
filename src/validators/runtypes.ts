import {
	Array as RtArray,
	Boolean as RtBoolean,
	Literal,
	Number as RtNumber,
	Object as RtObject,
	String as RtString,
	Union,
} from "runtypes";
const Name = RtString.withConstraint(
	(value) =>
		(value.length >= 1 && value.length <= 100) || "name length must be 1..100",
);
const Age = RtNumber.withConstraint(
	(value) =>
		(Number.isInteger(value) && value >= 18 && value <= 120) ||
		"age must be an integer in 18..120",
);
export const UserSchema = RtObject({
	id: RtString,
	name: Name,
	age: Age,
	role: Union(Literal("admin"), Literal("user")),
	tags: RtArray(RtString),
	profile: RtObject({ bio: RtString, active: RtBoolean }).exact(),
}).exact();
export const isUser = (input: unknown) => UserSchema.guard(input);
export const checkUser = (input: unknown) => UserSchema.check(input);
export const parseUser = (input: unknown) => UserSchema.parse(input);
export const inspectUser = (input: unknown) => UserSchema.inspect(input);
