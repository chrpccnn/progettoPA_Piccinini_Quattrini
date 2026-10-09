import { Request, Response, NextFunction } from "express";
import {gameSchema} from "../Zod/zodSchemas"
import { ErrorFactory } from "../errors/errorFactory";

export default function gameValidatorMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
){
    try{
        req.body = gameSchema.parse(req.body);
        next();
    }
    catch
    {
        next(ErrorFactory.badRequest());
    }
}