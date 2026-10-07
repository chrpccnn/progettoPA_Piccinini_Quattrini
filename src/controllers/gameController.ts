import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function createGame(req:AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        return res.status(200).json({
            message: "Utente autorizzato alla creazione della partita",
            user: req.user
        });
    } catch (err) {
        next(err);
    }
}