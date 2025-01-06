const axios = require('axios');
const { HttpStatusCode } = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const process = require("process");

class StorageClient {
	static async upload(path, originalFilename) {
		const formData = new FormData();
		formData.append("photo", fs.createReadStream(path), originalFilename);

		const res = await axios.post(process.env.STORAGE_SERVER_URL, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});

		if (res.status !== HttpStatusCode.Ok) {
			return Promise.reject();
		}

		return res.data;
	}
}

module.exports = StorageClient;