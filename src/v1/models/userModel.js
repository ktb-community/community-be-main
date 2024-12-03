const fs = require("fs");
const logger = require("../../config/logger");
const USER_JSON = `./src/v1/json/users.json`;

async function getUsers() {
	try {
		const json = JSON.parse(fs.readFileSync(USER_JSON, "utf-8"));
		return json.data;
	} catch (e) {
		logger.error(e.stack);
		return null;
	}
}

const findByEmail = async email => {
	const users = await getUsers();
	return users.find(user => user.email === email);
};

const findByNickname = async nickname => {
	const users = await getUsers();
	return users.find(user => user.nickname === nickname);
};

const saveUser = async user => {
	const users = await getUsers();
	const newUsers = [...users, { id: users.length + 1, ...user }];
	const json = { data: newUsers };
	fs.writeFileSync(USER_JSON, JSON.stringify(json, null, 2), "utf8");
};

module.exports = {
	findByEmail,
	findByNickname,
	saveUser
};