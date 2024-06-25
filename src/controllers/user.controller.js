import asyncHandler from "../utils/asyncHandler.js"
import errorHandler from "../utils/errorHandler.js"
import { User } from "../models/user.model.js"

const registerUser = asyncHandler(async (req, res) => {

    //user gives the data in the frontend and the data is retrieved here 
    const { fullName, email, username, password } = req.body
    console.log("email : ", email);
    console.log("Fullname : ", fullName);

    //data validation
    if ([fullName, email, username, password].some((field) => { field?.trim() === "" })) {
        throw new errorHandler(400, "All fields required")
    }

    //chcecking the user already exists or not 
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    }) // it will return the first document found with the same username or email
    if (existedUser) {
        throw new errorHandler(409, "User already exists")
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new errorHandler(400, "Avatar is required")
    }




})

export default registerUser


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