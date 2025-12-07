const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Clear everything
    await User.deleteMany();

    // 2. Create STUDENT
    await User.create({
      name: "Huzaifa Imran",
      enrollment: "01-131232-033", 
      password: "123",
      role: "student"
    });

    // 3. Create PANEL MEMBER (For Phase 2 Testing)
    await User.create({
      name: "Dr. Panel Member",
      email: "panel@uni.edu", // Login using Email
      password: "123",
      role: "board",
      facultyId: "FAC-PANEL-01"
    });

    console.log("✅ Database Seeded!");
    console.log("👉 Student: 01-131232-033 / 123");
    console.log("👉 Panel:   panel@uni.edu / 123");
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();