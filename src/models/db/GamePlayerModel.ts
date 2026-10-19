import {
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    Model,
    NonAttribute
} from "sequelize";
import sequelize from "../../config/database";
import { PlayerType } from "../Players/PlayerType";
import { UserModel } from "./UserModel";

/*
 * Tabella "game_players": i due giocatori di una partita.
 *
 * userId e' valorizzato per i giocatori umani e null per l'IA.
 * La flotta non ha una tabella propria perche' Fleet contiene solo un id
 * (fleetId) e le sue navi: l'id sta qui e le navi puntano a questa riga.
 */
export class GamePlayerModel extends Model<
    InferAttributes<GamePlayerModel>,
    InferCreationAttributes<GamePlayerModel>
> {
    declare id: CreationOptional<number>;
    declare gameId: string;
    declare slot: number;
    declare playerKey: string;
    declare fleetId: string;
    declare type: PlayerType;
    declare userId: ForeignKey<number> | null;
    declare energy: number;
    declare silenceUsed: number;

    declare user?: NonAttribute<UserModel>;
}

GamePlayerModel.init(
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
        slot: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        playerKey: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        fleetId: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM(...Object.values(PlayerType)),
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        energy: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        silenceUsed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        sequelize,
        tableName: "game_players",
        timestamps: false,
        indexes: [
            { unique: true, fields: ["gameId", "slot"] },
            { fields: ["userId"] }
        ]
    }
);
