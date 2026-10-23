import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { createGame, getGameState, makeAction, makeCountermeasure, passTurn, getHistory } from "../controllers/gameController";
import gameValidatorMiddleware from "../middleware/gameValuesMiddleware"
import gameActionMiddleware from "../middleware/gameActionMiddleware"
import gameCountermeasuresMiddleware from "../middleware/gameCountermeasuresMiddleware";
import gameParamsMiddleware from "../middleware/gameParamsMiddleware";

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
    gameParamsMiddleware,
    getGameState,
);

// esegue una delle azioni possibili
router.post(
    "/:gameId/action",
    gameParamsMiddleware,
    gameActionMiddleware,
    makeAction,
);


// esegue una delle contromosse possibili
router.post(
    "/:gameId/countermeasure",
    gameParamsMiddleware,
    gameCountermeasuresMiddleware,
    makeCountermeasure,
);

// fa passare il turno
router.post(
    "/:gameId/pass",
    gameParamsMiddleware,
    passTurn
);

// restitusce lo storico
router.get(
    "/:gameId/history",
    gameParamsMiddleware,
    getHistory,
);

export default router;