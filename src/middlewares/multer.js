const multer = require("multer");
const process = require("process");
const path = require("path");
const iconv = require("iconv-lite");
const logger = require("../config/logger")

const storage = multer.diskStorage({
	// 업로드 파일을 어느 폴더에 저장할 지 지정
	destination: (req, file, cb) => {
		// 회원가입이라면
		let uploadPath = 'uploads'
		logger.info(req.path);

		if (req.path.startsWith(`/signup`)) {
			uploadPath = path.join(uploadPath, 'auth');
		} else if (req.path.startsWith(`/boards`)) {
			uploadPath = path.join(uploadPath, 'boards');
		}

		cb(null, uploadPath);
	},

	// 폴더안에 저장되는 파일명 지정
	filename: (req, file, cb) => {
		let originalName;

		try {
			originalName = iconv.decode(Buffer.from(file.originalname, "binary"), "utf8");
		} catch (err) {
			logger.error(`파일명 인코딩 중 예외 발생: ${err.message}`);
			originalName = file.originalname;
		}

		const newFilename = `${Date.now()}_${originalName}`;
		cb(null, newFilename);
	},
});

module.exports = multer({ storage });
