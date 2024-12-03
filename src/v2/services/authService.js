const bcrypt = require("bcrypt");
const process = require("process");
const { JWTExpire } = require("../../utils/const");
const { generateToken, dateTimeFormat, withTransaction, checkArguments, checkPassword, verifyToken } = require("../../utils/utils");
const {
	RequestArgumentException,
	DuplicationException,
	InvalidCredentialsException,
	UserNotFoundException,
} = require("../../exception/CustomException");

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;

class AuthService {
	/**
	 * @param {User} userModel
	 */
	constructor(userModel) {
		this.userModel = userModel;
	}

	async signup(email, password, nickname, profileImg) {
		return await withTransaction(async transaction => {
			// 1. 요청 값 검증
			if (!checkArguments(email, password, nickname, profileImg)) {
				throw new RequestArgumentException();
			}

			// 2. 이메일 & 패스워드 형식 검사
			if (!checkPassword(password) || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
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
			const payload = { email, nickname, role, userId };
			const accessToken = generateToken(payload, ACCESS_TOKEN_SECRET_KEY, JWTExpire.ACCESS_TOKEN);
			const refreshToken = generateToken(payload, REFRESH_TOKEN_SECRET_KEY, JWTExpire.REFRESH_TOKEN);

			await this.userModel.login(transaction, {
				userId,
				refreshToken,
				lastLoginDate,
			});

			return { email, nickname, userId, profileImg, lastLoginDate, accessToken, refreshToken, role };
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

	async refresh(userId, refreshToken) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(userId, refreshToken)) {
				throw new RequestArgumentException();
			}

			// 2. 리프레시 토큰 검증
			try {
				await verifyToken(refreshToken, REFRESH_TOKEN_SECRET_KEY);
			}
			catch (err) {
				console.error(err);
				throw new RequestArgumentException("리프레시 토큰을 검증할 수 없습니다.");
			}

			// 3. 유저 찾아오기
			const user = await this.userModel.findById(transaction, { userId });
			if (!user) {
				throw new InvalidCredentialsException("토큰 정보를 확인할 수 없습니다.");
			}

			// 4. DB랑 토큰 일치 여부 확인
			if (user.refreshToken !== refreshToken) {
				throw new InvalidCredentialsException("리프레시 토큰 정보가 다릅니다.");
			}

			// 2. 토큰 발급
			const payload = { email: user.email, nickname: user.nickname, role: user.role, userId: user.id };
			const newAccessToken = generateToken(payload, ACCESS_TOKEN_SECRET_KEY, JWTExpire.ACCESS_TOKEN);
			const newRefreshToken = generateToken(payload, REFRESH_TOKEN_SECRET_KEY, JWTExpire.REFRESH_TOKEN);

			// 3. DB 업데이트
			await this.userModel.patchRefreshToken(transaction, { userId, refreshToken: newRefreshToken });

			return { accessToken: newAccessToken, refreshToken: newRefreshToken };
		})
	}
}

module.exports = AuthService;
