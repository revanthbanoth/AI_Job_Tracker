const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine in memory for parsing & Cloudinary / disk fallback
const storage = multer.memoryStorage();

// Init upload with 20MB buffer limit (safely validated in controller)
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB buffer limit
});

module.exports = upload;
