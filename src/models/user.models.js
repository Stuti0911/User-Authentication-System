import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt  from "jsonwebtoken";

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


userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.comparePassword= async function(password){
    return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateAccessToken =function(){
    return jwt.sign({
        _id: this._id,
        firstName: this.firstName,
        lastName:this.lastName,
        email:this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)}

userSchema.methods.generateRefreshToken =function(){
    return jwt.sign({
        _id: this._id,
        firstName: this.firstName,
        lastName:this.lastName,
        email:this.email
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)}

export const User= mongoose.model('User',userSchema);