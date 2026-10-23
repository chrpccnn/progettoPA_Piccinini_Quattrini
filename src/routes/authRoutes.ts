import { Router } from "express";
import { login, register } from "../controllers/authController"; 

const router = Router();

// Rimanda alla relativa funzione di registrazione e di login
router.post("/register", register);
router.post("/login", login);


export default router;