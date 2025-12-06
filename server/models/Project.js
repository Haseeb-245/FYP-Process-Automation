const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // We store the file path here
  documentUrl: {
    type: String, 
    required: true
  },
  // Activity 1.5: Supervisor Name (Student fills this in form, or selects in UI)
  supervisorName: {
    type: String,
    default: "Not Assigned"
  },
  // Activity 1.6: Coordinator needs to know who is in the group
  groupMembers: {
    type: [String], // Array of Student IDs or Names
    default: []
  },
  // Activity 1.4: Coordinator Decision
  status: {
    type: String,
    enum: [
        'Pending Coordinator Review', // <--- Default after upload
        'Modifications Required', 
        'Approved', 
        'Rejected'
    ],
    default: 'Pending Coordinator Review'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);