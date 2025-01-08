const logger = require("../config/logger")

const authenticateSession = (req, res, next) => {
	if (!req.session) {
		return res.status(403).send("Not authorized");
	}

	logger.info(`[${req.originalUrl}] ${req.session.cookie}`);

	// 쿠키의 만료 시간 계산 (req.session.cookie.originalMaxAge)
	const maxAge = req.session.cookie.originalMaxAge; // 설정된 maxAge 값
	const createdAt = req.session.cookie._expires
		? new Date(req.session.cookie._expires).getTime() - maxAge
		: Date.now();

	// 현재 시간
	const now = Date.now();

	// 만료 여부 확인
	if (now > createdAt + maxAge) {
		req.session.destroy((err) => {
			if (err) {
				return res.status(500).send("세션 만료 중 에러가 발생하였습니다.");
			}
			res.clearCookie("connect.sid"); // 세션 쿠키 삭제
			return res.status(403).send("Session expired");
		});
	} else {
		next(); // 세션이 유효하면 계속 진행
	}
};

module.exports = authenticateSession;