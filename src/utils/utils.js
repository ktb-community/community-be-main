/* JSON 응답 */
function sendJSONResponse(res, statusCode, status, message, data = null, options) {
	return res.status(statusCode).json({ status, message, data, ...options });
}

function getKst() {
	return new Date(Date.now() + (9 * 60 * 60 * 1000));
}

function generateRandomString(length) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters[randomIndex];
	}

	return result;
}

module.exports = {
	sendJSONResponse,
	getKst,
	generateRandomString
};
