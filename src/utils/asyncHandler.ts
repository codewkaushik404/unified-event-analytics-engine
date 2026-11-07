import type { NextFunction, Request, Response } from "express";

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export default function asyncHandler(fn: AsyncFunction){
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next))
        .catch((err) => next(err));
    }
}