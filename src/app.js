require("./config/init");

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const process = require("process");
const logger = require("./config/logger");
const app = express();

// CSP & 요청 최대 제한
app.use(helmet({
	contentSecurityPolicy: {
		useDefaults: true, // 기본 CSP 설정 사용
		directives: {
			"img-src": ["'self'", process.env.SERVER_URL],
			"script-src": ["'self'", process.env.SERVER_URL],
		},
	},

	/* 페이지가 다른 사이트에서 iframe으로 삽입되는 것 방지 (클릭재킹 공격 방지) */
	frameguard: {
		action: "deny",
	},

	/* X-XSS-Protection 헤더 비활성화 (최신 브라우저에서는 거의 효과가 없으며, 오히려 악용될 여지가 있음) */
	xssFilter: false,
}));

app.use(rateLimit({
	windowMs: 1000,
	max: 30,
	message: "최대 요청에 도달했습니다. 잠시 후 다시 시도해주세요.",
}));

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
	res.setHeader("Access-Control-Allow-Origin", csvToStrArray(process.env.ACCESS_CONTROL_ALLOW_ORIGIN));
	res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
	next();
}, express.static("uploads"));

// ====================================================================================================================
/* Prometheus */
const client = require("prom-client");
const apiMetrics = require("prometheus-api-metrics");
const register = new client.Registry();

app.use(apiMetrics());

// 메트릭 엔드포인트
app.get("/metrics", async (req, res) => {
	res.setHeader("Content-Type", register.contentType);
	res.end(await register.metrics());
});

// ===================================== [라우터 등록] ======================================================
const session = require("express-session");
const redisStore = require("./config/redis");
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
		maxAge: 1000 * 60 * 30,
	},
	store: redisStore,
}));

/* Routers */
const authRouter = require("./v1/routes/authRouter");
const boardRouter = require("./v1/routes/boardRouter");
const userRouter = require("./v1/routes/userRouter");

/* 라우터 등록 */
const authenticateSession = require("./middlewares/session");

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/boards", authenticateSession, boardRouter);
app.use("/api/v1/users", authenticateSession, userRouter);

/*
// 애플리케이션 초기화 단계에서 의존성 주입 -> TODO: 추후 DI 프레임워크 도입 또는 fs 모듈로 자동화시키기

// Model
const User = require("./v2/models/user");
const Board = require("./v2/models/board");
const BoardLike = require("./v2/models/boardLike");
const BoardComment = require("./v2/models/boardComment");

const userModel = new User();
const boardModel = new Board();
const boardLikeModel = new BoardLike();
const boardCommentModel = new BoardComment();

// Service
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

// Router
const UserRouter = require("./v2/routes/userRouter");
const AuthRouter = require("./v2/routes/authRouter");
const BoardRouter = require("./v2/routes/boardRouter");

const userRouter = new UserRouter(userService);
const authRouter = new AuthRouter(authService);
const boardRouter = new BoardRouter(boardService, boardLikeService, boardCommentService);

// 라우터 등록
app.use(`/api/v2/users`, userRouter.router);
app.use(`/api/v2/auth`, authRouter.router);
app.use(`/api/v2/boards`, boardRouter.router);
*/

// ========================================= [500 에러 핸들링] ==========================================================
// 전역 예외 처리
const { sendJSONResponse, csvToStrArray } = require("./utils/utils");
const { ResStatus } = require("./utils/const");

app.use((err, req, res, _) => {
	logger.error(err.message);
	return sendJSONResponse(res, 500, ResStatus.ERROR, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
});

// =====================================================================================================================
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
	logger.info(`Node ENV: ${process.env.NODE_ENV}`);
	logger.info(`Server started at http://localhost:${PORT}`);
});
