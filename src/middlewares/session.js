const authenticateSession = (req, res, next) => {
	const session = req.session;
	if (!session) return res.status(403);
	console.log(session);
	next();
}

module.exports = authenticateSession;