const express = require('express');
const router = express.Router();
const multer = require('multer');
const Project = require('../models/Project');
const path = require('path');

// --- CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Save with timestamp to avoid name conflicts
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
    const { studentId } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Please upload a file' });

    // Check if project already exists for this student
    let project = await Project.findOne({ leaderId: studentId });

    if (project) {
        // If exists, just update the proposal file (Resubmission)
        project.documentUrl = file.path;
        project.status = 'Pending Coordinator Review';
        await project.save();
    } else {
        // Create new
        project = new Project({
            leaderId: studentId,
            documentUrl: file.path,
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

// 2. Fetch My Project Status (Used by Student Dashboard)
router.get('/my-project/:studentId', async (req, res) => {
    try {
        const project = await Project.findOne({ leaderId: req.params.studentId });
        if (!project) return res.json(null); // No project yet
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// 3. Upload Presentation (Phase 2 - Activity 2.2)
router.post('/upload-ppt', upload.single('file'), async (req, res) => {
    try {
      const { studentId } = req.body;
      const file = req.file;
  
      if (!file) return res.status(400).json({ message: 'Please upload a PPT/PDF' });
  
      // Find project and update presentation link
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

// ==========================================
//           COORDINATOR ROUTES
// ==========================================

// 4. Get Pending Proposals
router.get('/pending', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'Pending Coordinator Review' })
      .populate('leaderId', 'name enrollment email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 5. Approve/Reject Proposal (Phase 1 Decision)
router.put('/decision/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const project = await Project.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ message: `Project ${status}`, project });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 6. Assign Defense Date (Phase 2 - Activity 2.1)
router.put('/assign-defense/:id', async (req, res) => {
    try {
        const { date } = req.body; // Expecting YYYY-MM-DD
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

// ==========================================
//             PANEL ROUTES
// ==========================================

// 7. Panel Decision (Phase 2 - Activity 2.3)
router.put('/defense-decision/:id', async (req, res) => {
    try {
        const { status, feedback } = req.body; // 'Defense Cleared' or 'Defense Changes Required'
        
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

// ... existing codes ...

// 8. GET Projects Ready for Defense (For Panel Dashboard)
router.get('/defense-pending', async (req, res) => {
  try {
    // We want projects that are either scheduled OR need re-checking
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