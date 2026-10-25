/*
 * Definisce le rotte HTTP per l'autenticazione e la registrazione
 * degli utenti.
 *
 * Il middleware authValidatorMiddleware viene applicato alle rotte
 * del router per validare i dati delle richieste prima che raggiungano
 * i controller.
 *
 * Gli endpoint POST "/register" e POST "/login" delegano
 * rispettivamente la registrazione e l'accesso alle funzioni
 * del controller di autenticazione.
 */
import { Router } from "express";
import { login, register } from "../controllers/authController";
import authValidatorMiddleware from "../middleware/authValidatorMiddleware";

const router = Router();


router.use(authValidatorMiddleware)

// Rimanda alla relativa funzione di registrazione e di login
router.post("/register", register);
router.post("/login", login);


export default router;