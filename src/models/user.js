/**
[User Scheme]
CREATE TABLE USERS (
    userId INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(512) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    profileImg VARCHAR(255),
    role VARCHAR(255) NOT NULL DEFAULT 'USER',
    refreshToken VARCHAR(255),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastLoginDate DATETIME
);
*/

const mysql2 = require("mysql2");
const { PoolConnection } = mysql2;

// User 모델 정의
const User = {
	/**
	 * 사용자 회원가입
	 * @param {PoolConnection} connection
	 * @param {object} UserCreate email, password, nickname, profileImg
	 * @returns {Promise<object>} 삽입된 결과
	 * @description createdAt은 DB에서 자동으로 기록, password는 BCrypt 해싱된 값
	 */
	create: async (connection, { email, password, nickname, profileImg }) => {
		const query = `
            INSERT INTO USERS (email, password, nickname, profileImg)
            VALUES (?, ?, ?, ?)
        `;

		const [result] = await connection.execute(query, [email, password, nickname, profileImg]);
		return result;
	},

	/**
	 * 이메일로 사용자 검색
	 * @param {PoolConnection} connection
	 * @param {object} UserEmail email
	 * @return {Promise<object|null>} 찾은 사용자 정보 또는 NULL
	 */
	findByEmail: async (connection, { email }) => {
		const query = `SELECT * FROM USERS WHERE email = ?`;
		const [rows] = await connection.execute(query, [email]);
		return rows[0] || null;
	},

	/**
	 * 사용자 로그인
	 * @param {PoolConnection} connection
	 * @param {object} UserLogin userId, refreshToken, lastLoginDate
	 */
	login: async (connection, { userId, refreshToken, lastLoginDate }) => {
		const query = `
            UPDATE USERS
            SET lastLoginDate = ?, refreshToken = ?
            WHERE userId = ?
        `;
		await connection.execute(query, [lastLoginDate, refreshToken, userId]);
	},
};

module.exports = User;
