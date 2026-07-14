import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import { LoggerUtils } from './utils/loggerUtils';

dotenv.config();

const app: Application = express();

const allowedOrigins = [
    'http://localhost:5173'
]

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true); // Callback takes two arguments: error and allow
            } else {
                callback(new Error('Not allowed by CORS')) // Just error is passed here.
            }
        },
        credentials: true
    })
)

app.use(express.json())
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI: string = process.env.MONGODB_URI as string;

async function startServer() {
    if (!MONGODB_URI) {
        LoggerUtils.warn('MONGODB_URI is not defined. Skipping MongoDB connection...');
    } else {
        try {
            await mongoose.connect(MONGODB_URI);
            LoggerUtils.info('Successfully connected to MongoDB')
        } catch (error) {
            LoggerUtils.error('Error connecting to MongoDB:', error as any)
        }
    }

    const server = app.listen(PORT, () => {
        LoggerUtils.info(`Server is running on port ${PORT}`)
    })

    process.on('SIGTERM', async () => {
        LoggerUtils.info('Shutting down gracefully...');
        await mongoose.connection.close();
        server.close(() => process.exit(0));
    })
}

startServer();