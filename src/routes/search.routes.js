import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { searchVideos } from "../controllers/search.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/", searchVideos);

export default router;
