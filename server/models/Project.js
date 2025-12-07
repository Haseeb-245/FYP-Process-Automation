const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // --- PHASE 1: PROPOSAL ---
  documentUrl: { type: String, required: true },
  supervisorName: { type: String, default: "Not Assigned" },
  groupMembers: { type: [String], default: [] },
  
  // --- PHASE 2: DEFENSE (NEW) ---
  defenseDate: { 
    type: Date, 
    default: null // Activity 2.1: Assigned by Coordinator
  },
  presentationUrl: { 
    type: String, 
    default: null // Activity 2.2: Student uploads PPT
  },
  defenseFeedback: {
    type: String,
    default: "" // Activity 2.3: Comments from Panel
  },

  // --- GLOBAL STATUS ---
  status: {
    type: String,
    enum: [
        // Phase 1
        'Pending Coordinator Review', 
        'Modifications Required', 
        'Approved', // Ready for Phase 2
        'Rejected',
        
        // Phase 2
        'Scheduled for Defense', 
        'Defense Cleared', 
        'Defense Changes Required'
    ],
    default: 'Pending Coordinator Review'
  },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);