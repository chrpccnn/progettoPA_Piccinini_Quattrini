import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ErrorFactory } from "../errors/ErrorFactory";
import { jwtPayloadSchema } from "../Zod/zodSchemas"

export interface AuthenticatedRequest<P = {}> extends Request<P> {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

export default function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(ErrorFactory.missingToken());;
    }

    const jwt_divide = authHeader.split(" ");

    if (jwt_divide.length !== 2 || jwt_divide[0] !== "Bearer") {
        return next(ErrorFactory.invalidToken());
    }

    const [_, token] = jwt_divide;
    const secret = process.env.JWT_SECRET || "default_secret";

    try {
        const decoded = jwt.verify(token, secret);
        req.user = jwtPayloadSchema.parse(decoded);
        next();
    }
    catch {
        return next(ErrorFactory.invalidToken());
    }

}
