const logger = require("../config/logger");

const authenticateSession = (req, res, next) => {
	if (!req.session) {
		return res.status(403).send("Not authorized");
	}

	// 2. 세션 쿠키의 만료 시간 계산
	const now = Date.now();
	const maxAge = req.session.cookie.maxAge; // 남은 시간 (밀리초)
	const expiresAt = req.session.cookie._expires; // 절대 만료 시간 (UTC)

	// 3. 만료 여부 확인
	if (maxAge <= 0 || now >= new Date(expiresAt).getTime()) {
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