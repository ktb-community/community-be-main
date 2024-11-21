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
	 * @param {string} email
	 * @return {Promise<object|null>} 찾은 사용자 정보 또는 NULL
	 */
	findByEmail: async (connection, { email }) => {
		const query = `SELECT * FROM USERS WHERE email = ?`;
		const [rows] = await connection.execute(query, [email]);
		return rows[0] || null;
	},

	/**
	 * 사용자 로그인
	 * @param {number} id 유저 기본키
	 * @param {string} refreshToken 매 로그인마다 리프레시 토큰 초기화
	 * @param {Date} lastLoginDate 로그인 일자 업데이트
	 */
	login: async (connection, { id, refreshToken, lastLoginDate }) => {
		const query = `
            UPDATE MEMBER
            SET lastLoginDate = ? and refreshToken = ?
            WHERE id = ?
        `;
		await connection.execute(query, [lastLoginDate, refreshToken, id]);
	},
};

module.exports = User;
