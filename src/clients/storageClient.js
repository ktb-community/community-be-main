const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpStatusCode } = require("axios");
const process = require("process");

class StorageClient {
	// formData: file, user-email, user-nickname 정보
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

	static async downloadFromWebURL(url) {
		const filename = path.basename(url) + ".png";
		const savePath = path.join('uploads', 'auth', `${Date.now()}_${filename}`);

		try {
			const res = await axios.get(url, {
				responseType: 'stream'
			});

			// 파일 저장
			await new Promise((resolve, reject) => {
				const fileStream = fs.createWriteStream(savePath);
				res.data.pipe(fileStream);
				fileStream.on('finish', resolve);
				fileStream.on('error', reject);
			})

			return { filename, savePath };

		} catch (e) {
			console.error(e);
		}

		return null;
	}
}

module.exports = StorageClient;