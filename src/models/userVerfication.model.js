import mongoose from "mongoose";
import bcrypt from "bcrypt"
import { type } from "os";

const verificationSchema= mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    otp:{
        type:String
    },
    expiresAt:{
        type:Date,
        required:true,
        default: () => Date.now() + (5 * 60000)
    },
    createdAt:{
        type:Date
    }
})


export const EmailVerification= mongoose.model('EmailVerification',verificationSchema);