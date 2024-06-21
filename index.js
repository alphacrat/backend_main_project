import dotenv from 'dotenv'
dotenv.config({
    path: './env'
})
import connectDB from "./src/db/database.js";

connectDB()