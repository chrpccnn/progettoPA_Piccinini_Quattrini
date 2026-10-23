import { Router } from "express";
import { getHome } from "../controllers/indexController";


const router = Router();
// rimanda al messaggio base
router.get("/", getHome);


export default router;