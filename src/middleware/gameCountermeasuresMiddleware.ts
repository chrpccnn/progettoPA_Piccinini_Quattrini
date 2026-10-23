import { Request, Response, NextFunction } from "express";
import { countermeasureSchema } from "../Zod/zodSchemas"
import { ErrorFactory } from "../errors/ErrorFactory";

export default function gameCountermeasuresMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
){
    // verifica che il json sia impostato correttamente tramite zod
    try{
        req.body = countermeasureSchema.parse(req.body);
        next();
    }
    catch
    {
        next(ErrorFactory.badRequest("Invalid action data"));
    }
}