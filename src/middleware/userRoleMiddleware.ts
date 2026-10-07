import { Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../errors/ErrorFactory";
import { AuthenticatedRequest } from "./authMiddleware";

export function userRoleMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    if (!req.user || req.user.role !== "user") {
        return next(ErrorFactory.forbidden());
    }

    next();
}