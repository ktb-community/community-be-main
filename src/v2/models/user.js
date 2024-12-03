/*
[USERS Schema]
CREATE TABLE IF NOT EXISTS USERS (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    nickname VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(512) NOT NULL,
    profileImg VARCHAR(255),
    refreshToken VARCHAR(255),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastLoginDate DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

const logger = require("../../config/logger");
const { DatabaseConnectionException } = require("../../exception/CustomException");

// User 모델 정의
class User {
	/**
	 * 사용자 회원가입
	 * @param {PoolConnection} connection
	 * @param {object} UserCreate email, password, nickname, profileImg
	 * @returns {Promise<object>} 삽입된 결과
	 * @description createdAt은 DB에서 자동으로 기록, password는 BCrypt 해싱된 값
	 */
	async create(connection, { email, password, nickname, profileImg }) {
		const query = `
            INSERT INTO USERS (email, password, nickname, profileImg)
            VALUES (?, ?, ?, ?)
        `;

		try {
			const [result] = await connection.execute(query, [email, password, nickname, profileImg]);
			return result;
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException(); // Controller에서 처리
		}
	}

	/**
	 * 사용자 로그인
	 * @param {PoolConnection} connection
	 * @param {object} UserLogin userId, refreshToken, lastLoginDate
	 */
	async login(connection, { userId, refreshToken, lastLoginDate }) {
		const query = `
            UPDATE USERS
            SET lastLoginDate = ?, refreshToken = ?
            WHERE id = ?
        `;

		try {
			await connection.execute(query, [lastLoginDate, refreshToken, userId]);
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	/**
	 * 사용자 로그아웃
	 * @param {PoolConnection} connection
	 * @param {object} UserLogout userId
	 * @description refreshToken 만료 처리
	 */
	async logout(connection, { userId }) {
		const query = `
            UPDATE USERS
            SET refreshToken = NULL
            WHERE id = ?
        `;

		try {
			await connection.execute(query, [userId]);
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	/**
	 * 이메일로 사용자 검색
	 * @param {PoolConnection} connection
	 * @param {object} UserEmail email
	 * @return {Promise<object|null>} 찾은 사용자 정보 또는 NULL
	 */
	async findByEmail(connection, { email }) {
		const query = `SELECT * FROM USERS WHERE email = ?`;

		try {
			const [rows] = await connection.execute(query, [email]);
			return rows[0] || null;
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	/**
	 * 닉네임으로 사용자 검색
	 */
	async findByNickname(connection, { nickname }) {
		const query = `SELECT * FROM USERS WHERE nickname = ?`;

		try {
			const [rows] = await connection.execute(query, [nickname]);
			return rows[0] || null;
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	/**
	 * id로 사용자 검색
	 * @param {PoolConnection} connection
	 * @param {object} UserId userId
	 * @return {Promise<object|null>} 찾은 사용자 정보 또는 NULL
	 */
	async findById(connection, { userId }) {
		const query = `SELECT * FROM USERS WHERE id = ?`;

		try {
			const [rows] = await connection.execute(query, [userId]);
			return rows[0] || null;
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	/**
	 * 사용자 닉네임 변경
	 */
	async patchNickname(connection, { userId, nickname }) {
		const query = `
			UPDATE USERS
			SET USERS.nickname = ?
			WHERE id = ?
		`;

		try {
			await connection.execute(query, [nickname, userId]);
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	/**
	 * 사용자 비밀번호 변경
	 */
	async patchPassword(connection, { userId, password }) {
		const query = `
			UPDATE USERS
			SET USERS.password = ?
			WHERE id = ?
		`;

		try {
			await connection.execute(query, [password, userId]);
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	/**
	 * 사용자 토큰 변경
	 */
	async patchRefreshToken(connection, { userId, refreshToken }) {
		const query = `
			UPDATE USERS
			SET USERS.refreshToken = ?
			WHERE id = ?
		`;

		try {
			await connection.execute(query, [refreshToken, userId]);
		} catch (err) {
			logger.error(err);
			throw err;
		}
	}
}

module.exports = User;
