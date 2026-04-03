import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

// Toggle subscribe/unsubscribe to a channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Can't subscribe to yourself
    if (req.user._id.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
        );
    }

    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
    });

    return res.status(201).json(
        new ApiResponse(201, { subscribed: true }, "Subscribed successfully")
    );
});

// Get all channels a user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({
        subscriber: req.user._id,
    })
        .populate("channel", "username avatar fullName")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully")
    );
});

// Get all subscribers of a channel
const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar fullName")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscribers,
                subscriberCount: subscribers.length,
            },
            "Subscribers fetched successfully"
        )
    );
});

// Get subscription status + subscriber count for a channel
const getChannelSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const [subscriberCount, isSubscribed] = await Promise.all([
        Subscription.countDocuments({ channel: channelId }),
        Subscription.exists({ channel: channelId, subscriber: req.user._id }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscriberCount,
                subscribed: !!isSubscribed,
            },
            "Subscription status fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getSubscribedChannels,
    getChannelSubscribers,
    getChannelSubscriptionStatus,
};