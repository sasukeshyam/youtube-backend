import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

const searchVideos = asyncHandler(async (req, res) => {
    let { query, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    if (!query?.trim()) {
        throw new ApiError(400, "Search query is required");
    }

    page = Math.max(1, parseInt(page));
    limit = Math.min(50, parseInt(limit));

    // Only allow valid sort fields
    const allowedSortFields = ["createdAt", "views", "duration"];
    if (!allowedSortFields.includes(sortBy)) {
        sortBy = "createdAt";
    }

    const sortOptions = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [videos, total] = await Promise.all([
        Video.find(
            {
                $text: { $search: query.trim() },
                isPublished: true,
            },
            {
                score: { $meta: "textScore" },  // relevance score
            }
        )
            .populate("owner", "username avatar")
            .sort({ score: { $meta: "textScore" }, ...sortOptions })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),

        Video.countDocuments({
            $text: { $search: query.trim() },
            isPublished: true,
        }),
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
            "Videos fetched successfully"
        )
    );
});

export { searchVideos };