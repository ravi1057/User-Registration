import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong while generating refresh and access Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  // get user details from front end
  //validation - not empty
  //check if user already exists :name,email
  //create user object => create entry in db
  //remove the password and refresh token fiels from response
  //Check for response
  // return res

  const { name, email, password, phone, profession } = req.body;
  // console.log("fullName :", fullName);

  if ([email, name, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fileds are Required");
  }

  const existedUser = await User.findOne({
    $or: [{ name }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    name: name.toLowerCase(),
    profession,
    phone,
    email,
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went Wrong While registering the User");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  // username or email
  //find user
  //passwor check
  //access and refresh token
  //send cookie

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username and email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
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
        "User Logged In Successfully"
      )
    );
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Un authorized Request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Reresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is  expired or user");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshTokens(user?._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});
const getCurrentUserDetails = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, users, "get users fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    throw ApiError(400, "All Fields are Required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        name,
        phone,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated successfully"));
});

//Delete User

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "Video not found");
  }

  //Find the User in db

  const user = await User.findById({
    _id: userId,
  });

  const deleteResponse = await User.findByIdAndDelete(user);
  if (!deleteResponse) {
    throw new ApiError(500, "Something went wrong while deleting the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteResponse, "User Deleted Successfully"));
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  updateAccountDetails,
  deleteUser,
  getCurrentUserDetails
};
