/* JSON 응답 */
function sendJSONResponse(res, statusCode, status, message, data = null, options) {
	return res.status(statusCode).json({ status, message, data, ...options });
}

function getKst() {
	return new Date(Date.now() + (9 * 60 * 60 * 1000));
}

module.exports = {
	sendJSONResponse,
	getKst
};
