const { sendJSONResponse, dateTimeFormat } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

module.exports = {
	authLogin: async (req, res) => {
		const { email, password } = req.body;
		const user = User.findByEmail(email);

		if (!user) {
			return sendJSONResponse(res, 400, ResStatus.EMAIL_NOT_FOUND, "가입되지 않은 계정입니다.");
		}

		if (!await bcrypt.compare(password, user.password)) {
			return sendJSONResponse(res, 400, ResStatus.PASSWORD_NOT_MATCH, "비밀번호가 일치하지 않습니다.");
		}

		const dateNow = dateTimeFormat(new Date(Date.now()));
		const editUser = { ...user, lastLoginDate: dateNow };
		User.modify(editUser);

		/* 세션에 사용자 데이터 저장 */
		req.session.isAuthenticated = true;
		req.session.lastActivity = dateNow;
		req.session.user = {
			id: user.id,
			nickname: user.nickname,
			role: 'user'
		}

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그인이 성공적으로 완료되었습니다.", {
			id: user.id,
			email: user.email,
			nickname: user.nickname,
			profile: user.profileImg,
			lastLoginDate: dateTimeFormat(new Date(Date.now())),
		});
	},

	authLogout: (req, res) => {
		req.session.destroy(err => {
			if (err) {
				console.error(err);
				return sendJSONResponse(res, 500, ResStatus.ERROR, "로그아웃 중 오류가 발생했습니다.");
			}
			res.clearCookie('connect.sid'); // 세션 쿠키 제거
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그아웃이 성공적으로 완료되었습니다.");
		})
	},

	authSignup: async (req, res) => {
		const { email, password, nickname } = req.body;
		const file = req.file;
		const profileImg = file.path.replace(/\\/g, '/');

		if (User.findByEmail(email)) {
			return sendJSONResponse(res, 400, ResStatus.EMAIL_DUPLICATED, "이미 사용중인 이메일입니다.");
		}

		if (User.findByNickname(nickname)) {
			return sendJSONResponse(res, 400, ResStatus.NICKNAME_DUPLICATED, "이미 사용중인 닉네임입니다.");
		}

		const user = {
			email,
			password: await bcrypt.hash(password, 10),
			nickname,
			profileImg,
			createdAt: dateTimeFormat(new Date(Date.now())),
			modifiedAt: dateTimeFormat(new Date(Date.now())),
			lastLoginDate: null,
		}

		User.save(user)
		return sendJSONResponse(res, 201, ResStatus.SUCCESS, "회원가입이 성공적으로 완료되었습니다.");
	}
}