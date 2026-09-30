import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    process.env.MSQLDB || "my_db",
    process.env.MSQLUSR || "my_user",
    process.env.MSQLPSW || "my_password",
    {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 3306),
        dialect: "mysql",
        logging: false
    }
);

export default sequelize;