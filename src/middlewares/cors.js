const cors = require("cors");
const { csvToStrArray } = require("../utils/utils");

const corsOptions = {
	origin: csvToStrArray(process.env.ACCESS_CONTROL_ALLOW_ORIGIN),
	allowedHeaders: csvToStrArray(process.env.ACCESS_CONTROL_ALLOW_HEADERS),
	methods: csvToStrArray(process.env.ACCESS_CONTROL_ALLOW_METHODS),
	credentials: true,
};

if (process.env.NODE_ENV === "development") {
	console.log(`======================= [corsOptions] =======================`);
	console.log(`Access-Control-Allow-Origin: ${corsOptions.origin}`);
	console.log(`Access-Control-Allow-Headers: ${corsOptions.allowedHeaders}`);
	console.log(`Access-Control-Allow-Methods: ${corsOptions.methods}`);
	console.log(`Access-Control-Allow-Credentials: ${corsOptions.credentials}`);
	console.log(`=============================================================`);
}

module.exports = cors(corsOptions);
