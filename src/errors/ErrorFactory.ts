 import { AppError } from "./appError";

export class ErrorFactory {
    static userAlreadyExists(): AppError {
        return new AppError(409, "Email already exists");
    }

    static invalidCredentials(): AppError {
        return new AppError(401, "Invalid credentials");
    }

    static userNotFound(): AppError {
        return new AppError(404, "User not found");
    }

    static insufficientTokens(): AppError {
        return new AppError(401, "Insufficient tokens");
    }

    static gameNotFound(): AppError {
        return new AppError(404, "Game not found");
    }

    static missingToken(): AppError{
        return new AppError(401, "Missing Token");
    }

    static invalidToken(): AppError{
        return new AppError(401, "Invalid Token");
    }

    static forbidden(): AppError{
        return new AppError(403, "Forbidden");
    }

    static unauthorized(): AppError{
        return new AppError(401, "Unauthorized");
    }

    static badRequest(): AppError{
        return new AppError(400, "Bad request");
    }
}