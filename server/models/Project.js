const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({

  // --- PHASE 1 & 2 EXISTING FIELDS ---
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
  
  srsUrl: { type: String, default: null },
  sdsUrl: { type: String, default: null },
  
  srsSdsStatus: {
    type: String,
    enum: ['Pending Review', 'Under Review', 'Approved', 'Rejected', 'Changes Required'],
    default: null
  },
  
  srsSdsFeedback: { type: String, default: null },

  srsSdsReviewMarks: {
    coordinator: { type: Number, default: null, min: 0, max: 5 },
    supervisor: { type: Number, default: null, min: 0, max: 5 },
    panel: { type: Number, default: null, min: 0, max: 5 },
    feedback: { type: String, default: null }
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

  // Coordinator feedback when reviewing proposal
  coordinatorFeedback: {
    type: String,
    default: null
  },

  // Phase 2: Initial Defense Details
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

  // Overall Grade (if needed for previous phases)
  grade: {
    type: String,
    default: null
  },

  // --- PHASE 4: DEVELOPMENT & FINAL DEFENSE UPDATES ---

  // 1. Weekly Logs (Updated for Meeting/Log Flow)
  weeklyLogs: [{
    weekNumber: { type: Number }, // 1, 2, 3, 4
    
    // Meeting Details (Student Request)
    meetingDate: { type: Date, default: null },
    meetingStatus: { 
      type: String, 
      enum: ['Not Scheduled', 'Pending', 'Accepted'], 
      default: 'Not Scheduled' 
    },
    
    // Log Details (Supervisor Input)
    content: { type: String, default: null }, 
    submittedAt: { type: Date, default: null }
  }],

  // 2. Final Defense Specifics
  finalDefense: {
    scheduledDate: { type: Date, default: null }, // Set by Coordinator
    finalPptUrl: { type: String, default: null }, // Uploaded by Student
    
    // Marks for Final Defense (30% Weightage context)
    marks: {
      coordinator: { type: Number, default: null },
      supervisor: { type: Number, default: null },
      panel: { type: Number, default: null },
      external: { type: Number, default: null } // New External Examiner
    },
    feedback: { type: String, default: null }
  },

  // 3. External Examiner Reference
  externalExaminerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Updated Status Enum
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
      'Defense Changes Required',
      'Ready for SRS/SDS Review',   
      'SRS/SDS Under Review',      
      'SRS/SDS Approved',           
      'SRS/SDS Rejected',           
      'Development Phase',          // Active during Weekly Logs
      'Final Defense Scheduled',    // Coordinator has set the date
      'Final Defense Pending',      // PPT uploaded, waiting for grades
      'Project Completed'           // All done
    ],
    default: 'Pending Coordinator Review'
  }

}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);