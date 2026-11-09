import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError.js";
import prisma from "../config/prismaClient.js";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";

export function verifyUser(req: Request, res: Response, next: NextFunction){
    if(!req.isAuthenticated() || !req.user) throw new ApiError(401, "User not authenticated");
    next();
}

export const verifyApiKey = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"];
    if(!apiKey || typeof apiKey !== "string") throw new ApiError(400, "Api Key not found");

    const apiKeyHash: string = crypto.createHash("sha256").update(apiKey).digest("hex");

    const obj = await prisma.apiKey.findUnique({
        where: {
            key_hash: apiKeyHash,
            is_active: true,
            revoked_at: null,
            expires_at: {gt: new Date()}
        },
        include: {
            app: {
                select: {
                    owner_id: true
                }
            }
        }
    })

    if(!obj) throw new ApiError(404, "No active Api-Key not found");
    
    req.apiKeyApp = { app_id: obj.app_id, owner_id: obj.app.owner_id };
    next();
});
