/*
[schema]
CREATE TABLE IF NOT EXISTS BOARD (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    boardImg VARCHAR(512),
    views INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    writerId INT NOT NULL,
    FOREIGN KEY (writerId) REFERENCES USERS(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

const logger = require("../config/logger");
const { DatabaseConnectionException } = require("../exception/CustomException");

class Board {
	async findById(connection, { boardId }) {
		const query = `SELECT * FROM BOARD WHERE id = ?`;

		try {
			const [rows] = await connection.query(query, [boardId]);
			return rows[0] || null;
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	async deleteById(connection, { boardId }) {
		const query = `DELETE FROM BOARD WHERE id = ?`;

		try {
			await connection.query(query, [boardId]);
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	async updateBoard(connection, { boardId, boardTitle, boardContent, boardImg }) {
		const query = `
			UPDATE BOARD
			SET title = ?, content = ?, boardImg = ?
			WHERE id = ?
		`;

		try {
			await connection.execute(query, [boardTitle, boardContent, boardImg, boardId]);
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	async getLatestBoardList(connection, { limit, offset }) {
		const query = `
			SELECT
				B.id,
				B.title,
				B.createdAt,
				B.views,
				U.nickname,
				U.profileImg,
				(SELECT COUNT(*) FROM BOARD_LIKE BL WHERE BL.boardId = B.id) AS likeCnt,
				(SELECT COUNT(*) FROM BOARD_COMMENT BC WHERE BC.boardId = B.id) AS commentCnt
			FROM BOARD B
			INNER JOIN USERS U
			ON B.writerId = U.id
			ORDER BY B.createdAt, B.id DESC
			LIMIT ? OFFSET ?;
		`;

		try {
			const [result] = await connection.execute(query, [limit, offset])
			return result;
		} catch(err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	async getBoard(connection, { boardId }) {
		const query = `
			SELECT
				B.title,
				B.createdAt,
				B.boardImg,
				B.content,
				B.views,
				B.writerId,
				U.nickname,
				U.profileImg,
				(SELECT COUNT(*) FROM BOARD_LIKE BL WHERE BL.boardId = B.id) AS likeCnt,
				(SELECT COUNT(*) FROM BOARD_COMMENT BC WHERE BC.boardId = B.id) AS commentCnt
			FROM BOARD B
			INNER JOIN USERS U
			ON B.writerId = U.id
			WHERE B.id = ?;
		`;

		try {
			const [result] = await connection.execute(query, [boardId]);
			return result;
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	async addBoard(connection, { title, content, boardImg, writerId }) {
		const query = `
			INSERT INTO BOARD(title, content, boardImg, writerId)
			VALUES (?, ?, ?, ?)
		`;

		try {
			await connection.execute(query, [title, content, boardImg, writerId]);
		} catch (err) {
			logger.error(err);
			throw err;
		}
	}

	async countBoardView(connection, { boardId }) {
		const query = `
			UPDATE BOARD
			SET views = views + 1
			WHERE id = ?
		`;

		try {
			await connection.execute(query, [boardId]);
		} catch (err) {
			logger.error(err);
			throw err;
		}
	}
}

module.exports = Board;
