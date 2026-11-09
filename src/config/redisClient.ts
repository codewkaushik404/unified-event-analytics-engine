import { createClient } from "redis";
import config from "./config.js";

const redisClient = createClient({
    url: config.REDIS_URL
});

redisClient.on("error", (error: any) => {
    console.error("Redis client error", error);
});

await redisClient.connect().catch((error) => {
    console.error("Redis connection failed", error);
    process.exit(1);
});

export default redisClient;
