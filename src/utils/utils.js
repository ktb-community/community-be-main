/* JSON 응답 */
function sendJSONResponse(res, statusCode, status, message, data = null, options) {
	return res.status(statusCode).json({ status, message, data, ...options });
}

module.exports = {
	sendJSONResponse,
};
