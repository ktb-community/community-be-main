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
		useDefaults: true, // 기본 CSP 설정 사용
		directives: {
			"img-src": ["'self'", process.env.SERVER_URL],
			"script-src": ["'self'", process.env.SERVER_URL]
		}
	},

	/* 페이지가 다른 사이트에서 iframe으로 삽입되는 것 방지 (클릭재킹 공격 방지) */
	frameguard: {
		action: 'deny'
	},

	/* X-XSS-Protection 헤더 비활성화 (최신 브라우저에서는 거의 효과가 없으며, 오히려 악용될 여지가 있음) */
	xssFilter: false,
}));

app.use(rateLimit({
	windowMs: 1000,
	max: 30,
	message: "최대 요청에 도달했습니다. 잠시 후 다시 시도해주세요."
}));

// ========================================= [초기화 단계] ===========================================================
/* 환경변수 로드, NODE_ENV 정의 -> 앱 상단에서 최초 1회만 수행 */
process.env.NODE_ENV =
	process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === "production" ? "production" : "development";

/* uploads 경로 확인 */
const CWD = process.cwd();
const uploadDir = [`${CWD}/uploads`, `${CWD}/uploads/auth`, `${CWD}/uploads/boards`];
for (const dir of uploadDir) {
	if (!fs.existsSync(dir)) {
		logger.info(`Create new Upload Directory: ${dir}`);
		fs.mkdirSync(dir);
	}
}

/* logs 경로 확인 */
const logDir = [`${CWD}/logs`, `${CWD}/logs/error`, `${CWD}/logs/http`, `${CWD}/logs/exception`];
for (const dir of logDir) {
	if (!fs.existsSync(dir)) {
		logger.info(`Create new Log Directory: ${dir}`);
		fs.mkdirSync(dir);
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

// 정적파일 요청시 CORS 따로 설정
app.use("/uploads", (req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", 'http://localhost:5173, http://localhost:3000');
	res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
	next();
}, express.static("uploads"));

// ===================================== [라우터 등록] ======================================================
const apiVersion = process.env.API_VERSION || "v1";
logger.info(`Current API Version: ${apiVersion}`)

if (apiVersion === "v1") {
	const session = require("express-session");
	const store = new session.MemoryStore();
	const process = require("process");
	const SESSION_KEY = process.env.SESSION_SECRET_KEY;

	/* 세션 미들웨어 추가 */
	app.use(session({
		secret: SESSION_KEY,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: false,
			sameSite: false,
			expires: new Date(Date.now() + (1000 * 60 * 30) + (1000 * 60 * 60 * 9))
		},
		store: store
	}));

	/* Routers */
	const authRouter = require("./v1/routes/authRouter");
	const boardRouter = require('./v1/routes/boardRouter');
	const userRouter = require('./v1/routes/userRouter');

	/* 라우터 등록 */
	const authenticateSession = require('./middlewares/session');

	app.use('/api/v1/auth', authRouter);
	app.use('/api/v1/boards', authenticateSession, boardRouter);
	app.use('/api/v1/users', authenticateSession, userRouter);
}

else if (apiVersion === "v2") {
	// 애플리케이션 초기화 단계에서 의존성 주입 -> TODO: 추후 DI 프레임워크 도입 또는 fs 모듈로 자동화시키기

	/* Model */
	const User = require("./v2/models/user");
	const Board = require("./v2/models/board");
	const BoardLike = require("./v2/models/boardLike");
	const BoardComment = require("./v2/models/boardComment");

	const userModel = new User();
	const boardModel = new Board();
	const boardLikeModel = new BoardLike();
	const boardCommentModel = new BoardComment();

	/* Service */
	const UserService = require("./v2/services/userService");
	const BoardService = require("./v2/services/boardService");
	const AuthService = require("./v2/services/authService");
	const BoardCommentService = require("./v2/services/boardCommentService");
	const BoardLikeService = require("./v2/services/boardLikeService");

	const userService = new UserService(userModel);
	const authService = new AuthService(userModel);
	const boardService = new BoardService(boardModel, userModel);
	const boardCommentService = new BoardCommentService(boardCommentModel);
	const boardLikeService = new BoardLikeService(boardLikeModel);

	/* Router */
	const UserRouter = require("./v2/routes/userRouter");
	const AuthRouter = require("./v2/routes/authRouter");
	const BoardRouter = require("./v2/routes/boardRouter");

	const userRouter = new UserRouter(userService);
	const authRouter = new AuthRouter(authService);
	const boardRouter = new BoardRouter(boardService, boardLikeService, boardCommentService);

	/* 라우터 등록 */
	app.use(`/api/v2/users`, userRouter.router);
	app.use(`/api/v2/auth`, authRouter.router);
	app.use(`/api/v2/boards`, boardRouter.router);
}
// =====================================================================================================================

// ========================================= [500 에러 핸들링] ==========================================================
// 전역 예외 처리
const { sendJSONResponse } = require("./utils/utils");
const { ResStatus } = require("./utils/const");
const session = require("express-session");

app.use((err, req, res, next) => {
	logger.error(err.message);
	return sendJSONResponse(res, 500, ResStatus.ERROR, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
})
// =====================================================================================================================

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`[${process.env.NODE_ENV}] Server started at http://localhost:${PORT}`);
});
