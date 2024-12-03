const { checkArguments, withTransaction, checkPassword } = require("../../utils/utils");
const { RequestArgumentException } = require("../../exception/CustomException");
const bcrypt = require("bcrypt");

class UserService {
	/**
	 * @param {User} userModel
	 */
	constructor(userModel) {
		this.userModel = userModel;
	}

	async modifyNickname(userId, currNickname, nextNickname) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(userId, currNickname, nextNickname)) {
				throw new RequestArgumentException();
			}

			// 2. 유저 검증
			const existingUser = await this.userModel.findById(transaction, { userId })
			if (!existingUser || existingUser.nickname !== currNickname) {
				throw new RequestArgumentException("잘못된 유저 아이디 혹은 닉네임입니다.");
			}

			// 3. 닉네임 중복 검사
			const dupUser = await this.userModel.findByNickname(transaction, { nickname: nextNickname })
			if (dupUser) {
				throw new RequestArgumentException("이미 사용중인 닉네임입니다.");
			}

			// 닉네임 변경
			await this.userModel.patchNickname(transaction, { userId, nickname: nextNickname });

			return { nickname: currNickname }
		})
	}

	async modifyPassword(userId, claims, currentPassword, nextPassword) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(userId, claims, currentPassword, nextPassword)) {
				throw new RequestArgumentException();
			}

			// 2. 현재 유저 비밀번호가 일치하는지 검사
			const existingUser = await this.userModel.findById(transaction, { userId });
			if (!existingUser || !(await bcrypt.compare(currentPassword, existingUser.password))) {
				throw new RequestArgumentException("비밀번호가 다릅니다.");
			}

			// 3. 새 비밀번호 형식 검사
			if (!checkPassword(nextPassword)) {
				throw new RequestArgumentException("비밀번호 형식이 맞지 않습니다.");
			}

			// 비밀번호 수정
			const newHashedPassword = await bcrypt.hash(nextPassword, 10);
			await this.userModel.patchPassword(transaction, { userId, password: newHashedPassword })
		})
	}
}

module.exports = UserService;