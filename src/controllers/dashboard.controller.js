import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";

// Get channel stats
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    const [
        totalVideos,
        totalSubscribers,
        videoStats,
    ] = await Promise.all([
        // Total videos uploaded
        Video.countDocuments({ owner: channelId }),

        // Total subscribers
        Subscription.countDocuments({ channel: channelId }),

        // Total views + total likes across all videos
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                },
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: { $size: "$likes" } },
                },
            },
        ]),
    ]);

    const stats = {
        totalVideos,
        totalSubscribers,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: videoStats[0]?.totalLikes || 0,
    };

    return res.status(200).json(
        new ApiResponse(200, stats, "Channel stats fetched successfully")
    );
});

// Get all videos of the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;
    let { page = 1, limit = 10 } = req.query;

    page = Math.max(1, parseInt(page));
    limit = Math.min(50, parseInt(limit));

    const [videos, total] = await Promise.all([
        Video.find({ owner: channelId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Video.countDocuments({ owner: channelId }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
            "Channel videos fetched successfully"
        )
    );
});

export {
    getChannelStats,
    getChannelVideos,
};