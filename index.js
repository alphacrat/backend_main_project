import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})
import connectDB from "./src/db/database.js";
import app from "./src/app.js"

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`)
        }).on("Error in the Server connection", (err) => {
            console.log('server connection failed !!!', err)
            throw err
        })
    })
    .catch((err) => {
        console.log('DB connection failed !!!')
    })




