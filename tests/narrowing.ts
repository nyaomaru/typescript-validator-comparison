import type { User, ReadonlyUser } from "../src/user.js";
import { isUser as native } from "../src/validators/native.js";
import { isUser as kit } from "../src/validators/is-kit.js";
import { isUser as rt } from "../src/validators/runtypes.js";
import { isUser as v } from "../src/validators/valibot.js";
import { isUser as a } from "../src/validators/arktype.js";
import { isUser as t } from "../src/validators/typia.js";
import { isUser as z, parseUser } from "../src/validators/zod.js";
export function verifyNarrowing(input: unknown) {
	if (native(input)) {
		const user: User = input;
		user.name.toUpperCase();
	}
	if (rt(input)) {
		const user: User = input;
		user.name.toUpperCase();
	}
	if (v(input)) {
		const user: User = input;
		user.name.toUpperCase();
	}
	if (a(input)) {
		const user: User = input;
		user.name.toUpperCase();
	}
	if (t(input)) {
		const user: User = input;
		user.name.toUpperCase();
	}
	if (kit(input)) {
		const user: ReadonlyUser = input;
		user.name.toUpperCase();
		// @ts-expect-error is-kit infers readonly collections, not mutable User.tags
		const mutable: User = input;
		void mutable;
	}
	if (z(input)) {
		const user: User = input;
		user.name.toUpperCase();
	}
	const result = parseUser(input);
	if (result.success) {
		const user: User = result.data;
		user.name.toUpperCase();
	}
	// @ts-expect-error input is still unknown outside the guards
	input.name;
}
