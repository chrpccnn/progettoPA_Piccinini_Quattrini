import { ErrorFactory } from "../errors/ErrorFactory";
import {
    MailSchema,
    RoleSchema,
    TypeSchema,
    emailSchema,
    id as idSchema
} from "../Zod/zodSchemas";

export interface UserProps {
    id: number;
    email: MailSchema;
    /* Hash bcrypt, mai la password in chiaro. */
    password: string;
    role?: RoleSchema;
    type?: TypeSchema;
    tokens?: number;
    createdAt?: Date;
}

/*
 * Utente di dominio: identita' e saldo TOKEN.
 *
 * Non conosce Sequelize. Per salvarlo e rileggerlo si usa UserRepository,
 * che lo converte da/verso UserModel (models/db/UserModel.ts).
 *
 * Il saldo puo' diventare negativo: la verifica "abbastanza TOKEN" si fa
 * solo alla creazione della partita, le mosse successive non la ripetono.
 */
export class User {

    public readonly id: number;
    public readonly email: MailSchema;
    public readonly password: string;
    public readonly role: RoleSchema;
    public readonly type: TypeSchema;
    public readonly createdAt: Date;

    private tokens: number;

    constructor(props: UserProps) {
        this.id = props.id;
        this.email = props.email;
        this.password = props.password;
        this.role = props.role ?? "user";
        this.type = props.type ?? "player";
        this.tokens = props.tokens ?? 0;
        this.createdAt = props.createdAt ?? new Date();
    }

    public isValid(): boolean {
        return (
            idSchema.safeParse(this.id).success &&
            emailSchema.safeParse(this.email).success
        );
    }

    public getTokens(): number {
        return this.tokens;
    }

    public spendTokens(amount: number): void {
        if (amount <= 0) {
            throw ErrorFactory.invalidTokenAmount();
        }

        this.tokens = Number((this.tokens - amount).toFixed(3));
    }

    public addTokens(amount: number): void {
        if (amount <= 0) {
            throw ErrorFactory.invalidTokenAmount();
        }

        this.tokens = Number((this.tokens + amount).toFixed(3));
    }
}
