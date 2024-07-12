import Router from "express"
import { registerUser, verifyOTP} from "../controllers/user.controllers.js";

const router= Router();

router.route("/register").post(registerUser)
router.route("/register/verifyOTP").post(verifyOTP);
router.route("/register/verifyOTP").post(verifyOTP);
router.route("/register/regenerateOTP").post(regenerateOTP);
export default router