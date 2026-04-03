import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getSubscribedChannels,
    getChannelSubscribers,
    getChannelSubscriptionStatus,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/channel/:channelId", toggleSubscription);
router.get("/", getSubscribedChannels);
router.get("/channel/:channelId/subscribers", getChannelSubscribers);
router.get("/channel/:channelId/status", getChannelSubscriptionStatus);

export default router;