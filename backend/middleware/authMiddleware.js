const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && (req.cookies.jwt || req.cookies.token)) {
        token = req.cookies.jwt || req.cookies.token;
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    const setCors = () => {
        if (req.headers.origin) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
    };

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId || decoded.id).select('-password');
            if (!req.user) {
                setCors();
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
            next();
        } catch (error) {
            setCors();
            console.error('Token verification failed:', error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        setCors();
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };
