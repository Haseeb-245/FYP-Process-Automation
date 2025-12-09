const express = require('express');
const router = express.Router();
const multer = require('multer');
const Project = require('../models/Project');
const User = require('../models/User');
const path = require('path');

// --- CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) { cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// ==========================================
//              STUDENT ROUTES
// ==========================================

// 1. Fetch My Project
router.get('/my-project/:studentId', async (req, res) => {
    try {
        const project = await Project.findOne({ leaderId: req.params.studentId }).populate('supervisorId', 'name email');
        res.json(project || null);
    } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// 2. GENERIC UPLOAD ROUTE (Phase 1, 2, 3, 4)
router.post('/upload-doc', upload.single('file'), async (req, res) => {
    try {
        const { studentId, docType, proposedSupervisor } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'No file uploaded' });

        let updateData = {};
        
        switch(docType) {
            case 'proposal': 
                updateData = { 
                    documentUrl: file.path, 
                    status: 'Pending Coordinator Review', 
                    proposedSupervisorName: proposedSupervisor 
                }; 
                break;
            case 'ppt': updateData = { presentationUrl: file.path }; break;
            case 'srs': updateData = { srsUrl: file.path }; break;
            case 'sds': updateData = { sdsUrl: file.path }; break;
            case 'final': updateData = { finalReportUrl: file.path }; break;
            case 'code': updateData = { finalCodeUrl: file.path }; break;
        }

        let project = await Project.findOne({ leaderId: studentId });
        
        if (project) {
            project = await Project.findOneAndUpdate({ leaderId: studentId }, updateData, { new: true });
        } else if (docType === 'proposal') {
            project = new Project({ leaderId: studentId, ...updateData });
            await project.save();
        }

        res.json({ message: 'Upload successful!', project });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. Submit Weekly Log (Phase 3)
router.post('/submit-log', async (req, res) => {
    try {
        const { studentId, weekNo, content } = req.body;
        const project = await Project.findOne({ leaderId: studentId });
        if (!project) return res.status(404).json({ message: "Project not found" });

        project.weeklyLogs.push({ weekNo, content });
        await project.save();
        res.json({ message: "Log Submitted", logs: project.weeklyLogs });
    } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// ==========================================
//        BOARD / EXAMINER ROUTES
// ==========================================

// 4. Get Projects for Evaluation
router.get('/evaluation-list/:type', async (req, res) => {
    try {
        const type = req.params.type;
        let query = {};

        if (type === 'proposal') query = { status: { $in: ['Scheduled for Defense', 'Defense Changes Required'] } };
        else if (type === 'interim') query = { interimDate: { $ne: null } }; 
        else if (type === 'final') query = { finalDefenseDate: { $ne: null } };

        const projects = await Project.find(query).populate('leaderId', 'name enrollment email');
        res.json(projects);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

// 5. Submit Grades
router.put('/submit-grade/:id', async (req, res) => {
    try {
        const { gradeType, marks, feedback, status } = req.body; 
        let updateFields = {};
        updateFields[`marks.${gradeType}`] = marks; 
        if (status) updateFields['status'] = status;
        if (feedback) updateFields['defenseFeedback'] = feedback;

        const project = await Project.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
        await project.save(); 

        res.json({ message: "Grade Recorded", project });
    } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// ==========================================
//          COORDINATOR ROUTES
// ==========================================

router.get('/pending', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'Pending Coordinator Review' })
      .populate('leaderId', 'name enrollment email');
    res.json(projects);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.get('/supervisors', async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }, 'name email facultyId department');
    res.json(supervisors);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.put('/assign-supervisor/:id', async (req, res) => {
  try {
    const { supervisorId, feedback } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        supervisorId: supervisorId,
        status: 'Approved - Waiting for Supervisor Consent',
        supervisorConsent: 'Pending',
        coordinatorFeedback: feedback || null
      },
      { new: true }
    ).populate('supervisorId', 'name email');
    res.json({ message: 'Supervisor assigned!', project });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.put('/decision/:id', async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const updateData = { status };
    if (feedback) updateData.coordinatorFeedback = feedback;
    const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('leaderId', 'name enrollment email');
    res.json({ message: `Project ${status}`, project });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

// --- FIX: ASSIGN DEFENSE ROUTE ---
router.put('/assign-defense/:id', async (req, res) => {
    try {
        const { date, room } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        // --- RELAXED CHECK ---
        // Allow if it's "Ready for Defense" OR just "Approved" (fallback) OR already Scheduled
        const allowedStatuses = [
            'Approved - Ready for Defense', 
            'Scheduled for Defense',
            'Supervisor Approved', // Added for backward compatibility
            'Approved' // Added just in case
        ];

        if (!allowedStatuses.includes(project.status)) {
             return res.status(400).json({ 
                 message: `Project not ready. Current status: ${project.status}` 
             });
        }

        project.defenseDate = date;
        project.defenseRoom = room; 
        project.status = 'Scheduled for Defense';
        await project.save();

        res.json({ message: "Defense Date and Room Assigned", project });
    } catch (error) {
        console.error("Assign Defense Error:", error);
        res.status(500).json({ message: "Server Error" });
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
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.put('/supervisor-decision/:id', async (req, res) => {
  try {
    const { decision, feedback } = req.body;
    // Ensure this matches the string expected by assign-defense
    const status = decision === 'Approved' ? 'Approved - Ready for Defense' : 'Supervisor Rejected';
    
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
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

// ==========================================
//             PANEL ROUTES
// ==========================================

// 6. Get Defense Pending Projects (Updated for new status)
router.get('/defense-pending', async (req, res) => {
  try {
    const projects = await Project.find({ 
      status: { $in: ['Approved - Ready for Defense', 'Scheduled for Defense', 'Defense Changes Required'] } 
    }).populate('leaderId', 'name enrollment email').populate('supervisorId', 'name email');
    res.json(projects);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

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

module.exports = router;