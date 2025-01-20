const ResStatus = Object.freeze({
	FAIL: "Fail",
	SUCCESS: "Success",
	ERROR: "Error",

	/* LOGIN */
	EMAIL_NOT_FOUND: "Email not found",
	PASSWORD_NOT_MATCH: "Password not match",

	/* SIGNUP */
	EMAIL_DUPLICATED: "Email already exists",
	NICKNAME_DUPLICATED: "Nickname already exists",

	/* EDIT */
	SAME_PASSWORD: "Password must not be same",
});

const UserRole = Object.freeze({
	ADMIN: "ADMIN",
	USER: "USER",
});

module.exports = {
	ResStatus,
	UserRole,
};
