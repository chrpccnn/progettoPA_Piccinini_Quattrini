import { Router } from "express";
import { getHome } from "../controllers/indexController";


const router = Router();

router.get("/", getHome);


export default router;