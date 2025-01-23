class BoardLike {
	static async findByBoardIdAndUserId(conn, { boardId, userId }) {
		const query = `SELECT * FROM BOARD_LIKE WHERE boardId = ? AND likerId = ?`;
		const [result] = await conn.execute(query, [boardId, userId]);
		return result[0] || null;
	}

	static async deleteByBoardIdAndUserId(conn, { boardId, userId }) {
		const query = `DELETE FROM BOARD_LIKE WHERE boardId = ? AND likerId = ?`;
		await conn.execute(query, [boardId, userId]);
	}

	static async save(conn, { boardId, userId }) {
		const query = `INSERT INTO BOARD_LIKE(boardId, likerId) VALUES(?, ?)`;
		await conn.execute(query, [boardId, userId]);
	}

	static async countCurrentBoardLike(conn, { boardId }) {
		const query = `SELECT COUNT(*) AS count FROM BOARD_LIKE WHERE boardId = ?`;
		const [result] = await conn.execute(query, [boardId]);
		return result[0] || null;
	}
}

module.exports = BoardLike