/**
 * Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환
 * @param {Date} date 포맷팅을 하고싶은 Date 객체
 * @returns {string} 포맷팅된 문자열
 */
function dateFormat(date) {
	const year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();
	month = month >= 10 ? month : "0" + month;
	day = day >= 10 ? day : "0" + day;

	return `${year}-${month}-${day}`;
}

/**
 * Date 객체를 'YYYY-MM-DD HH:mm:ss' 형식의 문자열로 변환
 * @param {Date} date 포맷팅을 하고싶은 Date 객체
 * @returns {string} 포맷팅된 문자열
 */
function dateTimeFormat(date) {
	let hour = date.getHours();
	let minute = date.getMinutes();
	let second = date.getSeconds();

	hour = hour >= 10 ? hour : "0" + hour;
	minute = minute >= 10 ? minute : "0" + minute;
	second = second >= 10 ? second : "0" + second;

	return `${dateFormat(date)} ${hour}:${minute}:${second}`;
}

/**
 * CSV 문자열을 받아 파싱해서 문자열 배열로 반환
 * @param {string} csvStr CSV 문자열
 * @returns {string[]} ','로 구분된 문자열 배열
 */
function csvToStrArray(csvStr) {
	return csvStr.split(",")
}

/**
 * 10진수를 간략한 표현으로 변환
 * @param {number} num 10진수
 * @returns {string} 변환된 문자열 형식의 수
 * @description 1,000 이상 -> 1K, 10,000 이상 -> 10K, 100,000 이상 -> 100K
 */
function changeNumberExpression(num) {
	if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
	else if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
	else if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
	return num.toString()
}

/**
 * 가변 인자를 받아서 null이나 undefined가 있는지 검사
 */
function checkArguments(...args) {
	return args.every(arg => arg !== null && arg !== undefined);
}

/**
 * 비밀번호 형식 검사
 */
function checkPassword(password) {
	return password.length >= 8 &&
		password.length <= 20 &&
		/[A-Z]/.test(password) &&
		/[a-z]/.test(password) &&
		/[0-9]/.test(password) &&
		/[!@#$%^&*]/.test(password)
}

/**
 * JSON 응답
 */
function sendJSONResponse(res, statusCode, status, message, data = null, options) {
	return res.status(statusCode).json({ status, message, data, ...options });
}

// ==============================================================
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

/**
 * JWT 생성 함수
 * @param {object} payload email, nickname, role
 * @param {string} secretKey
 * @param {number} expiresIn - jsonwebtoken 라이브러리에서 허용하는 expire 형식 (timespan string or second number)
 * @return {string}
 */
function generateToken(payload, secretKey, expiresIn) {
	return jwt.sign(payload, secretKey, { expiresIn });
}

/**
 * 토큰 검증 함수
 */
function verifyToken(token, secretKey) {
	return promisify(jwt.verify)(token, secretKey);
}

// ==============================================================
const pool = require("../config/db");

async function withTransaction(callback) {
	const transaction = await pool.getConnection();

	try {
		await transaction.beginTransaction();
		const result = await callback(transaction);
		await transaction.commit();
		return result;
	} catch (err) {
		await transaction.rollback();
		throw err;
	} finally {
		transaction.release();
	}
}

module.exports = {
	dateFormat,
	dateTimeFormat,
	csvToStrArray,
	changeNumberExpression,
	checkArguments,
	checkPassword,
	sendJSONResponse,
	generateToken,
	verifyToken,
	withTransaction,
};
