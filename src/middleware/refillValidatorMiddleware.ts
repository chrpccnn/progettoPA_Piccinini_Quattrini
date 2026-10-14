import { Request, Response, NextFunction } from "express";
import { refillSchema } from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/ErrorFactory";

export default function refillValidatorMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    try {
        req.body = refillSchema.parse(req.body);
        return next();
    }
    catch {
        return next(
            ErrorFactory.badRequest(
                "Invalid refill data"
            )
        );
    }
}