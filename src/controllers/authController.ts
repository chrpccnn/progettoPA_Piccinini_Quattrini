import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/authService";


export async function register(req: Request, res: Response, next: NextFunction) {
    // Tenta di estrarre email e password dalla richiesta, se riesce manda i dati al service
    try{
        const { email, password } = req.body;
        const result = await AuthService.register(email, password);
        return res.status(201).json(result);
    }
    catch (err)
    {
        next(err)
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    // Tenta di estrarre email e password dalla richiesta, se riesce manda i dati al service
    try{
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        return res.status(200).json(result);
    }
    catch (err)
    {
        next(err)
    }
}