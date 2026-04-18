import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

// Add video to watch history
const addToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    // $pull first to remove if already exists (avoid duplicates)
    // then $push to add at the end (most recent at end)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) },
        },
    );

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                watchHistory: {
                    $each: [new mongoose.Types.ObjectId(videoId)],
                    $position: 0,  // most recent first
                },
            },
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Added to watch history")
    );
});

// Get watch history
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullName: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" },
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                watchHistory: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            user[0]?.watchHistory || [],
            "Watch history fetched successfully"
        )
    );
});

// Clear entire watch history
const clearWatchHistory = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { watchHistory: [] },
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Watch history cleared successfully")
    );
});

// Remove single video from watch history
const removeFromWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) },
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Video removed from watch history")
    );
});

export {
    addToWatchHistory,
    getWatchHistory,
    clearWatchHistory,
    removeFromWatchHistory,
};