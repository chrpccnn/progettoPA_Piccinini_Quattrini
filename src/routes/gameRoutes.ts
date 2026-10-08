import { Router } from "express";
import authMiddleware, { AuthenticatedRequest } from "../middleware/authMiddleware";
import { userRoleMiddleware } from "../middleware/roleMiddleware";
import { createGame }  from "../controllers/gameController";
import gameValidatorMiddleware from "../middleware/gameValuesMiddleware"

const router = Router();

router.post(
    "/creategame",
    authMiddleware,
    userRoleMiddleware,
    gameValidatorMiddleware,
    createGame
);

export default router;