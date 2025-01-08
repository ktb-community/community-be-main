const logger = require("../config/logger");
const { getKst } = require("../utils/utils");

const authenticateSession = (req, res, next) => {
	if (!req.session) {
		return res.status(403).send("Not authorized");
	}

	logger.info(`
		[${req.originalUrl}] 
			currKst: ${getKst()} ${getKst().getTime()} \n
			expires: ${req.session.cookie._expires} ${req.session.cookie._expires.getTime()} \n
			maxAge: ${req.session.cookie.originalMaxAge} \n
	`);

	// 만료 여부 확인
	if (getKst().getTime() > req.session.cookie._expires.getTime()) {
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