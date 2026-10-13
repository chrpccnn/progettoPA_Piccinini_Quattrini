import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute
} from "sequelize";
import sequelize from "../../config/database";
import { Orientation } from "../fleet/Orientation";
import { ShipStatus } from "../fleet/ShipStatus";
import { ShipType } from "../fleet/ShipType";
import e from "express";
import { id, es } from "zod/locales";
import { ShipPositionModel } from ".";
import { Ship } from "../fleet/Ship";

 /*
 * Tabella "ships": le navi della flotta di un giocatore.
 *
 * shipKey e' l'id di dominio (Ship.getId()), unico dentro la flotta.
 * status e' ricavabile dalle posizioni colpite, ma lo salviamo per poter
 * interrogare il DB direttamente (es. quante navi sono distrutte).
 */
export class ShipModel extends Model<
    InferAttributes<ShipModel>,
    InferCreationAttributes<ShipModel>
> {
    declare id: CreationOptional<number>;
    declare gamePlayerId: number;
    declare shipKey: string;
    declare type: ShipType;
    declare size: number;
    declare orientation: Orientation;
    declare status: ShipStatus;

    declare positions?: NonAttribute<ShipPositionModel[]>;
}

ShipModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        gamePlayerId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        shipKey: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM(...Object.values(ShipType)),
            allowNull: false
        },
        size: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        orientation: {
            type: DataTypes.ENUM(...Object.values(Orientation)),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(...Object.values(ShipStatus)),
            allowNull: false,
            defaultValue: ShipStatus.INTACT
        }
    },
    {
        sequelize,
        tableName: "ships",
        timestamps: false,
        indexes: [{ unique: true, fields: ["gamePlayerId", "shipKey"] }]
    }
);
