import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))
//to handle the json data coming
app.use(express.json({
    limit: "16kb"
}))
//to handle the url data 
app.use(express.urlencoded({
    extended: true,
    limit: '16kb'
}))
app.use(express.static("public"))
app.use(cookieParser())

export default app





