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

CREATE TABLE IF NOT EXISTS BOARD_LIKE (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boardId INT NOT NULL,
    likerId INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boardId) REFERENCES BOARD(id) ON DELETE CASCADE,
    FOREIGN KEY (likerId) REFERENCES USERS(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS BOARD_COMMENT (
    id INT PRIMARY KEY AUTO_INCREMENT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    boardId INT NOT NULL,
    writerId INT,
    FOREIGN KEY (boardId) REFERENCES BOARD(id) ON DELETE CASCADE,
    FOREIGN KEY (writerId) REFERENCES USERS(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

const logger = require("../config/logger");
const { DatabaseConnectionException } = require("../exception/CustomException");

class Board {

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

	async getBoardComments(connection, { boardId, limit, offset }) {
		const query = `
			SELECT
				U.nickname,
				U.profileImg,
				BC.comment,
				BC.createdAt
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

module.exports = Board;
