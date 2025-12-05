const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const users = [
    {
        name: "Huzaifa Imran",
        email: "student@uni.edu",
        password: "123", 
        role: "student",
        enrollmentId: "01-131232-033",
        department: "SE"
    },
    {
        name: "FYP Coordinator",
        email: "coord@uni.edu",
        password: "456",
        role: "coordinator"
    },
    {
        name: "Supervisor John",
        email: "sir.john@uni.edu",
        password: "789",
        role: "supervisor",
        facultyId: "FAC-001"
    },
    {
        name: "External Board",
        email: "board@uni.edu",
        password: "321",
        role: "board",
        facultyId: "EXT-999"
    }
];

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await User.deleteMany(); // Clears old users
        
        // Encrypt passwords before saving
        const hashedUsers = await Promise.all(users.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            return user;
        }));

        await User.insertMany(hashedUsers);

        console.log('Data Imported Success! You can now login with password "123"');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();