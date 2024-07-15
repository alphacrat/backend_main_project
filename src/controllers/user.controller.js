import asyncHandler from "../utils/asyncHandler.js"
import errorHandler from "../utils/errorHandler.js"
import { User } from "../models/user.model.js"
import uploadMethod from "../utils/cloudinary.fileUpload.js"
import responseHandler from "../utils/responseHandler.js"
import jwt from "jsonwebtoken"

const generateAccessAndReferenceTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (err) {
        throw new errorHandler(500, "server method problem", err)
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //user gives the data in the frontend and the data is retrieved here 
    const { fullName, email, username, password } = req.body

    //data validation
    if ([fullName, email, username, password].some((field) => { field?.trim() === "" })) {
        throw new errorHandler(400, "All fields required")
    }

    //chcecking the user already exists or not 
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    }) // it will return the first document found with the same username or email
    if (existedUser) {
        throw new errorHandler(409, "User already exists")
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new errorHandler(400, "Avatar is required")
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    } else {
        console.log("Warning: There is no cover image");
    }

    //upload in cloudinary : 
    const avatarResponse = await uploadMethod(avatarLocalPath)
    const coverImageResponse = await uploadMethod(coverImageLocalPath)

    if (!avatarResponse) {
        throw new errorHandler(500, "Avatar upload failed")
    }

    // create user Object - create DB call
    const user = await User.create({
        fullName,
        avatar: avatarResponse.url,
        coverImage: coverImageResponse?.url || "", // here this is not sure that the user had uploaded the coverimage 
        email,
        username: username.toLowerCase(),
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //remove password and refreshToken
    )

    if (!createdUser) {
        throw new errorHandler(500, "User creation failed")
    }

    // return response
    return res.status(201).json(
        new responseHandler(
            200,
            createdUser,
            "User created successfully",
        ))
})


const loginUser = asyncHandler(async (req, res,) => {

    // values are taken from the body
    const { email, username, password } = req.body

    //validation if the user has provided the sufficient dta for the login 
    if (!username || !email) {
        throw new errorHandler(400, "username or email required")
    }

    //checking the user already exists or not
    const user = await User.findOne({
        $or: [{ username }, { email }] //this checks that a user exists with any of the value 
    })

    if (!user) {
        throw new errorHandler(404, "user doesnot exist")
    }

    //password check
    const idPasswordValid = await user.isPasswordCorrect(password);
    if (!idPasswordValid) {
        throw new errorHandler(401, "Invalid user credentials")
    }

    //generate refresh token and the access token
    const { accesstoken, refreshtoken } = await generateAccessAndReferenceTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new responseHandler(
                200,
                {
                    user: loggedInUser,
                    accesstoken,
                    refreshtoken
                },
                "User Logged in Successfully!!"))
    //send it in cookies 

})


const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new responseHandler(200, null, "User logged out successfully"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new errorHandler(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new errorHandler(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new errorHandler(401, "Refresh token is used or expired");
        }

        const options = {
            httpOnly: true,
            secure: true,
            // sameSite: 'Strict' // Optional but recommended for added security
        };

        const { newAccessToken, newRefreshToken } = await generateAccessAndReferenceTokens(user._id);

        user.refreshToken = newRefreshToken; // Update the refresh token in the user's record
        await user.save();

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new responseHandler(
                    200,
                    { accessToken: newAccessToken, refreshToken: newRefreshToken },
                    "The access token is successfully generated"
                )
            );
    } catch (error) {
        throw new errorHandler(401, error.message || "Unauthorized request");
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { newPassword, oldPassword, confPassword } = req.body;

        if (!newPassword || !oldPassword || !confPassword) {
            throw new errorHandler(401, "inputs not recieved");
        }

        if (!(newPassword === confPassword)) {
            throw new errorHandler(401, "New password and confirm password do not match");
        }

        const user = await User.findById(req.user?._id);

        if (!user) {
            throw new errorHandler(401, "user not found")
        }

        const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isOldPasswordCorrect) {
            throw new errorHandler(401, "Invalid Old Password");
        }

        user.password = newPassword; // password is set, not saved
        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(new responseHandler(200, {}, "Password changed successfully"))
    } catch (error) {
        throw new errorHandler(401, error.message || "Unsuccessful Password Change")
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const userID = req.user?._id;

    if (!userID) {
        throw new errorHandler(401, "User not found");
    }

    const user = await User.findById(userID);
    if (!user) {
        throw new errorHandler(404, "User not found");
    }

    return res.status(200).json(new responseHandler(200, { user }, "User retrieved successfully"));
});

const updateUserAvatar = asyncHandler(async(req, res))

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser }
















//ALGORITHM for signup : 

// user gives the data from frontend {correct} // done
// data validation is required {correct} //done
// chcek if user already exists {not thuoght of} : we check through email //done
// check for images and avatar {compulsory check for the avatar not thought of}
// upload to cloudinary 
// check the avatar if uploaded in multer and cloudinary
// create user Object - create DB call
// remove the password and refresh token field from response 
// check if response recieved, user creation validation
// return response


//algorithm for login 
/*
1. user provide the login credentials (req.body -> data)
2. validation
3. chcek in the db, if user exits (username or email)
4. password check
4. give the accesstoken and the refreshtoken
5. send the accesstoken and the refreshtoken in secure cookies
5, prompt successful login
*/


// algorithm : 
// user provides more in the login section to make up with the basic prowess 
// user provides the email and password
// check if the user exists
// password check
// return the accesstoken and refreshtoken
// send the accesstoken and refreshtoken in secure cookies
// prompt successful login
// the successful login is then verified in th ecookies sectoin of the upwork 
