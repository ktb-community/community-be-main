const winston = require("winston");
const winstonDaily = require("winston-daily-rotate-file");
const process = require("process");

// 로그 파일 경로 및 형식 설정
const { combine, timestamp, label, printf } = winston.format;
const logDir = `${process.cwd()}/logs`;
const logFormat = printf(({ timestamp, label, level, message }) => {
	return `[${timestamp}] [${label}] [${level}] | ${message}`;
});

/**
 * Log Level
 * Error: 0, Warn: 1, Info: 2, Http: 3, Verbose: 4, Debug: 5, Silly: 6
 * 작은 레벨이 높은 우선순위를 가짐
 */
const logger = winston.createLogger({
	// 로그 출력 포맷 세팅
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		label({ label: "luis.hwang Community BE" }), // App name
		logFormat,
	),

	// 디테일 로그 출력 포맷 세팅
	transports: [
		// Error 레벨 로그 세팅
		new winstonDaily({
			level: "error",
			datePattern: "YYYY-MM-DD",
			dirname: logDir + "/error",
			maxFiles: 30,
			zippedArchive: true,
		}),

		// Info 레벨 로그 세팅 -> 2보다 높은 로그(1, 0)들도 포함됨
		new winstonDaily({
			level: "info",
			datePattern: "YYYY-MM-DD",
			dirname: logDir,
			filename: "%DATE%.log",
			maxFiles: 30, // 가장 최근 30일치 로그 파일 저장
			zippedArchive: true, // 아카이브된 로그 파일을 gzip 압축할지 여부
		}),

		// Http 레벨 로그 세팅
		new winstonDaily({
			level: "http",
			datePattern: "YYYY-MM-DD",
			dirname: logDir + "/http",
			filename: "%DATE%.http.log",
			maxFiles: 30,
			zippedArchive: true,
		}),
	],

	// UncaughtException file settings
	exceptionHandlers: [
		new winstonDaily({
			level: "error",
			datePattern: "YYYY-MM-DD",
			dirname: logDir + "/exception",
			filename: "%DATE%.exception.log",
			maxFiles: 30,
			zippedArchive: true,
		}),
	],
});

/**
 * 개발 환경인 경우 콘솔 출력
 */
if (process.env.NODE_ENV === "development") {
	logger.add(
		new winston.transports.Console({
			level: "debug",
			format: winston.format.combine(
				winston.format.colorize({ level: true, message: true }),
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}] [${message}]`),
			),
		}),
	);
}

module.exports = logger;
