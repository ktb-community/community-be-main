const bcrypt = require("bcrypt");
const fs = require("fs");
const User = require("../models/user");
const logger = require("../config/logger");
const pool = require("../config/db");
const { generateToken, sendJSONResponse, dateTimeFormat } = require("../utils/utils");
const { ResStatus } = require("../utils/const");
const {
	AuthFieldException,
	AuthEmailDuplicationException,
	InvalidCredentialsException,
} = require("../exception/AuthException");

const signup = async (req, res) => {
	const profileImg = req.file;
	const { email, password, nickname } = req.body;
	const connection = await pool.getConnection();

	try {
		// 트랜잭션 시작
		await connection.beginTransaction();

		// 1. 필수 값 확인
		if (!(email && password && nickname && profileImg)) {
			throw new AuthFieldException();
		}

		// 2. 이메일 중복 확인
		const existingUser = await User.findByEmail(connection, { email });
		if (existingUser) {
			throw new AuthEmailDuplicationException();
		}

		// 3. 비밀번호 해싱
		const hashedPassword = await bcrypt.hash(password, 10);

		// 4. 사용자 생성
		await User.create(connection, {
			email,
			password: hashedPassword,
			nickname,
			profileImg: profileImg.path,
		});

		// 트랜잭션 커밋 & 201 반환
		await connection.commit();
		sendJSONResponse(res, 201, ResStatus.SUCCESS, "회원가입이 성공적으로 완료되었습니다.");
	} catch (err) {
		// 트랜잭션 롤백, 로깅, 에러 반환
		await connection.rollback();

		if (err instanceof AuthFieldException) {
			logger.error(err.message);
			sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
		} else if (err instanceof AuthEmailDuplicationException) {
			logger.error(err.message);
			sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
		} else {
			logger.error(err);
			sendJSONResponse(res, 500, ResStatus.ERROR, "예상치못한 에러가 발생했습니다.");
		}

		/* 업로드된 파일 삭제 */
		if (fs.existsSync(profileImg.path)) {
			fs.rmSync(profileImg.path);
			logger.info(`이미지 삭제: ${profileImg.path}`);
		}
	} finally {
		// 커넥션 반환
		connection.release();
	}
};

const login = async (req, res) => {
	const { email, password } = req.body;
	const connection = await pool.getConnection();

	try {
		// 트랜잭션 시작
		await connection.beginTransaction();

		// 요청 값 검증
		if (!email || !password) {
			throw AuthFieldException();
		}

		// 1. email 확인
		const existingUser = await User.findByEmail(connection, { email });
		if (!existingUser) {
			throw InvalidCredentialsException("가입되지 않은 이메일입니다.");
		}

		// 2. password 일치 확인
		const passwordMatch = await bcrypt.compare(password, existingUser.password);
		if (!passwordMatch) {
			throw InvalidCredentialsException("비밀번호가 일치하지 않습니다.");
		}

		/* email, password가 일치하는 경우 */
		const nickname = existingUser.nickname;

		// 1. JWT 토큰 발급 (access-token, refresh-token)
		const accessToken = generateToken(email, nickname);
		const refreshToken = generateToken(email, nickname);

		// 2. DB 업데이트
		const userId = existingUser.userId;
		const profileImg = existingUser.profileImg;
		const lastLoginDate = dateTimeFormat(new Date(Date.now()));

		await User.login(connection, {
			userId,
			refreshToken,
			lastLoginDate,
		});
		await connection.commit();

		// 3. 정상 응답
		const data = { email, nickname, userId, profileImg, lastLoginDate, accessToken, refreshToken };
		sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그인에 성공하였습니다.", data);
	} catch (err) {
		await connection.rollback();

		if (err instanceof AuthFieldException) {
			logger.error(err.message);
			sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
		} else if (err instanceof InvalidCredentialsException) {
			logger.error(err.message);
			sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
		} else {
			logger.error(err);
			sendJSONResponse(res, 500, ResStatus.ERROR, "예상치못한 에러가 발생했습니다.");
		}
	} finally {
		connection.release();
	}
};

module.exports = {
	signup,
	login,
};
