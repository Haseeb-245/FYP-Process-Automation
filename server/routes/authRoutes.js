const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // 1. Get data from Frontend
    const { email, enrollment, password } = req.body;

    let user;

    // 2. Search Logic: Prioritize Enrollment for students
    if (enrollment) {
      console.log("Searching for student with enrollment:", enrollment); // Debug Log
      user = await User.findOne({ enrollment: enrollment });
    } else if (email) {
      user = await User.findOne({ email: email });
    }

    // 3. Debugging: See what the server found
    if (!user) {
        console.log("User not found in DB");
        return res.status(400).json({ message: 'User not found in Database' });
    }

    // 4. Check Password
    // Note: Since we removed encryption in seed.js, we compare plain text
    if (password !== user.password) {
      console.log("Password mismatch");
      return res.status(400).json({ message: 'Invalid password' });
    }

    // 5. Success!
    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      enrollment: user.enrollment
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/create-test-coordinator', async (req, res) => {
  try {
    // Check if coordinator already exists
    const existingCoordinator = await User.findOne({ email: 'coordinator@uni.edu' });
    
    if (existingCoordinator) {
      return res.json({ 
        success: true, 
        message: "Coordinator already exists",
        user: {
          name: existingCoordinator.name,
          email: existingCoordinator.email,
          role: existingCoordinator.role,
          department: existingCoordinator.department
        }
      });
    }

    // Create test coordinator
    const coordinator = new User({
      name: "Dr. Sarah Coordinator",
      email: "coordinator@uni.edu",
      password: "coordinator123", // In production, use bcrypt to hash passwords!
      role: "coordinator",
      department: "Computer Science",
      facultyId: "CS-001",
      phone: "123-456-7890",
      office: "Room 101, CS Building"
    });

    await coordinator.save();

    res.json({ 
      success: true, 
      message: "Test coordinator created successfully!",
      coordinator: {
        name: coordinator.name,
        email: coordinator.email,
        password: "coordinator123", // Shows plain password for testing
        role: coordinator.role,
        department: coordinator.department
      }
    });
  } catch (error) {
    console.error("Create coordinator error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create test coordinator",
      error: error.message 
    });
  }
});

module.exports = router;