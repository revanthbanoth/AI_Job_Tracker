const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Ensure CORS headers are attached to all error responses so mobile browsers don't mask errors as 'Network Error'
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = typeof err === 'string' ? err : (err.message || 'Server Error');

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
    }

    // Handle Multer specific errors (e.g. file too large or invalid type)
    if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'The uploaded file is too large. Maximum allowed size is 10MB.';
    }

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { notFound, errorHandler };
