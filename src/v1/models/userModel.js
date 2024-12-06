const fs = require("fs");
const logger = require("../../config/logger.js")
const { saveJsonFile } = require("../utils/loop");
const USER_JSON = `./src/v1/json/users.json`;
const userJson = JSON.parse(fs.readFileSync(USER_JSON, "utf-8"));
const USERS = userJson.data;
let fetched = false;

setInterval(() => {
	if (!fetched) return;
	logger.info("USER 테이블 갱신");
	saveJsonFile(USER_JSON, { data: USERS });
	fetched = false;
}, 60 * 1000 * 5);

module.exports = {
	findById: userId => {
		return USERS.find(user => user.id === userId) || null;
	},

	findByEmail: email => {
		return USERS.find(user => user.email === email) || null;
	},

	findByNickname: nickname => {
		return USERS.find(user => user.nickname === nickname) || null;
	},

	save: user => {
		const newUser = { id: USERS.length + 1, ...user };
		USERS.push(newUser);
		fetched = true;
	}
}