const morgan = require("morgan");
const process = require("process")
const logger = require("../config/logger");

// NODE_ENV에 따라 morgan 옵션 세팅
const format = process.env.NODE_ENV === "production" ? "combined" : "dev";

// 로그 작성을 위한 Output Stream
const stream = {
	// 개발환경인 경우 ANSI Escape Codes 제거
	write: message => {
		logger.http(message);
	},
};

module.exports = morgan(format, { stream });
