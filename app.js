/* IMPORTS */
const express = require("express");
const userRouter = require("./router/userRouter");

/* CONSTANTS */
const app = express();
const PORT = 8000;

/* MIDDLEWARES */
app.use(express.json());

/* ROUTERS */
app.use("/api/user", userRouter);

app.listen(PORT, () => {
	console.log(`Server starts at http://localhost:${PORT}`);
});
