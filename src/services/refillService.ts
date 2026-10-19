
import { ErrorFactory } from "../errors/ErrorFactory";
import UserRepository from "../repository/authRepository";
import { MailSchema } from "../Zod/zodSchemas";

export class RefillService {

    static async refill(
        email: MailSchema,
        tokens: number
    ) {
        const user = await UserRepository.findByEmail(email);

        if (!user) {
            throw ErrorFactory.userNotFound();
        }

        const updated = await UserRepository.incrementTokens(
            user.id,
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
