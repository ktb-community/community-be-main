const User = require("../models/user")
const bcrypt = require("bcrypt")
const logger = require("../config/logger")

const signupUser = async (req, res) => {
	const { email, password, nickname, profileImg } = req.body

	try {
		// 1. 필수 값 확인 
		if (!email || !password || !nickname || !profileImg) {
			return res.status(400).json({ message: "모든 필드를 입력해주세요." })
		}

		// 2. 이메일 중복 확인 
		const existingUser = await User.findByEmail(email)
		if (existingUser) {
			return res.status(400).json({ message: "이미 사용중인 이메일입니다." })
		}

		// 3. 비밀번호 해싱 
		const hashedPassword = await bcrypt.hash(password, 10)

		// 4. 사용자 생성 
		const newUser = await User.create({
			email,
			password: hashedPassword,
			nickname,
			profileImg
		});

		// 5. 성공 응답
		return res.status(201).json({
			message: "회원가입이 성공적으로 완료되었습니다.",
			userId: newUser.insertId
		})
	} catch (err) {
		logger.error(err)
		return res.status(500).json({ message: "서버 오류가 발생하였습니다." })
	}
}

module.exports = {
	signupUser,
}