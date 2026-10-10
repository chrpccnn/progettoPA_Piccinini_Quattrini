import { Router } from "express";
import authMiddleware, { AuthenticatedRequest } from "../middleware/authMiddleware";
import { userRoleMiddleware } from "../middleware/roleMiddleware";
import { createGame, getGameState, makeAction, makeCountermeasure, passTurn, getHistory } from "../controllers/gameController";
import gameValidatorMiddleware from "../middleware/gameValuesMiddleware"

const router = Router();

// creazione della partita
router.post(
    "/",
    authMiddleware,
    userRoleMiddleware,
    gameValidatorMiddleware,
    createGame,
);

// da in output le informazioni della partita
router.get(
    "/:gameId/state",
    authMiddleware,
    userRoleMiddleware,
    getGameState,
);

// esegue una delle azioni possibili
router.post(
    "/:gameId/action",
    authMiddleware,
    userRoleMiddleware,
    makeAction,
);


// esegue una delle contro-azioni (da trovare un nome migliore) possibili
router.post(
    "/:gameId/countermeasure",
    authMiddleware,
    userRoleMiddleware,
    makeCountermeasure,
);

// fa passare il turno
router.post(
    "/:gameId/pass",
    authMiddleware,
    userRoleMiddleware,
    passTurn
);

// restitusce lo storico
router.get(
    "/:gameId/history",
    authMiddleware,
    userRoleMiddleware,
    getHistory,
);

export default router;