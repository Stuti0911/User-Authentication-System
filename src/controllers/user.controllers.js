import {User} from "../models/user.models.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt"
import { EmailVerification } from "../models/userVerfication.model.js";
import nodemailer from "nodemailer"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
const isEmpty = (str) => !str || str.trim() === '';

const checkPhoneNumber =(phoneNumber)=> phoneNumber.length==10

const checkEmail = (email)=>{
    let validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!validRegex.test(email)) {
        throw new ApiError(400,"Email address is not valid")
    }
}

const validateRequestBody = ({ firstName,lastName, password,phoneNumber,email}) => {
    const errors = [];

    if (isEmpty(firstName)) errors.push('First name is missing');
    if (isEmpty(lastName)) errors.push('Last name is missing');
    if (isEmpty(password)) errors.push('Password is missing');
    if(isEmpty(phoneNumber)){
        errors.push('Phone Number is missing');
    }
    else if(!isEmpty(phoneNumber) && !checkPhoneNumber(phoneNumber)) errors.push('Phone Number must be 10 digits long');

    if(isEmpty(email)){
        errors.push('Email is missing');
    }
    else if (!isEmpty(email) && checkEmail(email)) errors.push('Enter a valid email');

    if (errors.length > 0) {
        errors.forEach((err)=>{console.log(`\n ${err}`);})
        // throw new ApiError(400, `Validation errors`);
        throw new ApiError(400, 'Validation errors', '', errors);
    }
};

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.SENDER_EMAIL}`,
        pass: `${process.env.SENDER_PASS}`
    }
});

const sendOTPVerificationEmail= async({userId,email},res)=>{
    try {
        const otp= `${Math.floor(1000 + Math.random() * 9000)}`;

        let mailOptions = {
            from: `${process.env.SENDER_EMAIL}`,
            to: email,
            subject: 'E-mail Verification Mail',
            html: `<p>OTP for verifying your email is: <b>${otp}</b>
            <p>This link will expire in 5 mins</p>
            </p>`
        };

        let saltRounds= 10;

        const hashedOtp= await bcrypt.hash(otp,saltRounds);

        const expiry= 300000; //5mins in millisecond
        const newOtp= await EmailVerification.create({
            userId,
            otp:hashedOtp,
            createdAt: Date.now(),
            expiresAt: Date.now() + expiry
        })
        console.log(otp);
        console.log(hashedOtp);
        console.log(newOtp);
        if(!newOtp){
            throw new ApiError(500,"Error while creating otp");
        }

        const checkSendorNot=await transporter.sendMail(mailOptions);
        if(!checkSendorNot){
            console.log("PROBLEMM HEREEE");
        }
        res.status(200).json({
            status:"Pending",
            message:"Pending !! Email Verification Otp Send!! "
        })

    } catch (error) {
        console.log(`ERROR!! while generating OTP ${error}`);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

const generateAccessAndRefreshToken= async(userid)=>{
    try {
        const user= await User.findById({
            _id: new mongoose.Types.ObjectId(userid)
        });
    
        const accessToken= await user.generateAccessToken();
        const refreshToken= await user.generateRefreshToken();
       
        if(!accessToken){
            throw new ApiError(500,"Error while generation accessToken");
        }
    
        if(!refreshToken){
            throw new ApiError(500,"Error while generation refrehToken");
        }
    
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false})
    
        return {accessToken,refreshToken}
    } catch (error) {
        console.log(`ERROR!! Token generating`);
    }
}
const registerUser= asyncHandler(async(req,res)=>{
   
    const {userName,firstName,lastName,email,password,phoneNumber}= req.body;

    validateRequestBody({firstName,lastName,password,email,phoneNumber});

    //check if user already exists with same email or phone number
    const checkUser= await User.find({
        $or:[{email},{phoneNumber}]
    })
    if(!checkUser){
        throw new ApiError(400,"User is already registered")
    }
    
    const user= await User({
        userName,
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        isVerified:false
    })
    try {
        const savedUser = await user.save();
        await sendOTPVerificationEmail({ userId: savedUser._id, email }, res);
    } catch (error) {
        console.error(`ERROR!! while saving user: ${error}`);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
})

const verifyOTP= asyncHandler(async(req,res)=>{
    
    const {email, otp}= req.body

    let user= await User.findOne({email});
    if(!user){
        throw new ApiError(400,"User is not registered!!")
    }

    const UserOTPVerificationRecord= await EmailVerification.findOne({
        userId: new mongoose.Types.ObjectId(user._id)
    })
   
    if(!UserOTPVerificationRecord){
        throw new ApiError(400,"Account does not exist or you have already verified.Try Registering Again")
    }

    const {expiresAt , otp:hashedOTP}= UserOTPVerificationRecord;
    
    if(expiresAt<Date.now()){
        throw new ApiError(400,"OTP has expired!! Regenrate a new OTP")
    }

    const isSameOTP= await bcrypt.compare(otp,hashedOTP);
    console.log(isSameOTP);
    if(!isSameOTP){
        throw new ApiError(400,"Wrong OTP!!")
    }

    const updatedUser= await User.updateOne({
            _id:new mongoose.Types.ObjectId(user._id)
        },
        {
            isVerified:true
        });

    if(!updatedUser){
        throw new ApiError(500,"Error Ocuured while updating User")
    }

    await EmailVerification.deleteMany({userId:user._id});
    
    user= await User.find({_id:new mongoose.Types.ObjectId(user._id)}).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"User Successfully verified!!"))    
})


const regenerateOTP= asyncHandler(async(req,res)=>{
    const {email}= req.body;
    if(!email){
        throw new ApiError(400,"Email is missing")
    }
    const user= await User.findOne({email});
    await EmailVerification.deleteMany({userId: user._id});

    await sendOTPVerificationEmail({ userId: user._id, email}, res);
})

const loginUser =asyncHandler(async(req,res)=>{
    const {email,password}= req.body;

    if(!email || email.trim()===''){
        throw new ApiError(400,"Email is missing");
    }
    if(!password || password.trim()===""){
        throw new ApiError(400,"Password is missing");
    }

    const user= await User.findOne({email});
    if(!user){
        throw new ApiError(400,"User does not exist")
    }

    if(!user.isVerified){
        throw new ApiError(400,"Validate Email First")
    }
    
    const checkPassword= await user.comparePassword(password)
    if(!checkPassword){
        throw new ApiError(400, "Password is Wrong!!")
    }

    const{accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id);

    const updatedUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("AccessToken",accessToken,options)
    .cookie("RefreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,updatedUser,"User logged In!!")
    )
})

export {
    registerUser,verifyOTP,regenerateOTP,loginUser
}