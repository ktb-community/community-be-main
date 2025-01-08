const Redis = require("ioredis");
const process = require("process");
const logger = require("./logger");
const { RedisStore } = require("connect-redis");
const { Session } = require("../utils/const.js");

let redisClient = null;

try {
	redisClient = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);
	logger.info(`[Redis Connection] Ok`);
} catch (err) {
	logger.error(`[Redis Connection Error] ${err.message}`);
	process.exit(1);
}

module.exports = new RedisStore({ client: redisClient, ttl: Session.TTL / 1000 });