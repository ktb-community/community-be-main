/*
[Schema]
CREATE TABLE IF NOT EXISTS BOARD_COMMENT (
    id INT PRIMARY KEY AUTO_INCREMENT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment VARCHAR(512) NOT NULL,
    boardId INT NOT NULL,
    writerId INT,
    FOREIGN KEY (boardId) REFERENCES BOARD(id) ON DELETE CASCADE,
    FOREIGN KEY (writerId) REFERENCES USERS(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 */

const logger = require("../../config/logger")
const { DatabaseConnectionException } = require("../../exception/CustomException");

class BoardComment {
	async findById(connection, { commentId }) {
		const query = `SELECT * FROM BOARD_COMMENT WHERE id = ?`;

		try {
			const [rows] = await connection.query(query, [commentId]);
			return rows[0] || null;
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	async deleteById(connection, { commentId }) {
		const query = `DELETE FROM BOARD_COMMENT WHERE id = ?`;

		try {
			await connection.query(query, [commentId]);
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}

	async addBoardComment(connection, { boardId, writerId, boardComment }) {
		const query = `
			INSERT INTO BOARD_COMMENT(comment, boardId, writerId)
			VALUES (?, ?, ?)
		`;

		try {
			connection.execute(query, [boardComment, boardId, writerId]);
		} catch (err) {
			logger.error(err)
			throw new DatabaseConnectionException();
		}
	}

	async getBoardComments(connection, { boardId, limit, offset }) {
		const query = `
			SELECT
				U.nickname,
				U.profileImg,
				BC.id,
				BC.comment,
				BC.createdAt,
				BC.writerId
			FROM BOARD_COMMENT BC
			INNER JOIN USERS U
			ON BC.writerId = U.id
			WHERE BC.boardId = ?
			ORDER BY BC.createdAt DESC
			LIMIT ? OFFSET ?;
		`;

		try {
			const [result] = await connection.execute(query, [boardId, limit, offset]);
			return result
		} catch (err) {
			logger.error(err);
			throw new DatabaseConnectionException();
		}
	}
}

module.exports = BoardComment;