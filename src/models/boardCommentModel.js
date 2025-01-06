class BoardComment {
	static async findById(conn, { id }) {
		const query = `SELECT * FROM BOARD_COMMENT WHERE id = ?`;
		const [result] = await conn.execute(query, [id]);
		return result[0] || null;
	}

	static async findBoardComment(conn, { id }) {
		const query = `
			SELECT
				BC.id,
				BC.createdAt,
				BC.comment AS content,
				U.id AS writerId,
				U.nickname,
				U.profileImg
			FROM BOARD_COMMENT BC
			INNER JOIN USERS U
			ON BC.writerId = U.id
			WHERE BC.id = ?
		`;

		const [result] = await conn.execute(query, [id]);
		return result[0] || null;
	}

	static async findBoardComments(conn, { id }) {
		const query = `
			SELECT 
				BC.id AS commentId,
				BC.comment AS content,
				BC.createdAt,
				U.id AS writerId,
				U.nickname,
				U.profileImg
			FROM BOARD_COMMENT BC
			INNER JOIN USERS U
			ON BC.writerId = U.id
			WHERE BC.boardId = ?
			ORDER BY BC.createdAt DESC
		`;

		const [boardComments] = await conn.execute(query, [id]);
		return boardComments;
	}

	static async updateBoardComment(conn, { id, comment }) {
		const query = `
			UPDATE BOARD_COMMENT
			SET comment = ?
			WHERE id = ?
		`;

		await conn.execute(query, [comment, id]);
	}

	static async save(conn, { boardComment }) {
		const query = `
			INSERT INTO BOARD_COMMENT(comment, writerId, boardId)
			VALUES(?, ?, ?)
		`;

		const [result] = await conn.execute(query, [boardComment.comment, boardComment.writerId, boardComment.boardId]);
		return result.insertId;
	}

	static async deleteById(conn, { id }) {
		const query = `DELETE FROM BOARD_COMMENT WHERE id = ?`;
		await conn.execute(query, [id]);
	}
}

module.exports = BoardComment;