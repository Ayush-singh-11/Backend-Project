import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Steps to do while registering=>
  // 1.get user details from frontend
  // 2.validate user details->not empty
  // 3.check if user already exists:username,email
  //4.check for images,check for avatar
  //5.upload them to cloudinary ,avatar
  //6.create user object->create entry in db
  //7.remove password and refresh token field from response
  //8.check for user creation
  //9.return res

    // 1.
    const {username,email,fullName,password}=req.body;
    console.log("email:",email);

    // 2.
    if([username,email,fullName,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400,"All fields are required");
    }

    // 3.
    const exitedUser=User.findOne({
        $or: [username,email]
    });
    if(exitedUser){
        throw new ApiError(409,"User with email or username already exits");
    }

    // 4.
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    // 5.
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(avatcoverImageLocalPatharLocalPath);
    if(!avatar){
        throw new ApiError(400,"Avatar file failed to upload");
    }

    // 6.
    const user=await User.create({
        username:username.toLowerCase(),
        email,
        fullName,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    });

    // 7.
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // 8.
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    // 9.
    return res.status(200).json(
        new ApiResponse(201,createdUser,"User registering Successully")
    );

});

export { registerUser };
