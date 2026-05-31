const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('./redisClient');

function getRateLimiter() {
    const config = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 500, // Limit each IP to 500 requests per `window`
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: {
            status: 429,
            message: "Too many requests from this IP, please try again later."
        }
    };

    const client = getRedisClient();
    
    if (client) {
        console.log('✅ Rate limiting configured to use Redis store.');
        config.store = new RedisStore({
            // @ts-expect-error - Known issue with @types/redis and rate-limit-redis
            sendCommand: (...args) => client.sendCommand(args),
        });
    } else {
        console.log('⚠️ Rate limiting default to Memory store (Redis not configured or unavailable).');
        // If no store is passed, express-rate-limit defaults to MemoryStore
    }

    return rateLimit(config);
}

module.exports = { getRateLimiter };
