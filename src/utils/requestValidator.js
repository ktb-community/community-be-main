class RequestValidator {
	/* 가변 인자를 받아서 null이나 undefined가 있는지 검사 */
	static checkArguments(...args) {
		return args.every(arg => arg !== null && arg !== undefined);
	}

	/* 이메일 형식 검사 */
	static checkEmail(email) {
		return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
	}

	/* 닉네임 형식 검사 */
	static checkNickname(nickname) {
		return nickname.length > 0 && nickname.length <= 10 && !nickname.includes(" ");
	}

	/* 비밀번호 형식 검사 */
	static checkPassword(password) {
		return password.length >= 8 &&
			password.length <= 20 &&
			/[A-Z]/.test(password) &&
			/[a-z]/.test(password) &&
			/[0-9]/.test(password) &&
			/[!@#$%^&*]/.test(password);
	}

	/* 게시글 제목 길이 검사 */
	static checkBoardTitle(title) {
		return title.length > 0 && title.length <= 26;
	}

	/* 게시글 본문 형식 검사 */
	static checkBoardContent(content) {
		return content.length > 0;
	}

	/* 댓글 검사 */
	static checkBoardComment(comment) {
		return comment.length > 0;
	}
}

module.exports = RequestValidator;