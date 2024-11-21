/* authController에서 사용하는 커스텀 에러 클래스 모음
 * 구분을 위해 앞에 접두사 Auth-를 붙인다.
 */

// 요청 필수값이 누락된 경우 발생
class AuthFieldException extends Error {
	constructor(message, statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
	}
}

// 이메일이 중복된 경우 발생
class AuthEmailDuplicationException extends Error {
	constructor(message, statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
	}
}

module.exports = {
	AuthFieldException,
	AuthEmailDuplicationException,
};
