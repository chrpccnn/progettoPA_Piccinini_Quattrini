import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export default function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({ error: "Token mancante" });
    }

    const jwt_divide = authHeader.split(" ");

    if (jwt_divide.length !== 2 || jwt_divide[0] !== "Bearer") {
        return res.status(401).json({ error: "Token non valido" });
    }

    const [_, token] = jwt_divide;
    const secret = process.env.JWT_SECRET || "default_secret";

    try{ 
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } 
    catch (err)
    {
        return res.status(403).json({ error: "Token non valido"});
    }

}
