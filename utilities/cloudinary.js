const fs = require("fs");
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: 'dwwejedff', 
    api_key: '567411194177229', 
    api_secret: '-KMNIBEiu-CRUrjD5os75pswhew' 
  });
const uploadCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("Local file path is missing.");
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        
        // If upload is successful, unlink the local file
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        // If an error occurs, log it and return null
        console.error("Error uploading file to Cloudinary:", error);
        return null;
    }
};
module.exports = uploadCloudinary;