import mongoose from "mongoose";
import bcrypt from "bcrypt"

const userSchema= mongoose.Schema({
    userName:{
        type:String,
        tolowercase:true,
        trim:true
    },
    firstName:{
        type:String,
        required: true,
        tolowercase:true,
        trim:true
    },
    lastName:{
        type:String,
        required: true,
        tolowercase:true,
        trim:true
    },
    email:{
        type:String,
        required: true,
        tolowercase:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required: true,
        trim:true,
        minLength:8
    },
    phoneNumber:{
        type:String,
        trim:true
    },
    refreshToken:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:false
    },
    isVerified:{
        type:Boolean,
        default:false
    }
},{timeStamps:true}
)


export const User= mongoose.model('User',userSchema);