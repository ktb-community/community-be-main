const User = require("../models/user")
const bcrypt = require("bcrypt")
const logger = require("../config/logger")
const { generateToken } = require("../utils/utils")

const signup = async (req, res) => {
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

const login = async (req, res) => {
	const { email, password } = req.body

	try {
		// 요청 값 검증 
		if (!email || !password) {
			return res.status(400).json({ message: "모든 필드를 포함해야합니다."})
		}

		// 1. email 확인 
		const existingUser = await User.findByEmail(email)
		if (!existingUser) {
			return res.status(400).json({ message: "가입되지 않은 이메일입니다."})
		}
		
		// 2. password 일치 확인 
		const passwordMatch = await bcrypt.compare(password, existingUser.password)
		if (!passwordMatch) {
			return res.status(400).json({ message: "비밀번호가 일치하지 않습니다."})
		}

		/* email, password가 일치하는 경우 */
		const nickname = existingUser.nickname
		
		// 1. JWT 토큰 발급 (access-token, refresh-token)
		const accessToken = generateToken(email, nickname);
		const refreshToken = generateToken(email, nickname);

		// 2. DB 업데이트 
		await User.login(refreshToken, new Date())
		
		return res.status(200).json({ 
			message: "로그인에 성공하였습니다.",
			accessToken,
			refreshToken
		})

	} catch (err) {
		logger.error(err)
		console.error(err)
		return res.status(500).json({ message: "서버 오류가 발생하였습니다."})
	}
}

module.exports = {
	signup,
	login
}