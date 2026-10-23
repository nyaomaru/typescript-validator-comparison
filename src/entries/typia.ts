import typia from "typia";
import type { User } from "../validators/typia.js";
// Generate only the guard; do not retain unused richer factory initialization.
export const validate = typia.createEquals<User>();
