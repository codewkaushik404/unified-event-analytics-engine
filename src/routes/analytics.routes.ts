import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { eventSchema } from "../types/types.js";
import ApiError from "../utils/ApiError.js";
import { verifyApiKey } from "../middleware/middleware.js";
import prisma from "../config/prismaClient.js";

const router = Router();

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
            url: data.url,
            referrer: data.referrer ?? null,
            event_name: data.event,
            event_type: eventType,
            external_user_id: data.userId,
            device: data.device,
            browser: data.metadata.browser,
            ip_address: data.ipAddress,
            metadata: data.metadata
        }
    })

    return res.status(204).end();

}));

router.get("/event-summary", asyncHandler(async (req, res) => {

}));

router.get("/user-stats", asyncHandler(async (req, res) => {

}));

export default router;