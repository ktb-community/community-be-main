const bcrypt = require("bcrypt");
const User = require("../models/user");
const { generateToken, dateTimeFormat, withTransaction, checkArguments } = require("../utils/utils");
const {
	RequestArgumentException,
	EmailDuplicationException,
	InvalidCredentialsException,
	UserNotFoundException,
} = require("../exception/CustomException");

class AuthService {
	async signup(email, password, nickname, profileImg) {
		return await withTransaction(async transaction => {
			// TODO: 이메일, 패스워드 형식 검사

			// 1. 요청 값 검증
			if (!checkArguments(email, password, nickname, profileImg)) {
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
		});
	}

	async login(email, password) {
		return await withTransaction(async transaction => {
			// 1. 요청 값 검증
			if (!checkArguments(email, password)) {
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

			// 1. DB 업데이트
			const nickname = existingUser.nickname;
			const userId = existingUser.userId;
			const role = existingUser.role;
			const profileImg = existingUser.profileImg;
			const lastLoginDate = dateTimeFormat(new Date(Date.now()));

			await User.login(transaction, {
				userId,
				refreshToken,
				lastLoginDate,
			});

			// 2. JWT 토큰 발급 (access-token, refresh-token)
			const accessToken = generateToken(email, nickname);
			const refreshToken = generateToken(email, nickname);

			return { role, email, nickname, userId, profileImg, lastLoginDate, accessToken, refreshToken };
		});
	}

	async logout(userId, refreshToken) {
		return await withTransaction(async transaction => {
			// 1. 요청 값 검증
			if (!checkArguments(userId, refreshToken)) {
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
		});
	}
}

module.exports = AuthService;
