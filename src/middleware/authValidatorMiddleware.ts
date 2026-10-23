import { Request, Response, NextFunction } from "express";
import { authSchema } from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/ErrorFactory";

export default function authValidatorMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    try {
        req.body = authSchema.parse(req.body);
        return next();
    }
    catch {
        return next(
            ErrorFactory.badRequest("Invalid authentication data")
        );
    }
}