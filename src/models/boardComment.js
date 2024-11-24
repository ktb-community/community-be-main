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

const logger = require("../config/logger")
const { DatabaseConnectionException } = require("../exception/CustomException");

class BoardComment {
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
}

module.exports = BoardComment;