const ResStatus = Object.freeze({
	FAIL: "Fail",
	SUCCESS: "Success",
	ERROR: "Error",

	/* LOGIN */
	EMAIL_NOT_FOUND: 'Email not found',
	PASSWORD_NOT_MATCH: 'Password not match',

	/* SIGNUP */
	EMAIL_DUPLICATED: 'Email already exists',
	NICKNAME_DUPLICATED: 'Nickname already exists',

});

const UserRole = Object.freeze({
	ADMIN: "ADMIN",
	USER: "USER"
})

const JWTExpire = Object.freeze({
	ACCESS_TOKEN: 1800,
	REFRESH_TOKEN: 3600
})

module.exports = {
	ResStatus,
	UserRole,
	JWTExpire
};
