const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware (Allows us to send JSON data)
app.use(express.json());
app.use(cors());

// Basic Route to check if server is working
app.get('/', (req, res) => {
    res.send('FYP Management System API is running...');
});

// We will add Routes here later (Auth, Projects)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);


const authRoutes = require('./routes/authRoutes'); 

app.use('/api/auth', authRoutes);   


});

