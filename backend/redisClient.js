const { createClient } = require('redis');

let redisClient = null;
let isRedisConnected = false;

async function initRedis() {
    if (!process.env.REDIS_URL) {
        console.log('⚠️ REDIS_URL not provided. Proceeding without Redis (Rate limiting will use memory, caching will be bypassed).');
        return null;
    }

    try {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis error:', err.message);
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('✅ Connected to Redis!');
            isRedisConnected = true;
        });

        await redisClient.connect();
        return redisClient;
    } catch (err) {
        console.error('❌ Failed to initialize Redis:', err.message);
        isRedisConnected = false;
        return null;
    }
}

// Helper to get client safely
function getRedisClient() {
    return isRedisConnected ? redisClient : null;
}

// Caching middleware for GET requests
const cacheMiddleware = (keyPrefix, expirationSeconds = 300) => {
    return async (req, res, next) => {
        const client = getRedisClient();
        if (!client) {
            // Redis not connected, skip cache
            return next();
        }

        // Keep it simple and predictable
        const key = `${keyPrefix}:${req.originalUrl || req.url}`;
        
        try {
            const cachedData = await client.get(key);
            if (cachedData) {
                console.log(`[Cache Hit] ${key}`);
                return res.json(JSON.parse(cachedData));
            }
            
            console.log(`[Cache Miss] ${key}`);
            
            // Overwrite res.json to intercept the response and cache it
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Determine if we should cache this response (e.g., success status)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    client.setEx(key, expirationSeconds, JSON.stringify(body)).catch(err => {
                        console.error('❌ Redis Cache Set Error:', err.message);
                    });
                }
                originalJson(body);
            };
            
            next();
        } catch (err) {
            console.error('❌ Redis Cache Get Error:', err.message);
            // On error, just skip cache and continue
            next();
        }
    };
};

module.exports = { initRedis, getRedisClient, cacheMiddleware };
