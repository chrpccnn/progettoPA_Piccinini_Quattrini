import { AppError } from "./appError";

export class ErrorFactory {
    static invalidTokenAmount(): AppError {
        return new AppError(
            400,
            "Token amount must be greater than zero"
        );
    }
    
    static badRequest(
        message = "Bad request"
    ): AppError {
        return new AppError(400, message);
    }
    
    static invalidCredentials(): AppError {
        return new AppError(401, "Invalid credentials");
    }
    
    static insufficientTokens(): AppError {
        return new AppError(401, "Insufficient tokens");
    }

    static missingToken(): AppError {
        return new AppError(401, "Missing token");
    }

    static invalidToken(): AppError {
        return new AppError(401, "Invalid token");
    }

    static forbidden(): AppError {
        return new AppError(403, "Forbidden");
    }
    
    static userNotFound(): AppError {
        return new AppError(404, "User not found");
    }
    
    static gameNotFound(): AppError {
        return new AppError(404, "Game not found");
    }

    static userAlreadyExists(): AppError {
        return new AppError(409, "Email already exists");
    }
    
    static insufficientEnergy(): AppError {
        return new AppError(409, "Insufficient Energy Credits");
    }

}