const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    // General Info
    name: { type: String, required: true },
    
    // Email is optional for students now, as they login with Enrollment
    email: { 
        type: String, 
        unique: true, 
        sparse: true // Allows this to be null/empty without errors
    },
    
    password: { type: String, required: true },
    
    role: { 
        type: String, 
        enum: ['student', 'coordinator', 'supervisor', 'board'], 
        default: 'student'
    },

    // CHANGED: enrollmentId -> enrollment (To match your Frontend logic)
    enrollment: { 
        type: String, 
        unique: true, 
        sparse: true 
    },

    department: { type: String },
    facultyId: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);