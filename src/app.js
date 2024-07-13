import express from "express"
import cookieParser from "cookie-parser";

const app= express();
app.use(express.json({limit:"16kb"}))
app.use(cookieParser())

app.use((err, req, res, next) => {
    const statusCode = err.statuscode || 500;
    res.status(statusCode).json({
        success: err.success,
        message: err.message,
        errors: err.errors,  // Include errors in the response
        data: err.data
    });
});

import userRouters from "./routes/user.route.js"

app.use("/api/v1/users",userRouters)

export{
    app
}