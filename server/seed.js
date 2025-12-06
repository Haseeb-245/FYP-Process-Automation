const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Clear everything
    await User.deleteMany();

    // 2. Create the User with "enrollment" and "123"
    await User.create({
      name: "Huzaifa Imran",
      enrollment: "01-131232-033", 
      password: "123",
      role: "student"
    });

    console.log("✅ Database Updated! You can login now.");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();