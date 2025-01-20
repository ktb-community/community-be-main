const axios = require('axios');
const { HttpStatusCode } = require("axios");
const process = require("process");

class StorageClient {
	static async upload(formData) {
		const res = await axios.post(`${process.env.STORAGE_SERVER_URL}/storage`, formData, {
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