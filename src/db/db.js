import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDb= async()=>{
    try {
        const connectionInst = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_NAME}`
        )

        if(connectionInst){
            console.log(`Mongoose Connection Successfull: ${connectionInst.connection.host}`);
        }

    } catch (error) {
        console.log(`ERROR occured while connecting ${error}`);
    }
}

export default connectDb;