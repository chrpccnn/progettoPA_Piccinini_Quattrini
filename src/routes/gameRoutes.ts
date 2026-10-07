import { Router } from "express";
import authMiddleware, { AuthenticatedRequest } from "../middleware/authMiddleware";
import { userRoleMiddleware } from "../middleware/userRoleMiddleware";
import { createGame }  from "../controllers/gameController";

const router = Router();

router.post(
    "/creategame",
    authMiddleware,
    userRoleMiddleware,
    createGame
);

export default router;