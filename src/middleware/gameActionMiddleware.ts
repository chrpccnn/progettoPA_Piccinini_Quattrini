import { Request, Response, NextFunction } from "express";
import {actionSchema} from "../Zod/zodSchemas"
import { ErrorFactory } from "../errors/ErrorFactory";

export default function gameActionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
){
    // verifica che il json sia impostato correttamente tramite zod
    try{
        req.body = actionSchema.safeParse(req.body);
        next();
    }
    catch
    {
        next(ErrorFactory.badRequest("Invalid action data"));
    }
}