import {
	and,
	arrayOf,
	isBoolean,
	isNumber,
	isString,
	oneOfValues,
	predicateToRefine,
	safeParse,
	struct,
} from "is-kit";
export const isName = and(
	isString,
	predicateToRefine<string>(
		(value) => value.length >= 1 && value.length <= 100,
	),
);
export const isAge = and(
	isNumber,
	predicateToRefine<number>(
		(value) => Number.isInteger(value) && value >= 18 && value <= 120,
	),
);
export const isProfile = struct(
	{ bio: isString, active: isBoolean },
	{ exact: true },
);
export const isUser = struct(
	{
		id: isString,
		name: isName,
		age: isAge,
		role: oneOfValues("admin", "user"),
		tags: arrayOf(isString),
		profile: isProfile,
	},
	{ exact: true },
);
export const parseUser = (input: unknown) => safeParse(isUser, input);
