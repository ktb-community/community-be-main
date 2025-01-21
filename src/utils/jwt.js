const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const process = require("process");

const client = new OAuth2Client();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

class JwtUtil {
	static createToken(payload, options) {
		const tokenOptions = { ...options, algorithm: "HS256", issuer: "ktb.salguworld.store" };
		return jwt.sign(payload, JWT_SECRET_KEY, tokenOptions);
	}

	static verifyToken(token) {
		return jwt.verify(token, JWT_SECRET_KEY);
	}

	static async verifyGoogleIdToken(token, clientId) {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: clientId
		});

		return ticket.getPayload();
	}
}

module.exports = JwtUtil;