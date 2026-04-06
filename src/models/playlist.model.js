import mongoose, {Schema} from "mongoose";
import { User } from "./user.model.js";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    videos: [
        {
        type: Schema.Types.ObjectId,
        ref: "videos"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

},{timestamps: true});

export const Playlist = mongoose.model("Playlist", playlistSchema);