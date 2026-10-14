import { ErrorFactory } from "../errors/ErrorFactory";
import UserRepository from "../repository/authRepository";
import { MailSchema } from "../Zod/zodSchemas";

export class RefillService {

    static async refill(
        email: MailSchema,
        tokens: number
    ) {
        const updated = await UserRepository.incrementTokens(
            email,
            tokens
        );

        if (!updated) {
            throw ErrorFactory.userNotFound();
        }

        return {
            message: "Tokens refilled successfully",
            user: {
                email: updated.email,
                tokens: updated.getTokens()
            }
        };
    }
}