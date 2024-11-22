/* 커스텀 예외 클래스 모음 */

// 요청 필수값이 누락된 경우 발생
class RequestArgumentException extends Error {
	constructor(message = "모든 필드를 입력해주세요.", statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
	}
}

// 유니크 컬럼에 중복된 값이 생성될 때 발생 (이메일, 닉네임)
class DuplicationException extends Error {
	constructor(message = "이미 사용중인 값입니다.", statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
	}
}

// 자격증명이 잘못된 경우 발생
class InvalidCredentialsException extends Error {
	constructor(message = "잘못된 계정 정보입니다.", statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
	}
}

// 유저를 찾을 수 없을 때 발생 (이메일이나, id로 찾은 경우)
class UserNotFoundException extends Error {
	constructor(message = "유저를 찾을 수 없습니다.", statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
	}
}

// DB 커넥션 장애시 발생
class DatabaseConnectionException extends Error {
	constructor(message = "데이터베이스 연결이 지연되거나 응답하지 않습니다.", statusCode = 500) {
		super(message);
		this.statusCode = statusCode;
	}
}

module.exports = {
	RequestArgumentException,
	DuplicationException,
	InvalidCredentialsException,
	UserNotFoundException,
	DatabaseConnectionException,
};
