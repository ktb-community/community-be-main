const cors = require("cors");
const process = require("process");
const StringUtil = require("../utils/stringUtil");

const corsOptions = {
	origin: StringUtil.csvToStrArray(process.env.ACCESS_CONTROL_ALLOW_ORIGIN),
	allowedHeaders: StringUtil.csvToStrArray(process.env.ACCESS_CONTROL_ALLOW_HEADERS),
	methods: StringUtil.csvToStrArray(process.env.ACCESS_CONTROL_ALLOW_METHODS),
	credentials: true,
};

module.exports = cors(corsOptions);
