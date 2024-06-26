import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadMethod = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully 
        console.log("files uploaded on cloudinary")
        fs.unlinkSync(localFilePath)
        return response

    } catch (err) {
        console.log("upload failed", err)
        fs.unlinkSync(localFilePath)
        throw err;// this will remove the locally saved temporary file as the upload operation gets failed]
    }
}

export default uploadMethod