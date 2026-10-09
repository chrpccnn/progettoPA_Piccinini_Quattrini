import { Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../errors/ErrorFactory";
import { AuthenticatedRequest } from "./authMiddleware";
import * as zod from "../Zod/zodSchemas"

export function userRoleMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try{
        zod.modeSchema.parse(req.body.mode)
        next();
    }
    catch
    {
        next(ErrorFactory.badRequest)
    }
}