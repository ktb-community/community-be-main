const authenticateSession = (req, res, next) => {
	if (!req.session) {
		return res.status(403).send("Not authorized");
	}

	const expires = req.session.cookie.expires;

	// 세션 만료 시간이 없으면 만료된 세션으로 간주
	if (!expires) {
		return res.status(403).send("Session expired");
	}

	// expires 값은 Date 객체이므로 .getTime()을 통해 밀리초로 비교
	const expiresTime = new Date(expires).getTime();
	const now = Date.now() + (1000 * 60 * 60 * 9);

	// 세션 만료 체크
	if (expiresTime < now) {
		// 세션 만료되었을 때, 세션과 쿠키 삭제
		req.session.destroy((err) => {
			if (err) {
				return res.status(500).send("세션 만료 중 에러가 발생하였습니다.");
			}
			res.clearCookie('connect.sid'); // 쿠키도 삭제
			return res.status(403).send("Session expired");
		});
	} else {
		next();  // 세션이 유효하면 요청을 계속 진행
	}

}

module.exports = authenticateSession;