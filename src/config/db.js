const mysql = require("mysql2");
const process = require("process");

// MySQL 연결 풀 생성
const pool = mysql.createPool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

const db = pool.promise();

// Promise 기반 사용을 위한 `promise()` 호출

module.exports = db;
