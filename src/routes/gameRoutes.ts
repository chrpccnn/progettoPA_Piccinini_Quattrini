import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { createGame, getGameState, makeAction, makeCountermeasure, passTurn, getHistory } from "../controllers/gameController";
import gameValidatorMiddleware from "../middleware/gameValuesMiddleware"
import gameActionMiddleware from "../middleware/gameActionMiddleware"
import gameCountermeasuresMiddleware from "../middleware/gameCountermeasuresMiddleware";

const router = Router();

// per ogni rotta sottostante controlla che l'utente sia autenticato e un utente "user"
router.use(
    authMiddleware,
    roleMiddleware("user")
)

// creazione della partita
router.post(
    "/",
    gameValidatorMiddleware,
    createGame,
);

// da in output le informazioni della partita
router.get(
    "/:gameId/state",
    getGameState,
);

// esegue una delle azioni possibili
router.post(
    "/:gameId/action",
    gameActionMiddleware,
    makeAction,
);


// esegue una delle contromosse possibili
router.post(
    "/:gameId/countermeasure",
    gameCountermeasuresMiddleware,
    makeCountermeasure,
);

// fa passare il turno
router.post(
    "/:gameId/pass",
    passTurn
);

// restitusce lo storico
router.get(
    "/:gameId/history",
    getHistory,
);

export default router;