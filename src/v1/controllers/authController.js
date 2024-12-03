const path = require("path");
const { sendJSONResponse, dateTimeFormat } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");
const User = require("../models/userModel");

const authLogin = async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findByEmail(email);

	if (!user) {
		return sendJSONResponse(res, 400, ResStatus.EMAIL_NOT_FOUND, "가입되지 않은 계정입니다.");
	}

	else if (user.password !== password) {
		return sendJSONResponse(res, 400, ResStatus.PASSWORD_NOT_MATCH, "비밀번호가 일치하지 않습니다.");
	}

	const resData = {
		id: user.id,
		email: user.email,
		nickname: user.nickname,
		profile: user.profileImg,
		lastLoginDate: user.lastLoginDate
	}

	return sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그인이 성공적으로 완료되었습니다.", resData);
}

const authSignup = async (req, res) => {
	const { email, password, nickname } = req.body;
	const file = req.file;
	const profileImg = path.join('http://localhost:8000', file.path);

	if (await User.findByEmail(email)) {
		return sendJSONResponse(res, 400, ResStatus.EMAIL_DUPLICATED, "이미 사용중인 이메일입니다.");
	}

	if (await User.findByNickname(nickname)) {
		return sendJSONResponse(res, 400, ResStatus.NICKNAME_DUPLICATED, "이미 사용중인 닉네임입니다.");
	}

	const user = {
		email,
		password,
		nickname,
		profileImg,
		createdAt: dateTimeFormat(new Date(Date.now())),
		lastLoginDate: null,
	}

	await User.save(user)
	return sendJSONResponse(res, 201, ResStatus.SUCCESS, "회원가입이 성공적으로 완료되었습니다.");
}

module.exports = {
	authLogin,
	authSignup
}