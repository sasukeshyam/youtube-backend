import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createPlaylist);
router.get("/user/:userId", getUserPlaylists);
router.get("/:playlistId", getPlaylistById);
router.patch("/:playlistId", updatePlaylist);
router.delete("/:playlistId", deletePlaylist);
router.post("/:playlistId/video/:videoId", addVideoToPlaylist);
router.delete("/:playlistId/video/:videoId", removeVideoFromPlaylist);

export default router;