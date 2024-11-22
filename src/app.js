const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const logger = require("./config/logger");

// ========================================= [초기화 단계] ===========================================================
/* 환경변수 로드, NODE_ENV 정의 -> 앱 상단에서 최초 1회만 수행 */
const process = require("process");
const dotenv = require("dotenv");
dotenv.config({ path: `${process.cwd()}/src/config/.env` });
process.env.NODE_ENV =
	process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === "production" ? "production" : "development";

/* uploads 경로 확인 */
const uploadDir = `${process.cwd()}/uploads`;
if (!fs.existsSync(uploadDir)) {
	logger.info(`Create new Upload Directory: ${uploadDir}`);
	fs.mkdirSync(uploadDir);
}

/* logs 경로 확인 */
const logDir = `${process.cwd()}/logs`;
const checkPaths = [logDir, logDir + "/error", logDir + "/http", logDir + "/exception"];
for (const path of checkPaths) {
	if (!fs.existsSync(path)) {
		logger.info(`Create new Log Directory: ${path}`);
		fs.mkdirSync(path);
	}
}
// ====================================================================================================================
/* IMPORT CUSTOM MIDDLEWARES */
const morganMiddleware = require("./middlewares/morgan");
const corsMiddleware = require("./middlewares/cors");

/* MIDDLEWARES */
app.use(morganMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "uploads")));

// ===================================== [라우터 동적으로 등록] ======================================================
// 애플리케이션 초기화 단계에서 의존성 미리 주입
const services = {};
const serviceDir = path.join(__dirname, "services");
const routerDir = path.join(__dirname, "routes");

// 서비스 인스턴스 동적으로 등록
fs.readdirSync(serviceDir).forEach(file => {
	const filepath = path.join(serviceDir, file);
	const filename = path.basename(file, ".js");

	if (filename.endsWith("Service")) {
		const ServiceClass = require(filepath);
		services[filename] = new ServiceClass();
	}
});

// 라우터 동적 로딩
fs.readdirSync(routerDir).forEach(file => {
	const filepath = path.join(routerDir, file);
	const filename = path.basename(file, ".js");

	if (filename.endsWith("Router")) {
		const RouterClass = require(filepath);
		const serviceKey = filename.replace("Router", "Service");
		const service = services[serviceKey];

		if (service) {
			const routerInstance = new RouterClass(service);
			const routePath = `/api/v1/${filename.toLowerCase().replace("router", "")}`;
			app.use(routePath, routerInstance.router);
			logger.info(`${routePath}에 ${serviceKey} 주입`);
		}
	}
});
// =====================================================================================================================

// ========================================= [500 에러 핸들링] ==========================================================
// 전역 예외 처리
const { sendJSONResponse } = require("./utils/utils");
const { ResStatus } = require("./utils/const");

const globalExceptionHandler = () => {
	return function (err, req, res, next) {
		logger.error(err.stack);
		sendJSONResponse(res, 500, ResStatus.ERROR, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
		return next()
	}
}

app.use(globalExceptionHandler())
// =====================================================================================================================

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`[${process.env.NODE_ENV}] Server started at http://localhost:${PORT}`);
});
