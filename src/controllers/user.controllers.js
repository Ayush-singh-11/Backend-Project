import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

//For User register method
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
  const { username, email, fullName, password } = req.body;
  // console.log("email:",email);
  // console.log(req.body);

  // 2.
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3.
  const exitedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exitedUser) {
    throw new ApiError(409, "User with email or username already exits");
  }

  // 4.
  // console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath=req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 5.
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file failed to upload");
  }

  // 6.
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // 7.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 8.
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 9.
  return res
    .status(200)
    .json(new ApiResponse(201, createdUser, "User registering Successully"));
});

//For User Login method
const loginUser = asyncHandler(async (req, res) => {
  // Steps to login->
  // 1.req body->data
  // 2.username or email
  // 3.find the user
  // 4.password check
  // 5.access and referesh token
  // 6.send cookie

  // 1.
  const { username, email, password } = req.body;

  // 2.
  if (!username || !email) {
    throw new ApiError(400, "username or email is required");
  }

  // 3.
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exits");
  }

  // 4.
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  //5.
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 6.
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

//For User Logout method
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponse(200,{},"User logged Out")
  );

});

export { registerUser, loginUser, logoutUser };
