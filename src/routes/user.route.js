import Router from "express"
import { registerUser,verifyOTP,regenerateOTP ,loginUser} from "../controllers/user.controllers.js";

const router= Router();

router.route("/register").post(registerUser)
router.route("/register/verifyOTP").post(verifyOTP);
router.route("/register/regenerateOTP").post(regenerateOTP);

router.route("/login").post(loginUser);
export default router