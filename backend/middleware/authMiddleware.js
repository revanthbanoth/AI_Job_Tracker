const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for Bearer token in header FIRST (Priority for API clients)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        console.log('Auth Middleware: Bearer token found in header');
        token = req.headers.authorization.split(' ')[1];
    }
    // Fallback to cookie
    else if (req.cookies.jwt) {
        console.log('Auth Middleware: Token found in cookie');
        token = req.cookies.jwt;
    } else {
        console.log('Auth Middleware: No token found. Headers:', req.headers);
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };
