import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/authService";

export async function login(req: Request, res: Response, next: NextFunction) {
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

export async function register(req: Request, res: Response, next: NextFunction) {
    try{
        const { email, password, role } = req.body;
        const result = await AuthService.register(email, password, role);
        return res.status(201).json(result);
    }
    catch (err)
    {
        next(err)
    }
}