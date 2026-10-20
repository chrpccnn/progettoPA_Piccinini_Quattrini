import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ErrorFactory } from "../errors/ErrorFactory";
import { jwtPayloadSchema, JwtPayload } from "../Zod/zodSchemas"
import { getPublicKey } from "../jwtKey";

export interface AuthenticatedRequest<P = {}>
    extends Request<P> {
    user?: JwtPayload;
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

    if (!authHeader.match(/^Bearer\s+(\S+)$/i)) {
        return next(ErrorFactory.invalidToken());
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    const [_, token] = jwt_divide;

    try {
        const decoded = jwt.verify(
        token,
        getPublicKey(),
        {
            algorithms: ["RS256"]
        }
        );
        req.user = jwtPayloadSchema.parse(decoded);
        next();
    }
    catch(err) {
        console.error("JWT VERIFY ERROR:", err);
        return next(ErrorFactory.invalidToken());
    }

}
