import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { GameService } from "../services/gameService";
import { ErrorFactory } from "../errors/errorFactory";

export async function createGame(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const result = await GameService.createGame(
            req.user!.id,
            req.body
        );

        return res.status(201).json(result);
    }
    catch{
        next(ErrorFactory.badRequest());
    }
}

export async function shipPositioning(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const result = await GameService.shipPositioning( 
        );

        return res.status(201).json(result);
    }
    catch{
        next(ErrorFactory.badRequest());
    }
}