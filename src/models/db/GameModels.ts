import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "sequelize";
import sequelize from "../../config/database";
import { GameState } from "../Engine/GameState";
import { GameMode } from "../UserType";

/*
 * Tabella "games": una riga per ogni partita.
 *
 * Contiene lo stato "scalare" della partita (stato, turno, giocatore
 * di turno, vincitore, configurazione Energy e silence, azione in attesa
 * di risoluzione). Tutto quello che e' una lista (giocatori, navi, scudi,
 * mosse, celle della griglia) sta in tabelle dedicate.
 *
 * I giocatori sono richiamati tramite "slot" (0 = creatore, 1 = avversario,
 * come l'indice nell'array Game.players) e non tramite chiave esterna:
 * games e game_players si riferirebbero a vicenda e la creazione delle
 * tabelle diventerebbe circolare.
 */
export class GameModel extends Model<
    InferAttributes<GameModel>,
    InferCreationAttributes<GameModel>
> {
    declare id: string;
    declare mode: GameMode;
    declare state: GameState;
    declare turn: number;
    declare currentPlayerSlot: number;
    declare winnerSlot: number | null;

    declare creatorId: number;

    declare silence: number;
    declare energyInitial: number;
    declare energyMax: number;
    declare energyRegeneration: number;
    declare allowedOrientations: string[];

    /* Azione in attesa di PASS o contromisura (null se non ce n'e'). */
    declare pendingType: "ATTACK" | "SCAN" | null;
    declare pendingPlayerSlot: number | null;
    declare pendingX: number | null;
    declare pendingY: number | null;
    declare pendingZ: number | null;
    declare pendingOccupiedCells: number | null;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

GameModel.init(
    {
        id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        mode: {
            type: DataTypes.ENUM(...Object.values(GameMode)),
            allowNull: false
        },
        state: {
            type: DataTypes.ENUM(...Object.values(GameState)),
            allowNull: false,
            defaultValue: GameState.WAITING
        },
        turn: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        currentPlayerSlot: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        winnerSlot: {
            type: DataTypes.TINYINT,
            allowNull: true
        },
        creatorId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        silence: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        energyInitial: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        energyMax: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        energyRegeneration: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        allowedOrientations: {
            type: DataTypes.JSON,
            allowNull: false
        },
        pendingType: {
            type: DataTypes.ENUM("ATTACK", "SCAN"),
            allowNull: true
        },
        pendingPlayerSlot: {
            type: DataTypes.TINYINT,
            allowNull: true
        },
        pendingX: { type: DataTypes.INTEGER, allowNull: true },
        pendingY: { type: DataTypes.INTEGER, allowNull: true },
        pendingZ: { type: DataTypes.INTEGER, allowNull: true },
        pendingOccupiedCells: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE
    },
    {
        sequelize,
        tableName: "games",
        timestamps: true,
        indexes: [{ fields: ["state"] }, { fields: ["creatorId"] }]
    }
);
