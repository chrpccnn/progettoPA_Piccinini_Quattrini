import express from "express";
import router from "./routes";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.use(logger);

app.use("/", router);

app.use(errorHandler);

export default app;