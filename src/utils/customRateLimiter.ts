import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redisClient.js";

export default function customRateLimiter(intervalInMin: number, noOfRequests: number, cacheKey: string) {
    return rateLimit({
        windowMs: intervalInMin * 60 * 1000,
        limit: noOfRequests,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too many requests. Please try again later."
        },
        store: new RedisStore({
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
            prefix: cacheKey
        })
    });
}
