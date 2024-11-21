const express = require("express");
const app = express();

/* 환경변수 로드, NODE_ENV 정의 -> 앱 상단에서 최초 1회만 수행 */
const process = require("process");
const dotenv = require("dotenv");
dotenv.config({ path: `${process.cwd()}/config/.env` });
process.env.NODE_ENV =
	process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() == "production" ? "production" : "development";

/* IMPORT CUSTOM MIDDLEWARES */
const morganMiddleware = require("./middlewares/morgan");
const corsMiddleware = require("./middlewares/cors");

/* MIDDLEWARES */
app.use(morganMiddleware); 
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ROUTES */
const authRouter = require("./routes/authRouter");
const authenticateJWT = require("./middlewares/jwt");
app.use("/api/v1/auth", authRouter)

app.get("/test", authenticateJWT, (req, res) => {
	console.log(req.user)
	return res.json({ message: "good" })
})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`[${process.env.NODE_ENV}] Server started at http://localhost:${PORT}`);
});
