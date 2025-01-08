const process = require("process");
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

const Session = Object.freeze({
	TTL: 60 * 60 * 24 * 3, // 3일
	SECRET_KEY: process.env.SESSION_SECRET_KEY,
	HTTP_ONLY: true,
	SECURE: true,
	SAME_SITE: 'none',
});

module.exports = {
	ResStatus,
	UserRole,
	Session,
};
