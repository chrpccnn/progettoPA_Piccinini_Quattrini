import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { refill } from "../controllers/refillController";

const router = Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    refill,
);

export default router;