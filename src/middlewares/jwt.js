const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const authenticateJWT = (req, res, next) => {
	const authHeader = req.get("Authorization");

	if (!authHeader) {
		return res.status(401).end();
	}

	// 토큰만 추출하기 - Bearer {token}
	const token = authHeader.substring(7);

	jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
		if (err) return res.status(403).end();
		req.user = user;
		next();
	});
};

module.exports = authenticateJWT;
