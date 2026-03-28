import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";


// for uplode video file
const uploadVideo = asyncHandler(async(req, res) => {
    const {title, description} = req.body;
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);

    if(!title || !description){
        throw new ApiError(400, "Title and Description are required");
    }

    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400, "video file is required");
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoUpload){
        throw new ApiError(500, "Video upload failed")
    }
    //create video in db
    const video = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload?.url || "",
        title,
        description,
        duration: videoUpload.duration || 0,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, video, "video uploaded successfully")
    );
});

// get all Videos (pagination)
const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10 } = req.query

    const videos = await Video.find({isPublished: true})
        .populate("owner", "username avatar")
        .sort({createdAt: -1})
        .skip((page - 1) * limit)
        .limit(Number(limit));

    return res.status(200).json(
        new ApiResponse(200, videos, "videos fetched successfully")
    );
});


// get single video + increment view
const getVideoById = asyncHandler(async(req, res) => {
    const { id } = req.params

    // const video = await Video.findById(id).populate(
    //     "owner",
    //     "username avatar"
    // )
    // . Validate ID
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(404, "Invalid video Id")
    }

    // 2. Increment views atomically + fetch video
    const video = await Video.findOneAndUpdate(
        { _id: id, isPublished: true},
        { $inc: {views: 1}},
        { new: true}
    ).populate("owner", "username avatar")

    // 3. Handle not found
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    // video.view += 1;
    // await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

// update video
const updateVideo = asyncHandler(async(req, res) => {
    const { id } = req.params;

    const video = await Video.findById(id);

    if(!video){
        throw new ApiError(400, "Video not found");
    }

    // check ownership
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Unothorised")
    }

    const updateVideo = await Video.findByIdAndUpdate(
        id,
        {
            $set: req.body
        },
        {new: true}
    );
    return res.status(200).json(
        new ApiResponse(200, video, "Video update Succeesfully")
    )
})

// delete video
const deleteVideo = asyncHandler(async(req, res) => {
    const { id } = req.params

    const video = await Video.findById(id)

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString !== req.user._id.toString){
        throw new ApiError(404, "Unauthorised");
    }

    await Video.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, video, "Video deleted Successfully")
    );
});

//toggle Publish
const togglePublish = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString !== req.user._id.toString){
        throw new ApiError(403, "Unauthorized")
    }

    video.isPublished !== video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Publish status Updated")
    );
});

// Get My Videos
const getMyVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({ owner: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, videos, "User videos fetched")
    );
});



export {
    uploadVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublish,
    getMyVideos
};