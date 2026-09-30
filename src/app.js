"use strict";

const express = require("express");
const { Sequelize } = require("sequelize");

const app = express();

const PORT = process.env.PORT || 3000;

const sequelize = new Sequelize(
    process.env.DB_NAME || "my_db",
    process.env.DB_USER || "my_user",
    process.env.DB_PASSWORD || "my_password",
    {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql"
    }
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Backend funzionante!"
    });
});

const main = async () => {
    try {
        await sequelize.authenticate();

        console.log("Connection has been established successfully.");

        app.listen(PORT, () => {
            console.log(`Server avviato sulla porta ${PORT}`);
        });
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
};

main();