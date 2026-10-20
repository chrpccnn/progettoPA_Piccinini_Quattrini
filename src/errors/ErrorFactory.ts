const { status } = require("http-status");
import { AppError } from "./appError";

export class ErrorFactory {

    static badRequest(
        message = "Bad request"
    ): AppError {
        return new AppError(
            status.BAD_REQUEST,
            message
        );
    }

    static invalidCredentials(): AppError {
        return new AppError(
            status.UNAUTHORIZED,
            "Invalid credentials"
        );
    }

    static insufficientTokens(): AppError {
        return new AppError(
            status.UNAUTHORIZED,
            "Insufficient tokens"
        );
    }

    static missingToken(): AppError {
        return new AppError(
            status.UNAUTHORIZED,
            "Missing token"
        );
    }

    static invalidToken(): AppError {
        return new AppError(
            status.UNAUTHORIZED,
            "Invalid token"
        );
    }

    static forbidden(): AppError {
        return new AppError(
            status.FORBIDDEN,
            "Forbidden"
        );
    }

    static userNotFound(): AppError {
        return new AppError(
            status.NOT_FOUND,
            "User not found"
        );
    }

    static gameNotFound(): AppError {
        return new AppError(
            status.NOT_FOUND,
            "Game not found"
        );
    }

    static userAlreadyExists(): AppError {
        return new AppError(
            status.CONFLICT,
            "Email already exists"
        );
    }

    static userAlreadyInGame(): AppError {
        return new AppError(
            status.CONFLICT,
            "User is already in an active game"
        );
    }

    static opponentAlreadyInGame(): AppError {
        return new AppError(
            status.CONFLICT,
            "Opponent is already in an active game"
        );
    }

    static insufficientEnergy(): AppError {
        return new AppError(
            status.CONFLICT,
            "Insufficient Energy Credits"
        );
    }

    static invalidTokenAmount(): AppError {
        return new AppError(
            status.BAD_REQUEST,
            "Invalid token amount"
        );
    }

    static notImplemented(): AppError {
        return new AppError(
            status.NOT_IMPLEMENTED,
            "Not implemented"
        );
    }
}