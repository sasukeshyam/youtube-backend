import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addToWatchHistory,
    getWatchHistory,
    clearWatchHistory,
    removeFromWatchHistory,
} from "../controllers/watchHistory.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getWatchHistory);
router.post("/:videoId", addToWatchHistory);
router.delete("/clear", clearWatchHistory);
router.delete("/:videoId", removeFromWatchHistory);

export default router;