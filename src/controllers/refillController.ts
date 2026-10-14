import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { RefillService } from "../services/refillService";

export async function refill(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { userId, tokens } = req.body;

        const result = await RefillService.refill(
            userId,
            tokens
        );

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}


