const JwtUtil = require("../utils/jwt");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");

const jwtAuthenticate = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return sendJSONResponse(res, 401, ResStatus.UNAUTHORIZED, "허용되지 않은 접근입니다.");
	}

	const token = authHeader.split(" ")[1];

	try {
		req.decoded = JwtUtil.verifyToken(token);
		next();
	} catch (err) {
		console.error(err);
		return sendJSONResponse(res, 403, ResStatus.FORBIDDEN, "유효하지 않거나 만료된 토큰입니다.");
	}
};

module.exports = jwtAuthenticate;