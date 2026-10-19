import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "sequelize";
import sequelize from "../../config/database";
import { UserRole, UserType } from "../UserType";
import { RoleSchema, TypeSchema } from "../../Zod/zodSchemas";

/*
 * Tabella "users": solo persistenza, nessuna regola di gioco.
 *
 * I TOKEN, il loro addebito e la loro ricarica stanno nella classe di
 * dominio User (models/user.ts). UserRepository traduce tra le due.
 * tokens e' DECIMAL(10,3) senza UNSIGNED: il saldo puo' diventare negativo.
 * Il driver mysql2 restituisce i DECIMAL come stringa, quindi il tipo
 * e' number | string e la conversione in number si fa nel repository.
 */
export class UserModel extends Model<
    InferAttributes<UserModel>,
    InferCreationAttributes<UserModel>
> {
    declare id: CreationOptional<number>;
    declare email: string;
    declare password: string;
    declare role: CreationOptional<RoleSchema>;
    declare type: CreationOptional<TypeSchema>;
    declare tokens: CreationOptional<number | string>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

UserModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: {
                    args: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    msg: "Formato email non valido"
                }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM(UserRole.ADMIN, UserRole.USER),
            allowNull: false,
            defaultValue: UserRole.USER
        },
        type: {
            type: DataTypes.ENUM(UserType.ADMIN, UserType.PLAYER),
            allowNull: false,
            defaultValue: UserType.PLAYER
        },
        tokens: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            defaultValue: 0
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: DataTypes.DATE
    },
    {
        sequelize,
        tableName: "users",
        timestamps: true
    }
);
