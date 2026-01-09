const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

const requiredConfig = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingConfig = requiredConfig.filter(key => !process.env[key]);

// Check if CLOUDINARY_URL is provided (Alternative standard)
if (process.env.CLOUDINARY_URL) {
    console.log('Cloudinary Configuration: Using CLOUDINARY_URL environment variable.');
}
// Check if individual keys are provided
else if (missingConfig.length === 0) {
    console.log('Cloudinary Configuration: Using individual environment variables.');
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}
// Missing everything
else {
    console.error(`CRITICAL ERROR: Cloudinary Configuration Missing.`);
    console.error(`- Missing Variables: ${missingConfig.join(', ')}`);
    console.error(`- OR verify CLOUDINARY_URL is not set.`);
    console.error('File uploads WILL FAIL until this is fixed on Render Dashboard.');
}

module.exports = cloudinary;
