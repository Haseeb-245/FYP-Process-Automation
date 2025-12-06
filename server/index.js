const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path'); // Import 'path' to handle file paths

// Import Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes'); // Import the new project routes

// Load config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Allows sending JSON data
app.use(cors()); // Allows frontend to communicate with backend

// --- NEW: Make the 'uploads' folder accessible publicly ---
// This allows you to view uploaded files via URL (e.g., localhost:5000/uploads/filename.pdf)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route to check if server is working
app.get('/', (req, res) => {
    res.send('FYP Management System API is running...');
});

// --- MOUNT ROUTES ---
// (These must be BEFORE app.listen)
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes); // Connects the upload logic

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});