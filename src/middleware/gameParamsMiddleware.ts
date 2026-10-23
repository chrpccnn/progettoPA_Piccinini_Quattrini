import { Request, Response, NextFunction } from "express";
import { gameParamsSchema } from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/ErrorFactory";

export default function gameParamsMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const parsed =
        gameParamsSchema.safeParse(req.params);

    if (!parsed.success) {
        return next(
            ErrorFactory.badRequest(
                "Invalid gameId"
            )
        );
    }

    req.params = parsed.data;

    return next();
}