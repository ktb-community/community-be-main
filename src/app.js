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

// express-rate-limit이 프록시 서버의 IP가 아닌 X-Forwarded-For을 참고하도록 설정
app.set('trust proxy', true);

app.use(rateLimit({
	windowMs: 1000,
	max: 100,
	message: "최대 요청에 도달했습니다. 잠시 후 다시 시도해주세요.",
}));

// ====================================================================================================================
/* IMPORT CUSTOM MIDDLEWARES */
const morganMiddleware = require("./middlewares/morgan");

/* MIDDLEWARES */
app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

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
const authRouter = require("./routes/authRouter");
const boardRouter = require("./routes/boardRouter");
const userRouter = require("./routes/userRouter");

/* 라우터 등록 */
const authenticateSession = require("./middlewares/session");

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/boards", authenticateSession, boardRouter);
app.use("/api/v1/users", authenticateSession, userRouter);

// ========================================= [500 에러 핸들링] ==========================================================
// 전역 예외 처리
const { sendJSONResponse } = require("./utils/utils");
const { ResStatus } = require("./utils/const");

app.use((err, req, res, _) => {
	logger.error(err.message);
	return sendJSONResponse(res, 500, ResStatus.ERROR, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
});

// =====================================================================================================================
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
	logger.info(`Node ENV: ${process.env.NODE_ENV}`);
	logger.info(`Storage Server URL: ${process.env.STORAGE_SERVER_URL}`);
	logger.info(`Server started at PORT ${PORT}`);
});
