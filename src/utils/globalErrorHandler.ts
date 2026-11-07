import type { NextFunction, Request, Response } from "express";
import ApiError from "./ApiError.js";

function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction){
    const success: boolean = false;

    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
            success,
            ...err
        })
    }

    console.error({
        message: err.message,
        stackTrace: err.stack
    });

    return res.status(500).json({
        success,
        statusCode: 500,
        message: "Internal Server Error"  
    })
}

export default globalErrorHandler;

