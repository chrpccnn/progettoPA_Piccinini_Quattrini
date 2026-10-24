import express from "express";
import router from "./routes";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import gameRoutes from "./routes/gameRoutes";
import adminRoutes from "./routes/adminRoutes"

const app = express();

// Middleware di Express: trasforma il body in JSON
app.use(express.json());

// Middleeare globale, eseguito ad ogni rotta
app.use(logger);

// health check
app.use("/", router);
// Rotte di autenticazione
app.use("/auth", authRoutes);
// Rotte di gioco
app.use("/game", gameRoutes);
// Rotta dedicata al refill
app.use("/refill", adminRoutes);

// Errore di rotta
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});

app.use(errorHandler);

export default app;