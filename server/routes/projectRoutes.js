const express = require('express');
const router = express.Router();
const multer = require('multer');
const Project = require('../models/Project');
const path = require('path');

// --- CONFIGURATION ---
// 1. Configure Multer (Where to save files)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    // Save as: proposal-timestamp.ext
    cb(null, 'proposal-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- STUDENT ROUTES ---

// 2. The Upload Route (Activity 1.3)
// POST /api/projects/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { studentId } = req.body; // Received from Frontend
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Create the DB record matching the new Phase 1 Schema
    const newProject = new Project({
      leaderId: studentId,       // Maps studentId to leaderId
      documentUrl: file.path,
      status: 'Pending Coordinator Review' // Initial Status
    });

    await newProject.save();

    res.status(201).json({ 
        message: 'Proposal submitted to Coordinator successfully!', 
        project: newProject 
    });
    
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// --- COORDINATOR ROUTES (For your Teammate) ---

// 3. GET Pending Proposals (Activity 1.4)
// This lets the Coordinator see everyone who submitted a file
// GET /api/projects/pending
router.get('/pending', async (req, res) => {
  try {
    // Find all projects waiting for review
    const projects = await Project.find({ status: 'Pending Coordinator Review' })
      .populate('leaderId', 'name enrollment email'); 
      // .populate() is magic: it fetches the Student's Name & ID using the leaderId link

    res.json(projects);
  } catch (error) {
    console.error("Fetch Pending Error:", error);
    res.status(500).json({ message: 'Server Error fetching proposals' });
  }
});

// 4. Update Project Status (Activity 1.4 Decision)
// This lets the Coordinator Approve or Reject
// PUT /api/projects/decision/:id
router.put('/decision/:id', async (req, res) => {
  try {
    const { status } = req.body; // e.g., "Approved" or "Rejected" or "Modifications Required"
    
    // Find project by ID and update the status
    const project = await Project.findByIdAndUpdate(
      req.params.id, 
      { status: status },
      { new: true } // Returns the updated object so the frontend sees the change
    );

    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: `Project status updated to ${status}`, project });
  } catch (error) {
    console.error("Decision Error:", error);
    res.status(500).json({ message: 'Server Error updating status' });
  }
});

module.exports = router;