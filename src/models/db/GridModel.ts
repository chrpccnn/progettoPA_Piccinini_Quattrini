import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute
} from "sequelize";
import sequelize from "../../config/database";
import { GridCellModel } from "./GridCellModel";

/*
 * Tabella "grids": la griglia 3D di una partita (dimensioni).
 *
 * E' separata da games perche' la griglia e' un oggetto di dominio a se'
 * (interfaccia Grid) con un proprio stato. Oggi c'e' una griglia per
 * partita (gameId unico); se un domani servisse una griglia per giocatore
 * basterebbe togliere il vincolo e aggiungere un riferimento al giocatore.
 */
export class GridModel extends Model<
    InferAttributes<GridModel>,
    InferCreationAttributes<GridModel>
> {
    declare id: CreationOptional<number>;
    declare gameId: string;
    declare width: number;
    declare height: number;
    declare depth: number;

    declare cells?: NonAttribute<GridCellModel[]>;
}

GridModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        gameId: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
        },
        width: { type: DataTypes.INTEGER, allowNull: false },
        height: { type: DataTypes.INTEGER, allowNull: false },
        depth: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
        sequelize,
        tableName: "grids",
        timestamps: false
    }
);
