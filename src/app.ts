import express from "express";
import router from "./routes";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import gameRoutes from "./routes/gameRoutes";

const app = express();

// Middleware di Express: trasforma il body in JSON
app.use(express.json());

// Middleeare globale, eseguito ad ogni rotta
app.use(logger);

app.use("/", router);
app.use("/", gameRoutes);

app.use("/auth", authRoutes)

app.use(errorHandler);

export default app;