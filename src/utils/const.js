const ResStatus = Object.freeze({
	FAIL: "Fail",
	SUCCESS: "Success",
	ERROR: "Error",
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
