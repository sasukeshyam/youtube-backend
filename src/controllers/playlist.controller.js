import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";

//create playlist
const createPlaylist = asyncHandler(async(req, res) => {
    const { name, discription } = req.body

    if(!name?.trim()){
        throw new ApiError(400, "Playlist name is required")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        discription: discription.trim() || "",
        video: [],
        owner: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist created Successfully")
    );
});

//get all playlist of the user
const getUserPlaylists = asyncHandler(async(req, res) => {
    const { userId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, "Invalid user Id")
    }

    const playlist = await Playlist.find({ owner: userId })
        .populate("videos", "title thumbnail duration views")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched Successfully")
    );
});

//get playlist by id
const getPlaylistById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist Id") 
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            select: "title thumbnail duration views owner",
            populate: {
                path: "owner",
                select: "username avatar"
            }
        })
        .populate("owner", "username avatar fullname")
        .lean()
    
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
})

// add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    //  $addToSet prevents duplicates atomically — no includes() needed
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: new mongoose.Types.ObjectId(videoId) }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    );
});

//remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    //  Use $pull instead of .filter() — atomic + no ObjectId/String mismatch
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: new mongoose.Types.ObjectId(videoId) }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    );
});

// Update playlist name/description
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    playlist.name = name.trim();
    playlist.description = description?.trim() || playlist.description;
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    );
});

// Delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    await playlist.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
};