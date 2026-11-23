const express = require('express');
const path = require('path');
// Force restart for DB change and CORS update
const dotenv = require('dotenv');

dotenv.config();

const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

connectDB();

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ai-job-tracker-htng.onrender.com',
    'https://www.ai-job-tracker-htng.onrender.com'
];

const envOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim().replace(/\/$/, '')) 
    : [];

const allowedOrigins = [...defaultOrigins, ...envOrigins];

const corsOptions = {
    origin: (origin, callback) => {
        // Reflect origin so all mobile clients and origins are permitted
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    credentials: true,
};

app.use(cors(corsOptions));

// Lightweight health-check endpoint for instant wake-up & uptime monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/ai', require('./routes/aiCopilotRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));

// For non-API routes, serve frontend index.html SPA
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(
        path.join(__dirname, "../frontend/dist/index.html")
    );
});

app.use(notFound);
app.use(errorHandler);

const axios = require('axios');
const emailScheduler = require('./services/emailScheduler');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`AI Service URL: ${process.env.AI_SERVICE_URL || 'Not Set (using localhost)'}`);
    emailScheduler.start(30);

    // Keep-Alive Heartbeat for Render Free Tier (pings every 14 minutes)
    const backendUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
    if (backendUrl) {
        const keepAliveMinutes = 14;
        setInterval(() => {
            axios.get(`${backendUrl}/api/health`)
                .then(() => console.log(`[KeepAlive] Heartbeat pinged ${backendUrl}/api/health successfully`))
                .catch(err => console.log(`[KeepAlive] Heartbeat ping notice: ${err.message}`));
        }, keepAliveMinutes * 60 * 1000);
        console.log(`[KeepAlive] Active for ${backendUrl} every ${keepAliveMinutes}m`);
    }
});
