const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

const requiredConfig = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingConfig = requiredConfig.filter(key => !process.env[key]);

if (missingConfig.length > 0) {
    console.error(`ERROR: Missing Cloudinary Configuration: ${missingConfig.join(', ')}`);
    console.error('File uploads to Cloudinary will fail until these environment variables are set.');
} else {
    console.log('Cloudinary Configuration Loaded Successfully');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
