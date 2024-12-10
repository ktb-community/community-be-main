const fs = require("fs");

const saveJsonFile = (path, json) =>  {
	fs.writeFileSync(path, JSON.stringify(json, null, 2), "utf8");
	fs.close();
}

module.exports = {
	saveJsonFile,
};