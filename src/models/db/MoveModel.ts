import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "sequelize";
import sequelize from "../../config/database";
import { ActionType } from "../MoveRecord";

/*
 * Tabella "moves": lo storico delle mosse (una riga per MoveRecord).
 *
 * seq e' la posizione nello storico, parte da 0 e permette di aggiungere
 * solo le mosse nuove ad ogni salvataggio. Da questa tabella si ricava
 * il CSV richiesto dalla specifica (HistoryCsv).
 */
export class MoveModel extends Model<
    InferAttributes<MoveModel>,
    InferCreationAttributes<MoveModel>
> {
    declare id: CreationOptional<number>;
    declare gameId: string;
    declare seq: number;
    declare turn: number;
    declare gamePlayerId: number;
    declare type: ActionType;
    declare x: number | null;
    declare y: number | null;
    declare z: number | null;
    declare cost: number;
    declare result: string | null;
    declare hidden: boolean;
    declare playedAt: Date;
}

MoveModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        gameId: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        seq: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        turn: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        gamePlayerId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM(...Object.values(ActionType)),
            allowNull: false
        },
        x: { type: DataTypes.INTEGER, allowNull: true },
        y: { type: DataTypes.INTEGER, allowNull: true },
        z: { type: DataTypes.INTEGER, allowNull: true },
        cost: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        result: {
            type: DataTypes.STRING(32),
            allowNull: true
        },
        hidden: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        playedAt: {
            type: DataTypes.DATE(3),
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: "moves",
        timestamps: false,
        indexes: [{ unique: true, fields: ["gameId", "seq"] }]
    }
);
