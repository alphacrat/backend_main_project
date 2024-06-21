import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! at Db host : ${connection.connection.host}`)
    }
    catch (err) {
        console.log('DB Connection error', err);
        process.exit(1);
    }
}

export default connectDB