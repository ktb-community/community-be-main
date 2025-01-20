class Board {
	static async findBoards(conn, { limit, offset }) {
		const query = `
			SELECT
				B.id,
				B.title,
				B.createdAt,
				B.views,
				U.nickname,
				U.profileImg,
				(SELECT COUNT(*) FROM BOARD_LIKE BL WHERE BL.boardId = B.id) AS likes,
				(SELECT COUNT(*) FROM BOARD_COMMENT BC WHERE BC.boardId = B.id AND NOT BC.disabled) AS comments
			FROM BOARD AS B
			INNER JOIN USERS AS U
			ON B.writerId = U.id
			WHERE NOT B.disabled
			ORDER BY id DESC
			LIMIT ? OFFSET ?
		`;

		const [boards] = await conn.execute(query, [limit.toString(), offset.toString()]);
		return boards;
	}

	static async findBoardDetail(conn, { id }) {
		const query = `
			SELECT
				B.id AS boardId,
				B.title,
				B.content,
				B.createdAt,
				B.boardImg,
				B.contentType,
				B.views,
				U.id AS writerId,
				U.nickname,
				U.profileImg,
				(SELECT COUNT(*) FROM BOARD_LIKE BL WHERE BL.boardId = B.id) AS likes,
				(SELECT COUNT(*) FROM BOARD_COMMENT BC WHERE BC.boardId = B.id AND NOT BC.disabled) AS comments
			FROM BOARD AS B
			INNER JOIN USERS AS U
			ON B.writerId = U.id
			WHERE B.id = ? AND NOT B.disabled
		`;

		const [boardDetail] = await conn.execute(query, [id]);
		return boardDetail[0] || null;
	}

	static async findById(conn, { id }) {
		const query = `SELECT * FROM BOARD WHERE id = ?`;
		const [board] = await conn.execute(query, [id]);
		return board[0] || null;
	}

	static async updateViewCount(conn, { id }) {
		const query = `UPDATE BOARD SET views = views + 1 WHERE id = ?`;
		await conn.execute(query, [id]);
	}

	static async updateBoard(conn, { board }) {
		const query = `
			UPDATE BOARD
			SET 
				title = ?, 
				content = ?, 
				boardImg = ?
			WHERE id = ?
		`;
		await conn.execute(query, [board.title, board.content, board.boardImg, board.id]);
	}

	static async save(conn, { board }) {
		const query = `
			INSERT INTO BOARD(title, content, boardImg, writerId, contentType)
			VALUES (?, ?, ?, ?, ?)
		`;
		await conn.execute(query, [board.title, board.content, board.boardImg, board.writerId, board.type]);
	}

	static async deleteById(conn, { id }) {
		const query = `
			UPDATE BOARD
			SET disabled = TRUE
			WHERE id = ?
		`;

		await conn.execute(query, [id]);
	}
}

module.exports = Board;