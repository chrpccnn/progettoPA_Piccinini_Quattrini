import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "sequelize";
import sequelize from "../../config/database";

/*
 * Tabella "shields": gli scudi attivi di ogni giocatore.
 * Una riga sparisce quando lo scudo assorbe un colpo.
 */
export class ShieldModel extends Model<
    InferAttributes<ShieldModel>,
    InferCreationAttributes<ShieldModel>
> {
    declare id: CreationOptional<number>;
    declare gamePlayerId: number;
    declare x: number;
    declare y: number;
    declare z: number;
}

ShieldModel.init(
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
        x: { type: DataTypes.INTEGER, allowNull: false },
        y: { type: DataTypes.INTEGER, allowNull: false },
        z: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
        sequelize,
        tableName: "shields",
        timestamps: false,
        indexes: [{ unique: true, fields: ["gamePlayerId", "x", "y", "z"] }]
    }
);
