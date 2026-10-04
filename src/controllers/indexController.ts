import { Request, Response } from "express";
import { getWelcomeMessage } from "../services/indexService";

export const getHome = (req: Request, res: Response): void => {
    const message = getWelcomeMessage();

    res.json({
        message,
        method: req.method,
        url: req.url
    });
};