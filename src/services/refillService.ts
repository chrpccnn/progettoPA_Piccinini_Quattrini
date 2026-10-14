import { ErrorFactory } from "../errors/ErrorFactory";
import UserRepository from "../repository/authRepository";

export class RefillService {

    static async refill(
        userId: number,
        tokens: number
    ) {
        const updated = await UserRepository.incrementTokens(
            userId,
            tokens
        );

        if (!updated) {
            throw ErrorFactory.userNotFound();
        }

        return {
            message: "Tokens refilled successfully"
        };
    }
}