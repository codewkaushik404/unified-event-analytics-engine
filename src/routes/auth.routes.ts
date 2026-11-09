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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterAppRequest'
 *     responses:
 *       201:
 *         description: Application registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

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

/**
 * @swagger
 * /api/auth/api-key:
 *   get:
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: app_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveApiKeysResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

router.get("/api-key", verifyUser, asyncHandler(async (req, res) => {
    const appId = Number(req.query.app_id);
    if(!appId || isNaN(appId)) throw new ApiError(400, "Incorrect Application ID");

    const userId = req.user!.id;

    const apiKeys = await prisma.apiKey.findMany({
        where: {
            app_id: appId,
            app: {
                owner_id: userId
            },
            is_active: true,
            revoked_at: null,
            expires_at: {gt: new Date()}
        }
    });

    const result = apiKeys
        .map((key) => {
            const {encrypted_key, iv, auth_tag, ...data} = key; 
            
            const api_key = decryptApiKey(encrypted_key, iv, auth_tag);
            return {
                ...data,
                api_key
            }
        })

    if(result.length === 0) throw new ApiError(404, "No active API keys found");

    return res.json(new ApiResponse(200, `Api Keys for App-ID-${appId} fetched successfully`, result));
}));

/**
 * @swagger
 * /api/auth/revoke:
 *   post:
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevokeApiKeyRequest'
 *     responses:
 *       200:
 *         description: API key revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: API key not found
 */

router.post("/revoke", verifyUser, asyncHandler(async (req, res) => {

    const isValid = revokeApiSchema.safeParse(req.body);
    if(!isValid.success) throw new ApiError(400, "Invalid payload", {errors: isValid.error.flatten()});

    const data = isValid.data;
    const userId = req.user!.id;

    const { count } = await prisma.apiKey.updateMany({
        where: {
            id: data.key_id,
            app_id: data.app_id,
            app: {
                owner_id: userId
            },
            is_active: true,
            expires_at: {gt: new Date()},
            revoked_at: null
        },
        data: {
            is_active: false,
            revoked_at: new Date()
        }
    })

    if(count === 0) throw new ApiError(404, "No active Api key found");

    return res.json(new ApiResponse(200, "Api-Key revoked successfully"));
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         description: Unauthorized
 */

router.get("/me", verifyUser, (req, res) => {
    return res.json(new ApiResponse(200, "User details fetched successfully", req.user));
});

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Start Google OAuth login
 *     description: Redirects the browser to Google for email and profile authorization.
 *     tags: [Authentication and Applications]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get("/google", passport.authenticate("google", {
    scope: ["email", "profile"]
}));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Complete Google OAuth login
 *     description: Google redirects here after authorization. On success, establishes a session and returns the sid cookie.
 *     tags: [Authentication and Applications]
 *     responses:
 *       201:
 *         description: User logged in successfully; session cookie is set
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: Session cookie named sid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Google authentication failed
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/auth/logout:
 *   delete:
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Session termination failed
 */

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