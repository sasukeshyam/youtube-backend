import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"

//add comment
const addComment = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { content, parentId } = req.body;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }

    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required")
    }

    const videoExists = await Video.exists({_id: videoId})

    if(!videoExists){
        throw new ApiError(400, "Video not found")
    }

    // Validate parent comment (if reply)
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
        throw new ApiError(400, "Invalid parent comment ID");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id,
        parent: parentId || null
    })

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment added Successfully")
    );
});

// get comment by video
const getCommentsByVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video Id");
    }

    page = Math.max(1, parseInt(page))
    limit = Math.min(50, parseInt(limit))

    const skip = (page - 1) * limit

    //  Get top-level comments
    const comments = await Comment.find({
        video: videoId,
        parent: null
    })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    //  Get replies for each comment
    const commentIds = comments.map(c => c._id);

    const replies = await Comment.find({
        parent: { $in: commentIds }
    })
        .populate("owner", "username avatar")
        .lean();

    //  Attach replies to comments
    const repliesMap = {};

    replies.forEach(reply => {
        if (!repliesMap[reply.parent]) {
            repliesMap[reply.parent] = [];
        }
        repliesMap[reply.parent].push(reply);
    });

    const finalComments = comments.map(comment => ({
        ...comment,
        replies: repliesMap[comment._id] || []
    }));

    const total = await Comment.countDocuments({
        video: videoId,
        parent: null
    });

    return res.status(200).json(
        new ApiResponse(200, {
            comments: finalComments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }, "Comments fetched successfully")
    );
});

// Delete Comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

//  Update Comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    //  Only owner can edit
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    comment.content = content.trim();
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

export {
    addComment,
    getCommentsByVideo,
    deleteComment,
    updateComment
};

