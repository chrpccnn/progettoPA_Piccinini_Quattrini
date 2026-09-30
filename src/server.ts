import "dotenv/config";
import app from "./app";
import sequelize from "./config/database";

const PORT = Number(process.env.PORT || 3000);

const main = async (): Promise<void> => {
    try {
        await sequelize.authenticate();

        console.log("Connessione a MySQL riuscita!");

        app.listen(PORT, () => {
            console.log(`Server avviato sulla porta ${PORT}`);
        });
    } catch (error) {
        console.error("Errore di connessione a MySQL:", error);
        process.exit(1);
    }
};

main();