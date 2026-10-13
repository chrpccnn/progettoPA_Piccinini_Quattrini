import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "sequelize";
import sequelize from "../../config/database";

/*
 * Tabella "ship_positions": le celle occupate da una nave.
 *
 * idx conserva l'ordine delle posizioni: Move usa la prima come origine
 * dello spostamento, quindi l'ordine va ripristinato identico.
 * hit vale true se quella cella e' stata colpita.
 */
export class ShipPositionModel extends Model<
    InferAttributes<ShipPositionModel>,
    InferCreationAttributes<ShipPositionModel>
> {
    declare id: CreationOptional<number>;
    declare shipId: number;
    declare idx: number;
    declare x: number;
    declare y: number;
    declare z: number;
    declare hit: boolean;
}

ShipPositionModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        shipId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        idx: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        x: { type: DataTypes.INTEGER, allowNull: false },
        y: { type: DataTypes.INTEGER, allowNull: false },
        z: { type: DataTypes.INTEGER, allowNull: false },
        hit: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        tableName: "ship_positions",
        timestamps: false,
        indexes: [{ unique: true, fields: ["shipId", "idx"] }]
    }
);
