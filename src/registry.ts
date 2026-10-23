import { isUser as native } from "./validators/native.js";
import { isUser as is_kit } from "./validators/is-kit.js";
import { isUser as runtypes } from "./validators/runtypes.js";
import { isUser as valibot } from "./validators/valibot.js";
import { isUser as zod } from "./validators/zod.js";
import { isUser as arktype } from "./validators/arktype.js";
import { isUser as typia } from "./validators/typia.js";
export const validators = {
	native,
	"is-kit": is_kit,
	runtypes,
	valibot,
	zod,
	arktype,
	typia,
};
