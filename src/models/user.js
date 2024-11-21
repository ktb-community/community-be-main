const pool = require("../config/db")

/**
 * User Scheme
 * id INT PRIMARY KEY AUTO_INCREMENT,
 * email VARCHAR(255) NOT NULL UNIQUE,
 * password VARCHAR(512) NOT NULL,
 * nickname VARCHAR(255) NOT NULL,
 * profileImg VARCHAR(255),
 * createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
 */

/**
 * @typedef {Object} User
 * @property {string} email
 * @property {string} password
 * @property {string} nickname
 * @property {string} profileImg 
 */

// User 모델 정의 
const User = {
    /**
     * 사용자 회원가입 
     * @param {User} user
     * @returns {Promise<User>}
     * @description createdAt은 DB에서 자동으로 기록, password는 BCrypt 해싱된 값 
     */
    create: async ({ email, password, nickname, profileImg }) => {
        const query = `
            INSERT INTO MEMBER (email, password, nickname, profileImg)
            VALUES (?, ?, ?, ?)
        `
        const [result] = await pool.execute(query, [email, password, nickname, profileImg])
        return result
    },

    /**
     * 이메일로 사용자 검색 
     * @param {string} email
     * @return {User}
     */
    findByEmail: async (email) => {
        const query = `SELECT * FROM MEMBER WHERE email = ?`
        const [rows] = await pool.execute(query, [email])
        return rows[0]
    }
}

module.exports = User