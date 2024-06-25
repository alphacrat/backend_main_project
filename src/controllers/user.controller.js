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
    User.findOne({
        $or: [{ username }, { email }]
    })


})

export default registerUser


// user gives the data from frontend {correct} // done
// data validation is required {correct}
// chcek if user already exists {not thuoght of} : we check through email
// check for images and avatar {compulsory check not thought of}
// upload to cloudinary 
// check the avatar if uploaded in multer and cloudinary
// create user Object - create DB call
// remove the password and refresh token field from response 
// check if response recieved, user creation validation
// return response