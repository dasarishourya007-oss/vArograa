import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== 'production') {
    // Try multiple logical locations for the .env file
    const envPaths = [
        path.join(__dirname, '.env'),           // Same folder as server.js (backend/)
        path.join(__dirname, '..', '.env'),      // Project root
        path.join(process.cwd(), '.env'),       // Current Working Directory root
        path.join(process.cwd(), 'backend', '.env') // CWD/backend
    ];

    let loaded = false;
    for (const envPath of envPaths) {
        const result = dotenv.config({ path: envPath });
        if (!result.error) {
            console.log(`[Config] Environment loaded from: ${envPath}`);
            loaded = true;
            break;
        }
    }
    if (!loaded) console.warn("[Config] No .env file found in standard locations.");
}

// Diagnostic Log for AI
if (process.env.NVIDIA_API_KEY) {
    const maskedKey = process.env.NVIDIA_API_KEY.substring(0, 8) + "..." + process.env.NVIDIA_API_KEY.slice(-4);
    console.log(`[AI] NVIDIA NIM Key detected: ${maskedKey}`);
} else {
    console.warn("[AI] NVIDIA_API_KEY NOT FOUND. Chatbot will operate in fallback mode.");
}
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to HealthLink API (No Database Mode)' });
});

const PORT = process.env.PORT || 5000;

// Only listen if this file is run directly (not as a serverless function)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
