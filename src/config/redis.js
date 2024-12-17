const { RedisStore } = require('connect-redis');
const Redis = require('ioredis');
const process = require("process");
const logger = require("./logger");

let redisClient = null;

try {
	redisClient = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);
} catch (err) {
	logger.error(`[Redis Connection Error] ${err.message}`);
	process.exit(1);
}

module.exports = new RedisStore({ client: redisClient, ttl: 60 * 30 * 1000 });