exports.getUser = async (req, res) => {
	try {
		// ...
		const userId = req.params.userId;
		console.log(userId);
		res.json({ data: "123" });
	} catch (err) {
		res.status(500).json({ data: err.message });
	}
};
