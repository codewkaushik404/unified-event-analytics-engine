import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError.js";

export default function verifyUser(req: Request, res: Response, next: NextFunction){
    if(!req.isAuthenticated() || !req.user) throw new ApiError(401, "User not authenticated");

    next();
}