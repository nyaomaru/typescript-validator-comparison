export type User = {
	id: string;
	name: string;
	age: number;
	role: "admin" | "user";
	tags: string[];
	profile: { bio: string; active: boolean };
};
export type ReadonlyUser = Omit<User, "tags" | "profile"> & {
	readonly tags: readonly string[];
	readonly profile: { readonly bio: string; readonly active: boolean };
};
