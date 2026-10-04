import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface UserAttributes {
    id: number;
    email: string;
    password: string;
    role: "user" | "admin";
}

export interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

export class User
    extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes
    {
        declare id: number;
        declare email: string;
        declare password: string;
        declare role: "user" | "admin";
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
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  }
);