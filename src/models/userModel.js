class User {
	static async findByEmail(conn, { email }) {
		const query = `SELECT * FROM USERS WHERE email = ?`;
		const [user] = await conn.execute(query, [email]);
		return user[0] || null;
	}

	static async findByNickname(conn, { nickname }) {
		const query = `SELECT * FROM USERS WHERE nickname = ?`;
		const [user] = await conn.execute(query, [nickname]);
		return user[0] || null;
	}

	static async findById(conn, { id }) {
		const query = `SELECT * FROM USERS WHERE id = ?`;
		const [user] = await conn.execute(query, [id]);
		return user[0] || null;
	}

	static async save(conn, { user }) {
		const { email, password, nickname, profileImg, lastLoginDate } = user;

		const query = `
			INSERT INTO USERS(email, password, nickname, profileImg, lastLoginDate)
			VALUES(?, ?, ?, ?, ?)
		`;

		const [result] = await conn.execute(query, [email, password, nickname, profileImg, lastLoginDate]);
		return result.insertId;
	}

	static async saveSocialUser(conn, { user }) {
		const { email, emailVerified, nickname, authType, profileImg, lastLoginDate } = user;

		const query = `
			INSERT INTO USERS(email, emailVerified, nickname, authType, profileImg, lastLoginDate)
			VALUES(?, ?, ?, ?, ?, ?)
		`;

		const [result] = await conn.execute(query, [email, emailVerified, nickname, authType, profileImg, lastLoginDate]);
		return result.insertId;
	}

	static async updateUser(conn, { user }) {
		const query = `
			UPDATE USERS
			SET nickname = ?, profileImg = ?, password = ?
			WHERE id = ?
		`;

		await conn.execute(query, [user.nickname, user.profileImg, user.password, user.id]);
	}

	static async updateRefreshToken(conn, { id, refreshToken }) {
		const query = `
			UPDATE USERS
			SET refreshToken = ?
			WHERE id = ?
		`;

		await conn.execute(query, [refreshToken, id]);
	}

	static async updateLoginInfo(conn, { id, lastLoginDate, refreshToken }) {
		const query = `
			UPDATE USERS 
			SET lastLoginDate = ?, refreshToken = ? 
			WHERE id = ?
		`;

		await conn.execute(query, [lastLoginDate, refreshToken, id]);
	}

	static async setNullRefreshToken(conn, { id }) {
		const query = `
			UPDATE USERS
			SET refreshToken = NULL
			WHERE id = ?
		`;

		await conn.execute(query, [id]);
	}
}

module.exports = User;