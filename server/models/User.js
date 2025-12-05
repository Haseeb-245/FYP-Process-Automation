const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    // General Info
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // The Critical Part: differentiating roles
    role: { 
        type: String, 
        enum: ['student', 'coordinator', 'supervisor', 'board'], 
        required: true 
    },

    // Specific to Students
    enrollmentId: { type: String },
    department: { type: String },

    // Specific to Board/Faculty
    facultyId: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);