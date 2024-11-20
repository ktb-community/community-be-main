const morgan = require("morgan");
const logger = require("../config/logger");

// NODE_ENV에 따라 morgan 옵션 세팅
const format = process.env.NODE_ENV === "production" ? "combined" : "dev";

// 로그 작성을 위한 Output Stream
const stream = {
	write: message => {
		logger.http(message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ""));
	},
};

// 로깅 스킵 여부
// 배포 환경에서 상태코드 400 이하는 로그 기록 X
const skip = (_, res) => {
	if (process.env.NODE_ENV === "production") {
		return res.statusCode < 400;
	}
	return false;
};

module.exports = morgan(format, { stream, skip });
