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

// Mobile-friendly, resilient file type validator
function checkFileType(file, cb) {
    if (!file || !file.originalname) {
        return cb(new Error('No file provided for upload.'));
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const hasValidExt = validExtensions.includes(ext);

    // List of known MIME types across Android, iOS, Windows, macOS, and Linux
    const validMimePatterns = [
        'pdf',
        'msword',
        'wordprocessingml',
        'document',
        'plain',
        'octet-stream', // Android file pickers from Downloads/Google Drive frequently pass octet-stream
        'binary/octet-stream'
    ];

    const mime = (file.mimetype || '').toLowerCase();
    const hasValidMime = validMimePatterns.some(pattern => mime.includes(pattern));

    // If extension is valid or mime matches, allow it
    if (hasValidExt || hasValidMime) {
        return cb(null, true);
    }

    return cb(new Error('Invalid file format. Please upload a PDF or Word document (.pdf, .docx, .doc).'));
}

// Init upload with 10MB limit (matching frontend UI)
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
