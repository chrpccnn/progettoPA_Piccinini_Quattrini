import { Router } from "express";
import { login, register } from "../controllers/authController"; 
import authMiddleware, { AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/test", authMiddleware, (req: AuthenticatedRequest, res) => {
  return res.json({
    message: "Accesso consentito!",
    user: req.user,
  });
});

export default router;