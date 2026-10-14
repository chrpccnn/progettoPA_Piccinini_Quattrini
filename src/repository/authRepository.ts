import { Transaction } from "sequelize";
import { User } from "../models/user"
import { MailSchema } from "../Zod/zodSchemas";

class UserRepository {
    async findByEmail(email: string, transaction?: Transaction) {
        return User.findOne({ where: { email }, transaction });
    }

    async findById(id: number, transaction?: Transaction) {
        return User.findByPk(id, { transaction });
    }

    /*
     * Legge gli utenti bloccando le righe fino al commit (SELECT ... FOR UPDATE),
     * sempre in ordine di id: due richieste concorrenti che coinvolgono gli
     * stessi utenti li bloccano nello stesso ordine e non vanno in deadlock.
     */
    async lockByIds(ids: number[], transaction: Transaction) {
        return User.findAll({
            where: { id: [...new Set(ids)] },
            order: [["id", "ASC"]],
            transaction,
            lock: transaction.LOCK.UPDATE
        });
    }

    async createNewUser(email: string, password: string) {
        return await User.create({
            email,
            password,
            role: "user"
        });
    }

    async save(user: User, transaction?: Transaction) {
        return user.save({ transaction });
    }

    async incrementTokens(
        email: MailSchema,
        tokens: number
    ) {
        const user = await this.findByEmail(email);

        if (!user) {
            return null;
        }

        user.tokens = Number(tokens.toFixed(3));

        return user.save();
    }
}
export default new UserRepository();
