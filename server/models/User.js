const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs"); // ❌ Commented out for now

// -------------------------------
//   USER SCHEMA
// -------------------------------
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // Email is optional for students
    email: {
      type: String,
      unique: true,
      sparse: true, // allows null email without duplicate errors
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["student", "coordinator", "supervisor", "board"],
      default: "student",
    },

    // Students login via Enrollment
    enrollment: {
      type: String,
      unique: true,
      sparse: true, // allows only students to have it
    },

    department: { type: String },
    facultyId: { type: String },
    phone: { type: String },
    office: { type: String }
  },
  { timestamps: true }
);

// -------------------------------
//   PASSWORD HASH MIDDLEWARE - DISABLED FOR DEVELOPMENT
// -------------------------------
// ❌ Temporarily disabled - storing plain text passwords for easier testing
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   try {
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = mongoose.model("User", userSchema);