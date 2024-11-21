const bcrypt = require("bcrypt");
const User = require("../models/user");
const logger = require("../config/logger");
const { generateToken, dateTimeFormat } = require("../utils/utils");
const {
	RequestArgumentException,
	EmailDuplicationException,
	InvalidCredentialsException,
	UserNotFoundException,
} = require("../exception/CustomException");

class AuthService {
	constructor(pool) {
		this.pool = pool;
	}

	async signup(email, password, nickname, profileImg) {
		const transaction = await this.pool.getConnection();

		try {
			await transaction.beginTransaction();

			// 1. 요청 값 검증
			if (!email || !password || !nickname || !profileImg) {
				throw new RequestArgumentException();
			}

			// 2. 이메일 중복 확인
			const existingUser = await User.findByEmail(transaction, { email });
			if (existingUser) {
				throw new EmailDuplicationException();
			}

			// 3. 비밀번호 해싱
			const hashedPassword = await bcrypt.hash(password, 10);

			// 4. 사용자 생성
			await User.create(transaction, {
				email,
				password: hashedPassword,
				nickname,
				profileImg: profileImg.filename,
			});

			await transaction.commit();
		} catch (err) {
			logger.error(err);
			await transaction.rollback();
			throw err; // 라우터로 예외 전파
		} finally {
			transaction.release();
		}
	}

	async login(email, password) {
		const transaction = await this.pool.getConnection();

		try {
			await transaction.beginTransaction();

			// 1. 요청 값 검증
			if (!email || !password) {
				throw new RequestArgumentException();
			}

			// 2. email 확인
			const existingUser = await User.findByEmail(transaction, { email });
			if (!existingUser) {
				throw new InvalidCredentialsException("가입되지 않은 이메일입니다.");
			}

			// 3. password 일치 확인
			const passwordMatch = await bcrypt.compare(password, existingUser.password);
			if (!passwordMatch) {
				throw new InvalidCredentialsException("비밀번호가 일치하지 않습니다.");
			}

			/* email, password가 일치하는 경우 */
			const nickname = existingUser.nickname;

			// 1. JWT 토큰 발급 (access-token, refresh-token)
			const accessToken = generateToken(email, nickname);
			const refreshToken = generateToken(email, nickname);

			// 2. DB 업데이트
			const userId = existingUser.userId;
			const role = existingUser.role;
			const profileImg = existingUser.profileImg;
			const lastLoginDate = dateTimeFormat(new Date(Date.now()));

			await User.login(transaction, {
				userId,
				refreshToken,
				lastLoginDate,
			});

			// 3. 트랜잭션 커밋
			await transaction.commit();

			return { role, email, nickname, userId, profileImg, lastLoginDate, accessToken, refreshToken };
		} catch (err) {
			logger.error(err);
			await transaction.rollback();
			throw err; // 라우터로 예외 전파
		} finally {
			transaction.release();
		}
	}

	async logout(userId, refreshToken) {
		const transaction = await this.pool.getConnection();

		try {
			await transaction.beginTransaction();

			// 1. 요청 값 검증
			if (!userId || !refreshToken) {
				throw new RequestArgumentException();
			}

			// 2. 유저 찾아오기
			const existingUser = await User.findById(transaction, { userId });
			if (!existingUser) {
				throw new UserNotFoundException();
			}

			// 3. 토큰값 비교
			if (refreshToken !== existingUser.refreshToken) {
				throw new InvalidCredentialsException();
			}

			/* 유효한 로그아웃 요청 */

			// 1. refreshToken 무효화
			await User.logout(transaction, { userId });
			await transaction.commit();
		} catch (err) {
			logger.error(err);
			await transaction.rollback();
			throw err; // 라우터로 예외 전파
		} finally {
			transaction.release();
		}
	}
}

module.exports = AuthService;
