/* 환경변수 읽기 */
const dotenv = require("dotenv");
const fs = require("fs");
const process = require("process");
const logger = require("./logger");
const ENV = process.env.NODE_ENV || "development";
const envFile = `.env.${ENV}`;

try {
	dotenv.config({ path: `${envFile}` });
} catch (err) {
	logger.error(`[dotenv] ${err.message}`);
}

/* 필수 폴더 생성 */
// uploads 경로 확인
const CWD = process.cwd();
const uploadDir = [`${CWD}/uploads`, `${CWD}/uploads/auth`, `${CWD}/uploads/boards`];
for (const dir of uploadDir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

// logs 경로 확인
const logDir = [`${CWD}/logs`, `${CWD}/logs/error`, `${CWD}/logs/http`, `${CWD}/logs/exception`];
for (const dir of logDir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

/* DB 연결 테스트 */
require("./db");
require('./redis')