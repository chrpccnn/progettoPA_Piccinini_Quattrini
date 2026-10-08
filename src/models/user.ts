import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { UserType } from "./UserType";
import { mailSchema, passwordSchema, roleSchema } from "../Zod/zodSchemas";

export interface UserAttributes {
    id: number;
    email: mailSchema;
    password: passwordSchema;
    role: roleSchema;
    type: UserType;
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
    declare id: number;
    declare email: mailSchema;
    declare password: passwordSchema;
    declare role: roleSchema;
    declare type: UserType;
    declare tokens: number;
    declare createdAt: Date;

    public isValid(): boolean {
        return (
            this.id > 0 &&
            this.email.length > 0 &&
            this.password.length > 0
        );
    }

    public getTokens(): number {
        return Number(this.tokens);
    }

    public spendTokens(amount: number): void {
        if (amount <= 0) {
            throw new Error(
                "The number of tokens must be greater than zero."
            );
        }

        this.tokens = Number(
            (this.getTokens() - amount).toFixed(3)
        );
    }

    public addTokens(amount: number): void {
        if (amount <= 0) {
            throw new Error(
                "The number of tokens must be greater than zero."
            );
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
            type: DataTypes.ENUM("user", "admin"),
            allowNull: false,
            defaultValue: "user",
        },
        type: {
            type: DataTypes.ENUM(...Object.values(UserType)),
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