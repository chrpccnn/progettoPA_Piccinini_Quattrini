import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { UserRole, UserType } from "./UserType";
import { MailSchema, PasswordSchema, RoleSchema, TypeSchema, emailSchema, pwSchema, id, IdSchema} from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/errorFactory";

export interface UserAttributes {
    id: number;
    email: MailSchema;
    password: PasswordSchema;
    role: RoleSchema;
    type: TypeSchema;
    tokens: number;
    createdAt: Date;
}

export interface UserCreationAttributes
    extends Optional<
        UserAttributes,
        "id" | "createdAt" | "type" | "tokens"
    > {}

export class User
    extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes
{
    declare id: IdSchema;
    declare email: MailSchema;
    declare password: PasswordSchema;
    declare role: RoleSchema;
    declare type: TypeSchema;
    declare tokens: number;
    declare createdAt: Date;

    public isValid(): boolean {
        return (
            id.safeParse(this.id).success &&
            emailSchema.safeParse(this.email).success &&
            pwSchema.safeParse(this.password).success
        );
    }

    public getTokens(): number {
        return Number(this.tokens);
    }

    public spendTokens(amount: number): void {
        if (amount <= 0) {
           throw ErrorFactory.forbidden();
        }

        this.tokens = Number(
            (this.getTokens() - amount).toFixed(3)
        );
    }

    public addTokens(amount: number): void {
        if (amount <= 0) {
            throw ErrorFactory.forbidden();
        }

        this.tokens = Number(
            (this.getTokens() + amount).toFixed(3)
        );
    }

    public spendToken(): void {
        this.spendTokens(1);
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: {
                    args: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    msg: "Formato email non valido",
                },
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(UserRole.ADMIN, UserRole.USER),
            allowNull: false,
            defaultValue: UserRole.USER,
        },
        type: {
            type: DataTypes.ENUM(UserType.ADMIN, UserType.PLAYER),
            allowNull: false,
            defaultValue: UserType.PLAYER,
        },
        tokens: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: "users",
        timestamps: true,
    }
);