import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    
}, { timestamps: true });

// Prevent duplicate likes
likeSchema.index(
    { likedBy: 1, video: 1 },
    { unique: true, partialFilterExpression: {video: { $exists: true, $ne: null } } }
);

likeSchema.index(
    { likedBy: 1, comment: 1 },
    { unique: true, partialFilterExpression: { comment: { $exists: true, $ne: null } } }
);

// Ensure like targets either a video or a comment
likeSchema.pre("save", function () {
    if (
        (this.video && this.comment) ||
        (!this.video && !this.comment)
    ) {
        throw new Error("Like must be either video OR comment");
    }
});

export const Like = mongoose.model("Like", likeSchema);