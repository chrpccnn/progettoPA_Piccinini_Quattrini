import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { createGame, getGameState, makeAction, makeCountermeasure, passTurn, getHistory } from "../controllers/gameController";
import gameValidatorMiddleware from "../middleware/gameValuesMiddleware"

const router = Router();

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
    makeAction,
);


// esegue una delle contro-azioni (da trovare un nome migliore) possibili
router.post(
    "/:gameId/countermeasure",
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