import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos,
    getVideoLikeStatus,
} from "../controllers/like.controller.js";

const router = Router();

// router.use(verifyJWT); // All like routes require auth

router.post("/video/:videoId",verifyJWT, toggleVideoLike);
router.post("/comment/:commentId",verifyJWT, toggleCommentLike);
router.get("/videos", verifyJWT, getLikedVideos);
router.get("/video/:videoId/status", verifyJWT, getVideoLikeStatus);

export default router;