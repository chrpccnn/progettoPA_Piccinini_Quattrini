/*
 * Definisce le rotte HTTP dedicate alla ricarica dei TOKEN degli utenti.
 *
 * L'endpoint POST "/" richiede che la richiesta provenga da un utente
 * autenticato con ruolo admin e che i dati della ricarica superino
 * la validazione prima di essere elaborati dal controller refill.
 *
 * La logica applicativa della ricarica è delegata al controller,
 * mentre autenticazione, autorizzazione e validazione sono gestite
 * dai rispettivi middleware.
 */
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