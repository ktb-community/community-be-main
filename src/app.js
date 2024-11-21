const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

/* 환경변수 로드, NODE_ENV 정의 -> 앱 상단에서 최초 1회만 수행 */
const process = require("process");
const dotenv = require("dotenv");
dotenv.config({ path: `${process.cwd()}/config/.env` });
process.env.NODE_ENV =
	process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() == "production" ? "production" : "development";

/* uploads 경로 확인 */
const uploadDir = `${process.cwd()}/uploads`;
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

/* logs 경로 확인 */
const logDir = `${process.cwd()}/logs`;
const checkPaths = [logDir, logDir + "/error", logDir + "/http", logDir + "/exception"];
for (const path of checkPaths) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
}

/* IMPORT CUSTOM MIDDLEWARES */
const morganMiddleware = require("./middlewares/morgan");
const corsMiddleware = require("./middlewares/cors");
const authenticateJWT = require("./middlewares/jwt");

/* MIDDLEWARES */
app.use(morganMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "uploads")));

/* ROUTES */
const authRouter = require("./routes/authRouter");
app.use("/api/v1/auth", authRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`[${process.env.NODE_ENV}] Server started at http://localhost:${PORT}`);
});
