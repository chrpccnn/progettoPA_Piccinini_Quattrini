import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { GameService } from "../services/gameService";
import { GameParams, countermeasureSchema } from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/ErrorFactory";

export async function createGame(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    // richiama il service per la creazione della partita
    try {
        const result = await GameService.createGame(
            req.user!.id,
            req.body
        );

        return res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}

export async function getGameState(
    req: AuthenticatedRequest<GameParams>,
    res: Response,
    next: NextFunction
) {
    // richiama lo state per ricevere informazioni riguargo lo stato della partita
    try {
        const result = await GameService.getGameState(
            req.params.gameId,
            req.user!.id
        );

        return res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}

export async function makeAction(
    req: AuthenticatedRequest<GameParams>,
    res: Response,
    next: NextFunction
) {

    try {
        const result = await GameService.performAction(
            req.params.gameId,
            req.user!.id,
            req.body
        );

        return res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}

export async function makeCountermeasure(
    req: AuthenticatedRequest<GameParams>,
    res: Response,
    next: NextFunction
) {
    try {
        const parsed = countermeasureSchema.safeParse(req.body);

        if (!parsed.success) {
            return next(
                ErrorFactory.badRequest(
                    "Invalid countermeasure data"
                )
            );
        }

        const result =
            await GameService.performCountermeasure(
                req.params.gameId,
                req.user!.id,
                parsed.data
            );

        return res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}

export async function passTurn(
    req: AuthenticatedRequest<GameParams>,
    res: Response,
    next: NextFunction
) {
    try {
        const result = await GameService.passCountermeasure(
            req.params.gameId,
            req.user!.id
        );

        return res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}

export async function getHistory(
    req: AuthenticatedRequest<GameParams>,
    res: Response,
    next: NextFunction
) {
    try {
        const csv = await GameService.getGameHistory(
            req.params.gameId,
            req.user!.id
        );

        return res
            .status(200)
            .type("text/csv")
            .send(csv);
    }
    catch (err) {
        next(err);
    }
}
