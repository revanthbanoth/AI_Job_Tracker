const express = require('express');
// Force restart for DB change and CORS update
const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ai-job-tracker-htng.onrender.com',
    'https://www.ai-job-tracker-htng.onrender.com'
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`AI Service URL: ${process.env.AI_SERVICE_URL || 'Not Set (using localhost)'}`);
});
