const jwt = require("jsonwebtoken");
const process = require("process");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");
const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;

const authenticateJWT = (req, res, next) => {
	const authHeader = req.get("Authorization");

	if (!authHeader) {
		return sendJSONResponse(res, 403, ResStatus.FAIL, "토큰 헤더가 없습니다.")
	}

	// 토큰만 추출하기 - Bearer {token}
	const token = authHeader.substring(7);

	jwt.verify(token, ACCESS_TOKEN_SECRET_KEY, (err, user) => {
		if (err) {
			return sendJSONResponse(res, 401, ResStatus.FAIL, "토큰 검증에 실패하였습니다")
		}
		req.user = user;
		next();
	});
};

module.exports = authenticateJWT;
