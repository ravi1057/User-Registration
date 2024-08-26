import { Router } from "express";

import {
  deleteUser,
  getCurrentUserDetails,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);
router.route("/get-users").get(getCurrentUserDetails);

//secured routes
router.route("/refresh-token").post(refreshAccessToken);
// router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/:userId").delete(verifyJWT, deleteUser);

export default router;
