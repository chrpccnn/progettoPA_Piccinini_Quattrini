import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/appError";
const { status } = require("http-status");

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error(err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message
        });
        return;
    }
    
    res.status(status.INTERNAL_SERVER_ERROR).json({
        error: "Errore interno del server"
    });
};