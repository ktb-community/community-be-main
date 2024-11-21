const bcrypt = require("bcrypt");
const fs = require("fs");
const User = require("../models/user");
const logger = require("../config/logger");
const pool = require("../config/db");
const { generateToken, sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");
const { AuthFieldException, AuthEmailDuplicationException } = require("../exception/AuthException");

const signup = async (req, res) => {
	const profileImg = req.file;
	const { email, password, nickname } = req.body;
	const connection = await pool.getConnection();

	try {
		// 트랜잭션 시작
		await connection.beginTransaction();

		// 1. 필수 값 확인
		if (!(email && password && nickname && profileImg)) {
			throw new AuthFieldException("모든 필드를 입력해주세요.", 400);
		}

		// 2. 이메일 중복 확인
		const existingUser = await User.findByEmail(connection, { email });
		if (existingUser) {
			throw new AuthEmailDuplicationException("이미 사용중인 이메일입니다.", 400);
		}

		// 3. 비밀번호 해싱
		const hashedPassword = await bcrypt.hash(password, 10);

		// 4. 사용자 생성
		const newUser = await User.create(connection, {
			email,
			password: hashedPassword,
			nickname,
			profileImg: profileImg.path,
		});

		// 트랜잭션 커밋
		await connection.commit();

		// 5. 성공 응답
		const data = { userId: newUser.insertId };
		sendJSONResponse(res, 201, ResStatus.SUCCESS, "회원가입이 성공적으로 완료되었습니다.", data);
	} catch (err) {
		// 트랜잭션 롤백, 로깅, 에러 반환
		await connection.rollback();
		logger.error(err);

		if (err instanceof AuthFieldException) {
			sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
		} else if (err instanceof AuthEmailDuplicationException) {
			sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
		} else {
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
			return res.status(400).json({ message: "모든 필드를 포함해야합니다." });
		}

		// 1. email 확인
		const existingUser = User.findByEmail(email);
		if (!existingUser) {
			return res.status(400).json({ message: "가입되지 않은 이메일입니다." });
		}

		// 2. password 일치 확인
		const passwordMatch = await bcrypt.compare(password, existingUser.password);
		if (!passwordMatch) {
			return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
		}

		/* email, password가 일치하는 경우 */
		const nickname = existingUser.nickname;

		// 1. JWT 토큰 발급 (access-token, refresh-token)
		const accessToken = generateToken(email, nickname);
		const refreshToken = generateToken(email, nickname);

		// 2. DB 업데이트
		User.login(refreshToken, new Date());
		await connection.commit();

		return res.status(200).json({
			message: "로그인에 성공하였습니다.",
			accessToken,
			refreshToken,
		});
	} catch (err) {
		await connection.rollback();
		logger.error(err);
		return res.status(500).json({ message: "서버 오류가 발생하였습니다." });
	} finally {
		connection.release();
	}
};

module.exports = {
	signup,
	login,
};
