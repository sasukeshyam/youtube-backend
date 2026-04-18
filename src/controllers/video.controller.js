import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";        
import { Notification } from "../models/notification.model.js";        
import { io, onlineUsers } from "../app.js";                           

// Upload video
const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUpload) {
        throw new ApiError(500, "Video upload failed");
    }

    const video = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload?.url || "",
        title,
        description,
        duration: videoUpload.duration || 0,
        owner: req.user._id,
    });

    // ✅ Notify subscribers
    const subscribers = await Subscription.find({
        channel: req.user._id,
    }).select("subscriber");

    if (subscribers.length > 0) {
        // Save notifications in DB for all subscribers (including offline)
        const notifications = subscribers.map((sub) => ({
            recipient: sub.subscriber,
            sender: req.user._id,
            type: "NEW_VIDEO",
            video: video._id,
            message: `${req.user.username} uploaded a new video: ${video.title}`,
        }));

        await Notification.insertMany(notifications);

        // Emit to online subscribers instantly
        subscribers.forEach((sub) => {
            const socketId = onlineUsers.get(sub.subscriber.toString());
            if (socketId) {
                io.to(socketId).emit("newNotification", {
                    message: `${req.user.username} uploaded a new video: ${video.title}`,
                    video: {
                        _id: video._id,
                        title: video.title,
                        thumbnail: video.thumbnail,
                    },
                    sender: {
                        username: req.user.username,
                        avatar: req.user.avatar,
                    },
                });
            }
        });
    }

    return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully")
    );
});

// Get all videos (paginated)
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const videos = await Video.find({ isPublished: true })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
});

// Get single video + increment view
const getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findOneAndUpdate(
        { _id: id, isPublished: true },
        { $inc: { views: 1 } },
        { new: true }
    ).populate("owner", "username avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});

// Update video
const updateVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")  //  was returning old video
    );
});

// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {  //  added () to toString
        throw new ApiError(403, "Unauthorized");
    }

    await video.deleteOne();  //  was Video.deleteOne() with no filter

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

// Toggle publish
const togglePublish = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {  // added () to toString
        throw new ApiError(403, "Unauthorized");
    }

    video.isPublished = !video.isPublished;  //  was !== instead of = !
    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Publish status updated")
    );
});

// Get my videos
const getMyVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({ owner: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, videos, "User videos fetched successfully")
    );
});

export {
    uploadVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublish,
    getMyVideos,
};