import connectDb from "./db/db.js";
import {app} from './app.js';
import dotenv from 'dotenv';

dotenv.config({
    path: './.env'
})

connectDb()
.then(()=>{
    app.listen(process.env.PORT , ()=>{
        console.log(`Server Running on PORT: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(`ERROR!! which making connection ${error}`);
})
