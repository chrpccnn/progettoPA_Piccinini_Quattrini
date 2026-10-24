import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/appError";

export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof AppError) {
        return res
            .status(err.statusCode)
            .json({ message: err.message });
    }

    if (err instanceof SyntaxError &&
        "status" in err &&
        err.status === 400 &&
        "body" in err) 
    {
        return res.status(400).json({
            message: "Invalid JSON"
        });
    }

    console.error(err);

    return res.status(500).json({
        message: "Internal Server Error"
    });
}