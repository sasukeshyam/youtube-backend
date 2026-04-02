import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // NEW FIELD (for nested replies)
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    }

}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema);