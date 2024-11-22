const bcrypt = require("bcrypt");
const process = require("process");
const User = require("../models/user");
const { generateToken, dateTimeFormat, withTransaction, checkArguments } = require("../utils/utils");
const {
	RequestArgumentException,
	DuplicationException,
	InvalidCredentialsException,
	UserNotFoundException,
} = require("../exception/CustomException");

class AuthService {
	constructor() {
		this.userModel = new User();
	}

	async signup(email, password, nickname, profileImg) {
		return await withTransaction(async transaction => {
			// 1. 요청 값 검증
			if (!checkArguments(email, password, nickname, profileImg)) {
				throw new RequestArgumentException();
			}

			// 2. 이메일 & 패스워드 형식 검사
			if (
				!(
					/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) &&
					password.length >= 8 &&
					password.length <= 20 &&
					/[A-Z]/.test(password) &&
					/[a-z]/.test(password) &&
					/[0-9]/.test(password) &&
					/[!@#$%^&*]/.test(password)
				)
			) {
				throw new RequestArgumentException("이메일 및 패스워드 형식이 맞지 않습니다.");
			}

			// 3. 중복 확인
			if (
				(await this.userModel.findByEmail(transaction, { email })) ||
				(await this.userModel.findByNickname(transaction, { nickname }))
			) {
				throw new DuplicationException("이미 사용중인 이메일 또는 닉네임입니다.");
			}

			// 4. 비밀번호 해싱
			const hashedPassword = await bcrypt.hash(password, 10);

			// 5. 사용자 생성
			return await this.userModel.create(transaction, {
				email,
				password: hashedPassword,
				nickname,
				profileImg: `${process.env.SERVER_URL}/uploads/${profileImg.filename}`,
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
			const existingUser = await this.userModel.findByEmail(transaction, { email });
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
			const userId = existingUser.id;
			const role = existingUser.role;
			const profileImg = existingUser.profileImg;
			const lastLoginDate = dateTimeFormat(new Date(Date.now()));

			// 2. JWT 토큰 발급 (access-token, refresh-token)
			const accessToken = generateToken(email, nickname, role);
			const refreshToken = generateToken(email, nickname, role);

			await this.userModel.login(transaction, {
				userId,
				refreshToken,
				lastLoginDate,
			});

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
			const existingUser = await this.userModel.findById(transaction, { userId });
			if (!existingUser) {
				throw new UserNotFoundException();
			}

			// 3. 토큰값 비교
			if (refreshToken !== existingUser.refreshToken) {
				throw new InvalidCredentialsException();
			}

			// refreshToken 무효화
			return await this.userModel.logout(transaction, { userId });
		});
	}
}

module.exports = AuthService;
