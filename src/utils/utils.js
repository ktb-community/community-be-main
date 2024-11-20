/**
 * Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환
 * @param {Date} date 포맷팅을 하고싶은 Date 객체
 * @returns {string} 포맷팅된 문자열
 */
function dateFormat(date) {
	const year = getFullYear();
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
	return csvStr.split("\n").map(row => row.split(","));
}

module.exports = {
	dateFormat,
	dateTimeFormat,
	csvToStrArray,
};
