const express = require("express");
const fs = require("fs");
const helmet = require("helmet")
const rateLimit = require("express-rate-limit");
const process = require("process");
const dotenv = require("dotenv");
dotenv.config({ path: `${process.cwd()}/src/config/.env` });
const logger = require("./config/logger");

const app = express();

// CSP & 요청 최대 제한
app.use(helmet({
	contentSecurityPolicy: {
		useDefaults: true,
		directives: {
			"img-src": ["'self'", process.env.SERVER_URL],
			"script-src": ["'self'", process.env.SERVER_URL]
		}
	},
	frameguard: {
		action: 'deny'
	},
	xssFilter: true,
}));

app.use(rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	message: "최대 요청에 도달했습니다. 1분 뒤 다시 시도해주세요."
}));

// ========================================= [초기화 단계] ===========================================================
/* 환경변수 로드, NODE_ENV 정의 -> 앱 상단에서 최초 1회만 수행 */
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
app.use("/uploads", (req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", 'http://localhost:5173');
	res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
	next();
}, express.static("uploads"));

// ===================================== [라우터 등록] ======================================================
// 애플리케이션 초기화 단계에서 의존성 주입 -> TODO: 추후 DI 프레임워크 도입 또는 fs 모듈로 자동화시키기
/* Model */
const User = require("./models/user");
const Board = require("./models/board");
const BoardLike = require("./models/boardLike");
const BoardComment = require("./models/boardComment");

const userModel = new User();
const boardModel = new Board();
const boardLikeModel = new BoardLike();
const boardCommentModel = new BoardComment();

/* Service */
const UserService = require("./services/userService");
const BoardService = require("./services/boardService");
const AuthService = require("./services/authService");
const BoardCommentService = require("./services/boardCommentService");
const BoardLikeService = require("./services/boardLikeService");

const userService = new UserService(userModel);
const authService = new AuthService(userModel);
const boardService = new BoardService(boardModel);
const boardCommentService = new BoardCommentService(boardCommentModel);
const boardLikeService = new BoardLikeService(boardLikeModel);

/* Router */
const UserRouter = require("./routes/userRouter");
const AuthRouter = require("./routes/authRouter");
const BoardRouter = require("./routes/boardRouter");

const userRouter = new UserRouter(userService);
const authRouter = new AuthRouter(authService);
const boardRouter = new BoardRouter(boardService, boardLikeService, boardCommentService);

/* 라우터 등록 */
const REQUEST_PATH = process.env.REQUEST_PATH;
app.use(`${REQUEST_PATH}/users`, userRouter.router);
app.use(`${REQUEST_PATH}/auth`, authRouter.router);
app.use(`${REQUEST_PATH}/boards`, boardRouter.router);
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
