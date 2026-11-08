import { Router } from "express";
import passport from "../config/passport.js";
import ApiResponse from "../utils/ApiResponse.js";
import {generateApiKey, encryptApiKey, decryptApiKey} from "../utils/encryption.js";
import {verifyUser} from "../middleware/middleware.js";
import {registerAppSchema, revokeApiSchema} from "../types/types.js";
import ApiError from "../utils/ApiError.js";
import prisma from "../config/prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";

const router = Router();

router.post("/register", verifyUser, asyncHandler(async (req, res) => {
    
    const isValid = registerAppSchema.safeParse(req.body);
    if(!isValid.success) throw new ApiError(400, "Incorrect payload received", {errors: isValid.error.issues});

    const result = isValid.data;
    const apiKey: string = generateApiKey(32); //32 bytes or 64 char long api key
    const key_hash: string = crypto.createHash("sha256").update(apiKey).digest("hex");
    const encryptionObj = encryptApiKey(apiKey);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); //the api key is valid for 30 days

    await prisma.$transaction(async (tx) => {
        const app_data = await tx.app.create({
            data: {
                name: result.name,
                website_url: result.website_url,
                owner_id: req.user!.id,
            }
        })

        await tx.apiKey.create({
            data: {
                app_id: app_data.id,
                is_active: true,
                expires_at: expiresAt,
                key_hash,
                ...encryptionObj
            }
        })
    })

    return res.status(201).json(new ApiResponse(201, "App registered successfully", {
        name: result.name, 
        website_url: result.website_url,
        api_key: apiKey
    }));

}));

router.get("/api-key", verifyUser, asyncHandler(async (req, res) => {
    const appId = Number(req.query.app_id);
    if(!appId || isNaN(appId)) throw new ApiError(400, "Incorrect Application ID");

    const userId = req.user!.id;

    const application = await prisma.app.findFirst({
        where:{
            id: appId,
            owner_id: userId
        }
    })

    if(!application) throw new ApiError(404, "Application not found");

    const apiKeys = await prisma.apiKey.findMany({
        where: {
            app_id: application.id
        }
    });

    const result = apiKeys
        .filter((key) => {
            const is_expired: boolean = key.expires_at <= new Date();
            const is_revoked: boolean = key.revoked_at !== null;

            return (!is_expired && !is_revoked);
        })
        .map((key) => {
            const {encrypted_key, iv, auth_tag, ...data} = key; 
            
            const api_key = decryptApiKey(encrypted_key, iv, auth_tag);
            return {
                ...data,
                api_key
            }
        })

    return res.json(new ApiResponse(200, `Api Keys for App-ID-${appId} fetched successfully`, result));
}));

router.post("/revoke", verifyUser, asyncHandler(async (req, res) => {

    const isValid = revokeApiSchema.safeParse(req.body);
    if(!isValid.success) throw new ApiError(400, "Invalid payload", {errors: isValid.error.flatten()});

    const data = isValid.data;
    const userId = req.user!.id;

    const application = await prisma.app.findUnique({
        where: {
            id: data.app_id,
            owner_id: userId
        }
    })

    if(!application) throw new ApiError(404, "Application not found");

    const { count } = await prisma.apiKey.updateMany({
        where: {
            id: data.key_id,
            app_id: data.app_id,
            is_active: true
        },
        data: {
            is_active: false,
            revoked_at: new Date()
        }
    })

    if(count === 0) throw new ApiError(404, "No active Api key found");

    return res.json(new ApiResponse(200, "Api-Key revoked successfully"));
}));

router.get("/me", verifyUser, (req, res) => {
    return res.json(new ApiResponse(200, "User details fetched successfully", req.user));
});

router.get("/google", passport.authenticate("google", {
    scope: ["email", "profile"]
}));

router.get("/google/callback", 
    passport.authenticate("google", {
        session: true
    }), 
    (req, res, next) => {
        req.session.save((error: unknown) => {
            if(error) return next(error);

            return res.status(201).json(new ApiResponse(201, "User logged-in successfully"));
        })
    }
);

router.delete("/logout", verifyUser, (req, res, next) => {

    req.logout((logoutError) => {
        if(logoutError) return next(logoutError);

        req.session.destroy((sessionError) => {
            if(sessionError) return next(sessionError);

            res.clearCookie("sid");
            return res.json(new ApiResponse(200, "User logged out successfully"));
        })
    })
});


export default router;