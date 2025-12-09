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

// 1. Submit Proposal (Phase 1)
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

// Upload Presentation (Phase 2)
router.post('/upload-ppt', upload.single('file'), async (req, res) => {
    try {
      const { studentId } = req.body;
      const file = req.file;
  
      if (!file) return res.status(400).json({ message: 'Please upload a PPT/PDF' });
  
      const project = await Project.findOneAndUpdate(
        { leaderId: studentId },
        { presentationUrl: file.path },
        { new: true }
      );
  
      res.json({ message: 'Presentation uploaded successfully!', project });
    } catch (error) {
      console.error("PPT Upload Error:", error);
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
//          COORDINATOR ROUTES
// ==========================================

router.get('/pending', async (req, res) => {
  try {
    console.log('📥 Fetching pending proposals...');
    const projects = await Project.find({ status: 'Pending Coordinator Review' })
      .populate('leaderId', 'name enrollment email');
    console.log('✅ Found', projects.length, 'pending proposals');
    res.json(projects);
  } catch (error) {
    console.error('❌ Error fetching pending proposals:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/supervisors', async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }, 'name email facultyId department');
    res.json(supervisors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 🔹 UPDATED: Changed status to 'Approved - Waiting for Supervisor Consent'
router.put('/assign-supervisor/:id', async (req, res) => {
  try {
    const { supervisorId, feedback } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        supervisorId: supervisorId,
        status: 'Approved - Waiting for Supervisor Consent', // 🔹 CHANGED
        supervisorConsent: 'Pending',
        coordinatorFeedback: feedback || null
      },
      { new: true }
    ).populate('supervisorId', 'name email');
    res.json({ message: 'Supervisor assigned! Waiting for consent.', project });
  } catch (error) {
    console.error("Assign Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/decision/:id', async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const updateData = { status };
    if (feedback) updateData.coordinatorFeedback = feedback;
    const project = await Project.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('leaderId', 'name enrollment email');
    res.json({ message: `Project ${status}`, project });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 🔹 UPDATED: Added room field and validation
router.put('/assign-defense/:id', async (req, res) => {
    try {
        const { date, room } = req.body; // 🔹 Added room
        
        const project = await Project.findById(req.params.id);
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }

        // 🔹 Check if project is ready for defense
        if (project.status !== 'Approved - Ready for Defense') {
          return res.status(400).json({ 
            message: 'Defense can only be scheduled after supervisor approval' 
          });
        }

        project.defenseDate = date;
        project.defenseRoom = room; // 🔹 Added room
        project.status = 'Scheduled for Defense';
        await project.save();

        res.json({ message: "Defense Date and Room Assigned", project });
    } catch (error) {
        console.error("Assign Defense Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/stats', async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const pendingProposals = await Project.countDocuments({ status: 'Pending Coordinator Review' });
    const approvedProjects = await Project.countDocuments({ 
      status: { $in: ['Approved - Waiting for Supervisor Consent', 'Approved - Ready for Defense', 'Scheduled for Defense'] }
    });
    const rejectedProjects = await Project.countDocuments({ 
      status: { $in: ['Rejected', 'Supervisor Rejected'] }
    });
    res.json({ totalProjects, pendingProposals, approvedProjects, rejectedProjects });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
//           SUPERVISOR ROUTES
// ==========================================

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

// 🔹 UPDATED: Changed status to 'Approved - Ready for Defense'
router.put('/supervisor-decision/:id', async (req, res) => {
  try {
    const { decision, feedback } = req.body;
    const status = decision === 'Approved' ? 'Approved - Ready for Defense' : 'Supervisor Rejected'; // 🔹 CHANGED
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        supervisorConsent: decision,
        supervisorFeedback: feedback || null,
        status: status
      },
      { new: true }
    ).populate('leaderId', 'name enrollment email').populate('supervisorId', 'name email');
    res.json({ message: `Consent ${decision}`, project });
  } catch (error) {
    console.error("Supervisor Decision Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
//             PANEL ROUTES
// ==========================================

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

// 🔹 UPDATED: Added 'Approved - Ready for Defense' to query
router.get('/defense-pending', async (req, res) => {
  try {
    console.log('📥 Fetching defense-pending projects...');
    const projects = await Project.find({ 
      status: { $in: ['Approved - Ready for Defense', 'Scheduled for Defense', 'Defense Changes Required'] } // 🔹 CHANGED
    }).populate('leaderId', 'name enrollment email')
      .populate('supervisorId', 'name email'); // 🔹 Added supervisor populate
    
    console.log('✅ Found', projects.length, 'defense-ready projects');
    res.json(projects);
  } catch (error) {
    console.error("❌ Fetch Defense Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;