import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";


// Toggle like on a video
const toggleVideoLike = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const videoExists = await Video.exists({ _id: videoId });
    if(!videoExists){
        throw new ApiError(400, "Video not found")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    });

    if(existingLike){
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, {liked: false}, "Video unliked Successfully")
        );
    }

    await Like.create({
        likedBy: req.user._id,
        video: videoId,
    });

    return res.status(200).json(
        new ApiResponse(200, {liked: true}, "Video liked Successfully")
    );
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment ID")
    }

    const commentExists = await Comment.exists({ _id: commentId });
    if(!commentExists){
        throw new ApiError(400, "Comment not found")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId
    });

    if(existingLike){
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, {like: false}, "Comment unliked Successfully")
        );
    }

    await Like.create({
        likedBy: req.user._id,
        comment: commentId,
    });

    return res.status(200).json(
        new ApiResponse(200, {liked: true}, "Comment liked Successfully")
    );
});

// Get all liked videos by logged-in user
const getLikedVideos = asyncHandler(async(req, res) => {
    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $ne: null },
    })
        .populate({
            path: "video",
            select: "title thumbnail duration views owner",
            populate: {
                path: "owner",
                select: "username avatar"
            },
        })
        .sort({ createdAt: -1 })
        .lean();

    // Filter out likes where video was deleted
    const validLikes = likedVideos.filter((like) => like.video !== null);

    return res.status(200).json(
        new ApiResponse(200, validLikes, "Liked videos fetched successfully")
    );
})

// Get like count + whether current user liked a video
const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const [likeCount, userLiked] = await Promise.all([
        Like.countDocuments({ video: videoId }),
        Like.exists({ video: videoId, likedBy: req.user._id }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { likeCount, liked: !!userLiked },
            "Like status fetched successfully"
        )
    );
});

export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos,
    getVideoLikeStatus,
};