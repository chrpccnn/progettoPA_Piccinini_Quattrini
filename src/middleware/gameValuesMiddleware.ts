import { Request, Response, NextFunction } from "express";
import {gameSchema} from "../Zod/zodSchemas"
import { ErrorFactory } from "../errors/ErrorFactory";

export default function gameValidatorMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
){
    // verifica che il json sia impostato correttamente tramite zod
    try{
        req.body = gameSchema.parse(req.body);
        next();
    }
    catch
    {
        next(ErrorFactory.badRequest());
    }
}