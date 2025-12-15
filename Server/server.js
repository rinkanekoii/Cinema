const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Set to false to use real Oracle database, true for demo mode with mock data
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.DB_USER;

let db, authRoutes, movieRoutes, showtimeRoutes, bookingRoutes;
let isShuttingDown = false;

if (!DEMO_MODE) {
    db = require('./config/database');
    authRoutes = require('./routes/auth');
    movieRoutes = require('./routes/movies');
    showtimeRoutes = require('./routes/showtimes');
    bookingRoutes = require('./routes/bookings');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../Client')));

if (DEMO_MODE) {
    console.log('⚠️  Running in DEMO MODE - using mock data (no database)');
    app.use('/api', require('./routes/demo'));
} else {
    app.use('/api/auth', authRoutes);
    app.use('/api/movies', movieRoutes);
    app.use('/api/showtimes', showtimeRoutes);
    app.use('/api/bookings', bookingRoutes);
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../Client/index.html'));
    }
});

async function startup() {
    try {
        console.log('🚀 Starting Movie Booking System Server...');
        
        if (!DEMO_MODE) {
            await db.initialize();
        } else {
            console.log('📝 Demo mode - using mock data');
            console.log('💡 To use real database, create a .env file with:');
            console.log('   DB_USER=CINEMA_DB');
            console.log('   DB_PASSWORD=cinema123');
            console.log('   DB_CONNECTION_STRING=localhost:1521/XEPDB1');
            console.log('   JWT_SECRET=your_secret_key');
        }
        
        app.listen(PORT, () => {
            console.log(`✅ Server is running on http://localhost:${PORT}`);
            console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
            if (DEMO_MODE) {
                console.log(`🎭 DEMO MODE: Limited functionality with mock data`);
            }
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`${signal} signal received: closing HTTP server`);
    if (!DEMO_MODE && db) await db.close();
    process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startup();
