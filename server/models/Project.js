const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({

  initialDefenseMarks: {
  coordinator: { type: Number, default: null, min: 0, max: 5 },
  supervisor: { type: Number, default: null, min: 0, max: 5 },
  panel: { type: Number, default: null, min: 0, max: 5 },
  feedback: { type: String, default: null } // General feedback
},

initialDefenseCompleted: { type: Boolean, default: false },
  // Student who submitted
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Phase 1: Proposal
  documentUrl: {
    type: String,
    required: true
  },
  
  // Proposed supervisor (from student's proposal document)
  proposedSupervisorName: {
    type: String,
    default: null
  },
  
  // Actual supervisor assigned by coordinator
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Supervisor consent status
  supervisorConsent: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: null
  },
  
  supervisorFeedback: {
    type: String,
    default: null
  },
  
  status: {
    type: String,
    enum: [
      'Pending Coordinator Review',
      'Approved',
      'Rejected',
      'Changes Required',
      'Pending Supervisor Consent',
      'Supervisor Approved',
      'Supervisor Rejected',
      'Scheduled for Defense',
      'Defense Cleared',
      'Defense Changes Required'
    ],
    default: 'Pending Coordinator Review'
  },
  
  // Coordinator feedback when reviewing proposal
  coordinatorFeedback: {
    type: String,
    default: null
  },
  
  // Phase 2: Defense
  defenseDate: {
    type: Date,
    default: null
  },
  
  presentationUrl: {
    type: String,
    default: null
  },
  
  // Panel feedback after defense
  defenseFeedback: {
    type: String,
    default: null
  },
  
  // Additional fields
  panelMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  grade: {
    type: String,
    default: null
  }
  
  
}, { timestamps: true });


module.exports = mongoose.model('Project', ProjectSchema);