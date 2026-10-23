import { Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../errors/ErrorFactory";
import { AuthenticatedRequest } from "./authMiddleware";

export function roleMiddleware(
    role: "user" | "admin"
) {
    // verifica che il ruolo sia esistente e corretto
    return (
        req: AuthenticatedRequest,
        _res: Response,
        next: NextFunction
    ) => {

        if (!req.user) {
            return next(
                ErrorFactory.invalidToken()
            );
        }

        if (req.user.role !== role) {
            return next(
                ErrorFactory.forbidden()
            );
        }

        return next();
    };
}