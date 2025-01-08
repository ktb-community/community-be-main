const logger = require("../config/logger");

const authenticateSession = (req, res, next) => {
	if (!req.session) {
		return res.status(403).send("Not authorized");
	}

	logger.info(`[${req.originalUrl}] expires: ${req.session.cookie._expires} maxAge: ${req.session.cookie.originalMaxAge}`);

	// 만료 여부 확인
	if (Date.now() > req.session.cookie._expires.getTime()) {
		req.session.destroy((err) => {
			if (err) {
				return res.status(500).send("세션 만료 중 에러가 발생하였습니다.");
			}
			res.clearCookie("connect.sid"); // 세션 쿠키 삭제
			logger.info(`${req.session.cookie.user} Session Expired`);
			return res.status(403).send("Session expired");
		});
	} else {
		next(); // 세션이 유효하면 계속 진행
	}
};

module.exports = authenticateSession;