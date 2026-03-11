const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const importData = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");
    
    // 1. Clear everything
    console.log("🗑️  Clearing existing users...");
    const deleteResult = await User.deleteMany();
    console.log(`   Deleted ${deleteResult.deletedCount} users`);

    // 2. Create STUDENT
    console.log("\n👨‍🎓 Creating Student...");
    const student1 = await User.create({
      name: "Haseeb Irfan",
      enrollment: "01-131232-029", 
      password: "123",
      role: "student"

    });


    // 3. Create SUPERVISORS
    console.log("\n👨‍🏫 Creating Supervisors...");
    const supervisor1 = await User.create({
      name: "Dr. Ahmed Khan",
      email: "ahmed.khan@uni.edu",
      password: "123",
      role: "supervisor",
      facultyId: "FAC-SUP-001",
      department: "Computer Science"
    });
    console.log(`   ✅ ${supervisor1.name} | ${supervisor1.email}`);

    const supervisor2 = await User.create({
      name: "Dr. Sara Ali",
      email: "sara.ali@uni.edu",
      password: "123",
      role: "supervisor",
      facultyId: "FAC-SUP-002",
      department: "Computer Science"
    });
    console.log(`   ✅ ${supervisor2.name} | ${supervisor2.email}`);

    const supervisor3 = await User.create({
      name: "Dr. Hassan Raza",
      email: "hassan.raza@uni.edu",
      password: "123",
      role: "supervisor",
      facultyId: "FAC-SUP-003",
      department: "Software Engineering"
    });
    console.log(`   ✅ ${supervisor3.name} | ${supervisor3.email}`);

    const supervisor4 = await User.create({
      name: "Dr. Fatima Sheikh",
      email: "fatima.sheikh@uni.edu",
      password: "123",
      role: "supervisor",
      facultyId: "FAC-SUP-004",
      department: "Artificial Intelligence"
    });
    console.log(`   ✅ ${supervisor4.name} | ${supervisor4.email}`);

    // 4. Create PANEL MEMBERS
    console.log("\n👨‍⚖️ Creating Panel Members...");
    const panel1 = await User.create({
      name: "Dr. Panel Member",
      email: "panel@uni.edu",
      password: "123",
      role: "board",
      facultyId: "FAC-PANEL-001",
      department: "Computer Science"
    });
    console.log(`   ✅ ${panel1.name} | ${panel1.email}`);

    const panel2 = await User.create({
      name: "Dr. Examiner One",
      email: "examiner1@uni.edu",
      password: "123",
      role: "board",
      facultyId: "FAC-PANEL-002",
      department: "Computer Science"
    });
    console.log(`   ✅ ${panel2.name} | ${panel2.email}`);

    // 5. Create COORDINATOR
    console.log("\n👔 Creating Coordinator...");
    const coordinator = await User.create({
      name: "Dr. FYP Coordinator",
      email: "coordinator@uni.edu",
      password: "123",
      role: "coordinator",
      facultyId: "FAC-COORD-001",
      department: "Computer Science",
      phone: "+92-300-1234567",
      office: "CS Department, Room 401"
    });
    console.log(`   ✅ ${coordinator.name} | ${coordinator.email}`);

    console.log("\n👨‍🔬 Creating External Examiner...");
const external = await User.create({
  name: "Dr. External Examiner",
  email: "external@uni.edu",
  password: "123",
  role: "external",
  facultyId: "FAC-EXT-001",
  department: "Industry Partner",
  organization: "TechCorp Solutions"
});
console.log(`   ✅ ${external.name} | ${external.email}`);

    // Verify all users were created
    const allUsers = await User.find({});
    console.log("\n" + "=".repeat(50));
    console.log("📊 DATABASE SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total Users Created: ${allUsers.length}`);
    
    console.log("\n" + "=".repeat(50));
    console.log("🔐 LOGIN CREDENTIALS");
    console.log("=".repeat(50));
    
    console.log("\n📘 STUDENT LOGIN:");
    console.log("   Enrollment: 01-131232-033");
    console.log("   Password: 123");
    
    console.log("\n📗 COORDINATOR LOGIN:");
    console.log("   Email: coordinator@uni.edu");
    console.log("   Password: 123");
    
    console.log("\n📙 SUPERVISORS LOGIN:");
    console.log("   Email: supervisor@uni.edu");
    console.log("   Email: sara.ali@uni.edu");
    console.log("   Email: hassan.raza@uni.edu");
    console.log("   Email: fatima.sheikh@uni.edu");
    console.log("   Password: 123 (for all)");
    
    console.log("\n📕 PANEL MEMBERS LOGIN:");
    console.log("   Email: panel@uni.edu");
    console.log("   Email: examiner1@uni.edu");
    console.log("   Password: 123 (for all)");
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ DATABASE SEEDED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("\n🚀 You can now start testing the application!");
    console.log("   1. Student submits proposal");
    console.log("   2. Coordinator reviews & assigns supervisor");
    console.log("   3. Supervisor approves/rejects consent");
    console.log("   4. Student sees final status\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ SEEDING ERROR:", error.message);
    console.error(error);
    process.exit(1);
  }
};

importData();