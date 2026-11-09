import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { eventSchema, eventSummarySchema, userStatsSchema } from "../types/types.js";
import ApiError from "../utils/ApiError.js";
import { verifyApiKey, verifyUser } from "../middleware/middleware.js";
import prisma from "../config/prismaClient.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ANALYTICS_CACHE_TTL_SECONDS } from "../utils/cache_metadata.js";
import redisClient from "../config/redisClient.js";

const router = Router();

/**
 * @swagger
 * /api/analytics/collect:
 *   post:
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventRequest'
 *     responses:
 *       204:
 *         description: Event stored successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Invalid or expired API key
 *       500:
 *         description: Internal server error
 */

router.post("/collect", verifyApiKey, asyncHandler(async (req, res) => {
    const isValid = eventSchema.safeParse(req.body);
    if(!isValid.success) throw new ApiError(400, "Invalid payload received", {errors: isValid.error.issues});

    const data = isValid.data;
    let eventType: "CLICK" | "VISIT";

    if(data.event.toUpperCase().includes("CLICK")) eventType = "CLICK";
    else eventType = "VISIT";

    await prisma.event.create({
        data: {
            app_id: req.apiKeyApp!.app_id,
            event_name: data.event,
            event_type: eventType,
            url: data.url,
            referrer: data.referrer ?? null,
            device: data.device,
            ip_address: data.ipAddress,
            timestamp: data.timestamp,
            browser: data.metadata.browser,
            metadata: data.metadata,

            external_user_id: data.userId,
        }
    })

    return res.status(204).end();
}));

/**
 * @swagger
 * /api/analytics/event-summary:
 *   post:
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventSummaryRequest'
 *     responses:
 *       200:
 *         description: Event summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventSummaryResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.post("/event-summary", verifyUser, asyncHandler(async (req, res) => {

    const isValid = eventSummarySchema.safeParse(req.body);
    if(!isValid.success) throw new ApiError(400, "Invalid payload received", {errors: isValid.error.issues});

    const {event, startDate, endDate, app_id} = isValid.data;

    if(endDate) endDate.setDate(endDate.getDate() + 1);

    const cacheKey = [
        "analytics", 
        "event-summary", 
        req.user!.id, 
        !app_id ? "all" : app_id,
        event,
        startDate?.toISOString() ?? "none",
        endDate?.toISOString() ?? "none",
    ].join(":");

    const cached_data = await redisClient.get(cacheKey);

    if(cached_data) return res.json(new ApiResponse(200, "Event summary fetched successfully", JSON.parse(cached_data)));

    const events = await prisma.event.findMany({
        where: {
            event_name: event,
            app: {
                owner_id: req.user!.id
            },
            ...(app_id && {app_id}),
            ...((startDate || endDate) && {
                timestamp: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lt: endDate })
                }
            })
        }
    });

    if(events.length === 0) return res.json(new ApiResponse(200, `No events found for Event: ${event} with the given details`));

    const uniqueUsers = new Set(events.map((event) => event.external_user_id)).size;
    const deviceData = events.reduce<Record<string, number>>((acc, event) => {
        const device = event.device.toLowerCase();
        acc[device] = (acc[device] || 0) + 1;
        return acc;
    }, {
        "mobile": 0,
        "desktop": 0,
        "tablet": 0,
        "unknown": 0
    });

    const data = {
        event_name: event,
        event: events[0]!.event_type?.toLowerCase() ?? null,
        count: events.length,
        uniqueUsers,
        deviceData
    }

    await redisClient.set(cacheKey, JSON.stringify(data), {
        expiration: {
            type: "EX",
            value: ANALYTICS_CACHE_TTL_SECONDS.eventSummary
        }
    });

    return res.json(new ApiResponse(200, "Event summary fetched successfully", data));
}));

/**
 * @swagger
 * /api/analytics/user-stats:
 *   get:
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activity statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStatsResponse'
 *       400:
 *         description: Invalid userId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get("/user-stats", verifyUser, asyncHandler(async (req, res) => {
    const isValid = userStatsSchema.safeParse({ userId: req.query.userId });
    if(!isValid.success) throw new ApiError(400, "Invalid payload received", {errors: isValid.error.issues});

    const {userId: external_user_id} = isValid.data;

    const cacheKey = [
        "analytics",
        "user-stats",
        req.user!.id,
        external_user_id
    ].join(":");

    const cached_data = await redisClient.get(cacheKey);
    if(cached_data) return res.json(new ApiResponse(200, "User stats fetched successfully", JSON.parse(cached_data)));

    const events = await prisma.event.findMany({
        where: {
            external_user_id,
            app: {
                owner_id: req.user!.id
            }
        }
    });

    if(events.length === 0) throw new ApiError(404, `No stats found for USER: ${external_user_id}`);

    const browserSet: Set<string> = new Set();
    const osSet: Set<string> = new Set();
    const ipSet: Set<string> = new Set();

    events.forEach((event) => {
        browserSet.add(event.browser);

        if (
            event.metadata &&
            typeof event.metadata === "object" &&
            !Array.isArray(event.metadata) &&
            typeof event.metadata.os === "string"
        ) osSet.add(event.metadata.os);

        ipSet.add(event.ip_address);
    });

    const data = {
        userId: external_user_id,
        totalEvents: events.length,
        ipAddresses: [...ipSet],
        deviceDetails: {
            browser: [...browserSet],
            os: [...osSet]
        }
    }

    await redisClient.set(cacheKey, JSON.stringify(data), {
        expiration: {
            type: "EX", value: ANALYTICS_CACHE_TTL_SECONDS.userStats
        }
    });

    return res.json(new ApiResponse(200, "User stats fetched successfully", data));
}));

export default router;