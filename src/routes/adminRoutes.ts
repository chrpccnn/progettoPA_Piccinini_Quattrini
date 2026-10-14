import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { refill } from "../controllers/refillController";
import refillValidatorMiddleware from "../middleware/refillValidatorMiddleware";

const router = Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    refillValidatorMiddleware,
    refill,
);

export default router;