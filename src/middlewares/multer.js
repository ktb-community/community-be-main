const multer = require("multer");
const process = require("process");
const path = require("path");

const DEFAULT_PATH = path.join(process.cwd(), "/uploads/");

const storage = multer.diskStorage({
	// 업로드 파일을 어느 폴더에 저장할 지 지정
	destination: (req, file, cb) => {
		cb(null, DEFAULT_PATH);
	},

	// 폴더안에 저장되는 파일명 지정
	filename: (req, file, cb) => {
		const newFilename = Date.now() + "_" + file.originalname;
		cb(null, newFilename);
	},
});

module.exports = multer({ storage });
