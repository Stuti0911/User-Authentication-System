import {User} from "../models/user.models.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt"
import { EmailVerification } from "../models/userVerfication.model.js";
import nodemailer from "nodemailer"
import mongoose from "mongoose";

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
            status:"Prending",
            message:"Pending !! Email Verification Otp Send!! "
        })

    } catch (error) {
        console.log(`ERROR!! while generating OTP ${error}`);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

const verifyOTP= asyncHandler(async(req,res)=>{
    
    const {userId, otp}= req.body
    const UserOTPVerificationRecord= await EmailVerification.findOne({
        userId: new mongoose.Types.ObjectId(userId)
    })
   
    if(!UserOTPVerificationRecord){
        throw new ApiError(400,"Account does not exist.Try Login Again")
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
            _id:new mongoose.Types.ObjectId(userId)
        },
        {
            isVerified:true
        });

    if(!updatedUser){
        throw new ApiError(500,"Error Ocuured while updating User")
    }

    await EmailVerification.deleteMany({userId});

    return res.status(200)
    .json(new ApiResponse(200,updatedUser,"User Successfully verified!!"))

    
})

const registerUser= asyncHandler(async(req,res)=>{
   
    const {userName,firstName,lastName,email,password,phoneNumber}= req.body;

    validateRequestBody({firstName,lastName,password,email,phoneNumber});

    //check if user already exists with same email
    const checkUserByEmail= await User.findOne({email})
    if(checkUserByEmail){
        throw new ApiError(400,"User email is already registered")
    }
    
    const checkUserByPhoneNumber= await User.findOne({phoneNumber})
    if(checkUserByPhoneNumber){
        throw new ApiError(400,"User phone number is already registered")
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

    // user.save().
    // then((result)=>{
    //     sendOTPVerificationEmail(result,res);
    // })
    // .catch((err)=>console.log(err))


    // if(!user){
    //     throw new ApiError(500,"Error Occured While Registering USer")
    // }

    // return res.status(200)
    // .json(
    //     new ApiResponse(
    //         200,
    //         user,
    //         "User registered Successfully"
    //     )
    // )
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

const regenerateOTP= asyncHandler(async(req,res)=>{
    const {userId,email}= req.body;
    
})

export {
    registerUser,verifyOTP,regenerateOTP
}