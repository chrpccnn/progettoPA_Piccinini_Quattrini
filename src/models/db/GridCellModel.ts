import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "sequelize";
import sequelize from "../../config/database";
import { CellState } from "../grid/Cell";

/*
 * Tabella "grid_cells": lo stato delle celle della griglia.
 *
 * Salviamo solo le celle diverse da EMPTY, come fa MapGrid (che per le
 * celle assenti restituisce EMPTY): una griglia 20x20x20 ha 8000 celle,
 * ma quelle occupate o colpite sono poche decine.
 */
export class GridCellModel extends Model<
    InferAttributes<GridCellModel>,
    InferCreationAttributes<GridCellModel>
> {
    declare id: CreationOptional<number>;
    declare gridId: number;
    declare x: number;
    declare y: number;
    declare z: number;
    declare state: CellState;
}

GridCellModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        gridId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        x: { type: DataTypes.INTEGER, allowNull: false },
        y: { type: DataTypes.INTEGER, allowNull: false },
        z: { type: DataTypes.INTEGER, allowNull: false },
        state: {
            type: DataTypes.ENUM(...Object.values(CellState)),
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: "grid_cells",
        timestamps: false,
        indexes: [{ unique: true, fields: ["gridId", "x", "y", "z"] }]
    }
);
