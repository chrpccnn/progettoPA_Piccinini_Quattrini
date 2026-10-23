import { Transaction } from "sequelize";
import { UserModel } from "../models/db/UserModel";
import { User } from "../models/user";

/*
 * Unico punto che parla con la tabella users. Restituisce sempre oggetti
 * di dominio User, mai righe Sequelize, cosi' Service e dominio non
 * dipendono da UserModel.
 */
class UserRepository {

    toDomain(row: UserModel): User {
        return new User({
            id: row.id,
            email: row.email,
            password: row.password,
            role: row.role,
            type: row.type,
            tokens: Number(row.tokens),
            createdAt: row.createdAt
        });
    }

    /**Find database row through email */
    async findByEmail(
        email: string,
        transaction?: Transaction
    ): Promise<User | undefined> {
        const row = await UserModel.findOne({ where: { email }, transaction });

        return row === null ? undefined : this.toDomain(row);
    }

    /**Find database row through Id */
    async findById(
        id: number,
        transaction?: Transaction
    ): Promise<User | undefined> {
        const row = await UserModel.findByPk(id, { transaction });

        return row === null ? undefined : this.toDomain(row);
    }

    /*
     * Legge gli utenti bloccando le righe fino al commit (SELECT ... FOR UPDATE),
     * sempre in ordine di id: due richieste concorrenti che coinvolgono gli
     * stessi utenti li bloccano nello stesso ordine e non vanno in deadlock.
     */
    async lockByIds(
        ids: number[],
        transaction: Transaction
    ): Promise<User[]> {
        const rows = await UserModel.findAll({
            where: { id: [...new Set(ids)] },
            order: [["id", "ASC"]],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        return rows.map(row => this.toDomain(row));
    }

    /**Create a new User in database*/
    async createNewUser(
        email: string,
        passwordHash: string
    ): Promise<User> {
        const row = await UserModel.create({
            email,
            password: passwordHash,
            role: "user"
        });

        return this.toDomain(row);
    }

    /*
     * L'unico dato di un utente che cambia durante il gioco e' il saldo.
     */
    /**Change token's database row for each turn */
    async saveTokens(
        user: User,
        transaction?: Transaction
    ): Promise<void> {
        await UserModel.update(
            { tokens: user.getTokens() },
            { where: { id: user.id }, transaction }
        );
    }

    
    async incrementTokens(
        userId: number,
        amount: number,
        transaction?: Transaction
    ): Promise<User | undefined> {
        const row = await UserModel.findByPk(userId, { transaction });

        if (row === null) {
            return undefined;
        }

        await row.increment("tokens", {
            by: amount,
            transaction
        });

        await row.reload({ transaction });

        return this.toDomain(row);
    }
}


export default new UserRepository();
