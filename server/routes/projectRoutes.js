const express = require('express');
const router = express.Router();
const multer = require('multer');
const Project = require('../models/Project');
const User = require('../models/User');
const path = require('path');

// --- CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'file-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ==========================================
//              STUDENT ROUTES
// ==========================================

// 1. Submit Proposal
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { studentId, proposedSupervisor } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Please upload a file' });

    let project = await Project.findOne({ leaderId: studentId });

    if (project) {
        project.documentUrl = file.path;
        project.status = 'Pending Coordinator Review';
        project.proposedSupervisorName = proposedSupervisor || null;
        project.coordinatorFeedback = null;
        await project.save();
    } else {
        project = new Project({
            leaderId: studentId,
            documentUrl: file.path,
            proposedSupervisorName: proposedSupervisor || null,
            status: 'Pending Coordinator Review'
        });
        await project.save();
    }

    res.status(201).json({ message: 'Proposal submitted!', project });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Fetch My Project Status
router.get('/my-project/:studentId', async (req, res) => {
    try {
        const project = await Project.findOne({ leaderId: req.params.studentId })
          .populate('supervisorId', 'name email');
        if (!project) return res.json(null);
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// ==========================================
//           COORDINATOR ROUTES
// ==========================================

// 3. Get Pending Proposals
router.get('/pending', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'Pending Coordinator Review' })
      .populate('leaderId', 'name enrollment email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 4. Get All Supervisors (for dropdown)
router.get('/supervisors', async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }, 'name email facultyId department');
    res.json(supervisors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 5. Approve Proposal & Assign Supervisor
router.put('/assign-supervisor/:id', async (req, res) => {
  try {
    const { supervisorId, feedback } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        supervisorId: supervisorId,
        status: 'Pending Supervisor Consent',
        supervisorConsent: 'Pending',
        coordinatorFeedback: feedback || null
      },
      { new: true }
    ).populate('supervisorId', 'name email');

    res.json({ 
      message: 'Supervisor assigned! Waiting for consent.', 
      project 
    });
  } catch (error) {
    console.error("Assign Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 6. Reject Proposal (Coordinator)
router.put('/decision/:id', async (req, res) => {
  try {
    const { status, feedback } = req.body;
    
    const updateData = { status };
    if (feedback) {
      updateData.coordinatorFeedback = feedback;
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('leaderId', 'name enrollment email');
    
    res.json({ 
      message: `Project ${status}`, 
      project 
    });
  } catch (error) {
    console.error("Decision Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
//           SUPERVISOR ROUTES
// ==========================================

// 7. Get My Pending Consents (Supervisor)
router.get('/supervisor-pending/:supervisorId', async (req, res) => {
  try {
    const projects = await Project.find({ 
      supervisorId: req.params.supervisorId,
      supervisorConsent: 'Pending'
    }).populate('leaderId', 'name enrollment email');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 8. Supervisor Decision (Approve/Reject)
router.put('/supervisor-decision/:id', async (req, res) => {
  try {
    const { decision, feedback } = req.body; // 'Approved' or 'Rejected'
    
    const status = decision === 'Approved' ? 'Supervisor Approved' : 'Supervisor Rejected';
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        supervisorConsent: decision,
        supervisorFeedback: feedback || null,
        status: status
      },
      { new: true }
    ).populate('leaderId', 'name enrollment email')
     .populate('supervisorId', 'name email');

    res.json({ 
      message: `Consent ${decision}`, 
      project 
    });
  } catch (error) {
    console.error("Supervisor Decision Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// In projectRoutes.js - Add this route
router.put('/send-to-supervisor/:id', async (req, res) => {
  try {
    const { supervisorEmail, supervisorName } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        supervisorEmail,
        supervisorName,
        status: 'Sent to Supervisor',
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('leaderId', 'name email enrollment');

    // Find supervisor user
    const supervisor = await User.findOne({ email: supervisorEmail });
    
    // Create notification (you'll need to implement Notification model)
    // For now, we'll just log it
    console.log(`📨 Notification: Proposal sent to ${supervisorName} (${supervisorEmail})`);
    console.log(`Project: ${project.projectTitle || 'Untitled'} by ${project.leaderId.name}`);

    res.json({ 
      success: true, 
      message: 'Proposal sent to supervisor',
      project 
    });
  } catch (error) {
    console.error("Send to supervisor error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// In backend/routes/projectRoutes.js
router.get('/stats', async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const pendingProposals = await Project.countDocuments({ status: 'Pending Coordinator Review' });
    const approvedProjects = await Project.countDocuments({ status: 'Approved' });
    const rejectedProjects = await Project.countDocuments({ status: 'Rejected' });
    
    res.json({
      totalProjects,
      pendingProposals,
      approvedProjects,
      rejectedProjects
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});
// ==========================================
//         ADDITIONAL ROUTES
// ==========================================

// Assign Defense Date
router.put('/assign-defense/:id', async (req, res) => {
    try {
        const { date } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id, 
            { 
                defenseDate: date,
                status: 'Scheduled for Defense' 
            }, 
            { new: true }
        );
        res.json({ message: "Defense Date Assigned", project });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// Panel Decision
router.put('/defense-decision/:id', async (req, res) => {
    try {
        const { status, feedback } = req.body;
        
        const project = await Project.findByIdAndUpdate(
            req.params.id, 
            { 
                status: status,
                defenseFeedback: feedback
            }, 
            { new: true }
        );
        res.json({ message: "Panel decision recorded", project });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
// Send proposal to supervisor
router.put('/send-to-supervisor/:id', async (req, res) => {
  try {
    const { supervisorEmail, supervisorName } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        supervisorEmail,
        supervisorName,
        status: 'Sent to Supervisor', // New status
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('leaderId', 'name email enrollment');

    res.json({ 
      success: true, 
      message: 'Proposal sent to supervisor',
      project 
    });
  } catch (error) {
    console.error("Send to supervisor error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// Get Projects for Defense
router.get('/defense-pending', async (req, res) => {
  try {
    const projects = await Project.find({ 
      status: { $in: ['Scheduled for Defense', 'Defense Changes Required'] } 
    }).populate('leaderId', 'name enrollment email');

    res.json(projects);
  } catch (error) {
    console.error("Fetch Defense Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;