const fs = require("fs");
const USER_JSON = `./src/v1/json/users.json`;
const userJson = JSON.parse(fs.readFileSync(USER_JSON, "utf-8"));
const USERS = userJson.data;

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
		const json = { data: [...USERS, newUser] };
		fs.writeFileSync(USER_JSON, JSON.stringify(json, null, 2), "utf8");
		USERS.append(newUser);
	}
}