import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
    uploadVideo,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideo,
    togglePublish,
    getMyVideos
} from "../controllers/video.controller.js";

const router = Router();

// Upload video
router.post(
    "/upload",
    verifyJWT,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    uploadVideo
);

// Public routes
router.get("/", getAllVideos);
router.get("/:id", getVideoById);

// Protected routes
router.get("/my/videos", verifyJWT, getMyVideos);
router.delete("/:id", verifyJWT, deleteVideo);
router.patch("/:id", verifyJWT, updateVideo);
router.patch("/toggle/:id", verifyJWT, togglePublish);

export default router;