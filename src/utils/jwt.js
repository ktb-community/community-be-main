const jwt = require("jsonwebtoken");
const process = require("process");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

class JwtUtil {
	static createToken(payload, options) {
		const tokenOptions = { ...options, algorithm: "HS256", issuer: "ktb.salguworld.store" };
		return jwt.sign(payload, JWT_SECRET_KEY, tokenOptions);
	}

	static verifyToken(token) {
		return jwt.verify(token, JWT_SECRET_KEY);
	}
}

module.exports = JwtUtil;