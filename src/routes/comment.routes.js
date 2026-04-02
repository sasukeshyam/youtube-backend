import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    addComment,
    getCommentsByVideo,
    deleteComment,
    updateComment
    
} from "../controllers/comment.controller.js";

const router = Router();

//add comment
router.post("/:videoId", verifyJWT, addComment);

//get comment of a video
router.get("/:videoId", verifyJWT, getCommentsByVideo);

//delete comment
router.delete("/:commentId", verifyJWT, deleteComment);

// update comment
router.patch("/:commentId", verifyJWT, updateComment);

export default router;