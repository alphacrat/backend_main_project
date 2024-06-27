//this will jus verify , whether the user is present or not ?
import jwt, { decode } from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler";
import errorHandler from "../utils/errorHandler";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers?.["Authorization"]?.replace("Bearer ", "")

    if (!token) {
        throw new errorHandler(401, "unauthorised request")
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decoded?._id).select("-password -refreshToken")

    if (!user) {
        throw new errorHandler(401, "Invalid Access Token")
    }

    req.user = user
    next()

})