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
        const project = await Project.findOne({ leaderId: req.params.studentId })
            .populate('supervisorId', 'name email')
            .populate('leaderId', 'name enrollment email');
        res.json(project || null);
    } catch (error) { 
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Server Error" }); 
    }
});

// 2. GENERIC UPLOAD ROUTE
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
            // Phase 4: Final PPT Upload
            case 'final-ppt': 
                updateData = { 
                    'finalDefense.finalPptUrl': file.path,
                    status: 'Final Defense Pending' // Ready for grading
                };
                break;
            case 'code': updateData = { finalCodeUrl: file.path }; break;
        }

        let project = await Project.findOne({ leaderId: studentId });
        
        if (project) {
            project = await Project.findOneAndUpdate({ leaderId: studentId }, { $set: updateData }, { new: true });
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

// ==========================================
//        PHASE 4: WEEKLY LOGS & MEETINGS
// ==========================================

// 1. Student Requests Meeting
router.post('/request-meeting', async (req, res) => {
    try {
        const { projectId, weekNumber, date } = req.body;
        const project = await Project.findById(projectId);
        
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Remove existing log for this week if exists to overwrite
        if (project.weeklyLogs) {
            project.weeklyLogs = project.weeklyLogs.filter(log => log.weekNumber !== parseInt(weekNumber));
        } else {
            project.weeklyLogs = [];
        }

        // Add new log entry
        project.weeklyLogs.push({
            weekNumber: parseInt(weekNumber),
            meetingDate: date,
            meetingStatus: 'Pending',
            content: null
        });

        // Ensure status is Development Phase
        if(project.status !== 'Development Phase') {
            project.status = 'Development Phase';
        }

        await project.save();
        res.json({ message: "Meeting Requested", logs: project.weeklyLogs });
    } catch (error) {
        console.error("Error requesting meeting:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// 2. Supervisor Accepts Meeting
router.put('/accept-meeting/:projectId', async (req, res) => {
    try {
        const { weekNumber } = req.body;
        const project = await Project.findById(req.params.projectId);
        
        const logIndex = project.weeklyLogs.findIndex(l => l.weekNumber === parseInt(weekNumber));
        if (logIndex === -1) return res.status(404).json({ message: "Log request not found" });

        project.weeklyLogs[logIndex].meetingStatus = 'Accepted';
        await project.save();

        res.json({ message: "Meeting Accepted", logs: project.weeklyLogs });
    } catch (error) {
        console.error("Error accepting meeting:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// 3. Supervisor Writes Log
router.put('/write-weekly-log/:projectId', async (req, res) => {
    try {
        const { weekNumber, content } = req.body;
        const project = await Project.findById(req.params.projectId);

        const logIndex = project.weeklyLogs.findIndex(l => l.weekNumber === parseInt(weekNumber));
        if (logIndex === -1) return res.status(404).json({ message: "Log entry not found" });

        project.weeklyLogs[logIndex].content = content;
        project.weeklyLogs[logIndex].submittedAt = Date.now();
        
        await project.save();
        res.json({ message: "Log Saved", logs: project.weeklyLogs });
    } catch (error) {
        console.error("Error writing log:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// ==========================================
//        PHASE 4: FINAL DEFENSE
// ==========================================

// 1. Coordinator Assigns Final Defense Date
router.put('/schedule-final-defense/:id', async (req, res) => {
    try {
        const { date } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            {
                'finalDefense.scheduledDate': date,
                status: 'Final Defense Scheduled'
            },
            { new: true }
        );
        res.json({ message: "Final Defense Scheduled", project });
    } catch (error) {
        console.error("Error scheduling final defense:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// 2. Submit Final Defense Marks (For All 4 Roles)
router.put('/submit-final-marks/:id', async (req, res) => {
    try {
        const { role, marks } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: "Project not found" });

        // Update the specific mark
        if (!project.finalDefense.marks) project.finalDefense.marks = {};
        project.finalDefense.marks[role] = parseInt(marks);

        // Check if all 4 have graded
        const m = project.finalDefense.marks;
        if (m.coordinator != null && m.supervisor != null && m.panel != null && m.external != null) {
            project.status = 'Project Completed';
        }

        await project.save();
        res.json({ message: "Grade Submitted", project });
    } catch (error) {
        console.error("Error submitting final grade:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// ==========================================
//        EXTERNAL EXAMINER ROUTES
// ==========================================

router.get('/external-pending', async (req, res) => {
    try {
        const projects = await Project.find({
            status: { $in: ['Final Defense Pending', 'Project Completed', 'Final Defense Scheduled'] },
            'finalDefense.finalPptUrl': { $ne: null }
        })
        .populate('leaderId', 'name enrollment email')
        .populate('supervisorId', 'name');
        
        res.json(projects);
    } catch (error) {
        console.error("Error fetching external projects:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// ADD THIS NEW ROUTE FOR EXTERNAL EXAMINER TO SUBMIT MARKS
router.put('/external-submit-marks/:id', async (req, res) => {
    try {
        const { marks } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: "Project not found" });

        // Check if final PPT is uploaded
        if (!project.finalDefense.finalPptUrl) {
            return res.status(400).json({ message: "Final PPT not uploaded yet" });
        }

        // Update external examiner marks
        if (!project.finalDefense.marks) project.finalDefense.marks = {};
        project.finalDefense.marks.external = parseInt(marks);

        // Check if all 4 have graded (including external)
        const m = project.finalDefense.marks;
        if (m.coordinator != null && m.supervisor != null && m.panel != null && m.external != null) {
            project.status = 'Project Completed';
            
            // Optional: Calculate final grade
            const totalMarks = m.coordinator + m.supervisor + m.panel + m.external;
            project.finalDefense.totalMarks = totalMarks;
            project.finalDefense.percentage = (totalMarks / 100) * 100; // Assuming 100 total marks
        }

        await project.save();
        res.json({ 
            message: "External Examiner Grade Submitted", 
            project,
            allGraded: project.status === 'Project Completed'
        });
    } catch (error) {
        console.error("Error submitting external examiner grade:", error);
        res.status(500).json({ message: "Server Error" });
    }
});
// ==========================================
//          EVALUATION LIST (UPDATED)
// ==========================================

// 4. Get Projects for Evaluation (Coordinator & Panel use this)
router.get('/evaluation-list/:type', async (req, res) => {
    try {
        const type = req.params.type;
        let query = {};

        if (type === 'proposal') {
            query = { status: { $in: ['Scheduled for Defense', 'Defense Changes Required'] } };
        } 
        else if (type === 'interim') {
            query = { interimDate: { $ne: null } }; 
        } 
        else if (type === 'final') {
             // FIX: ADDED 'Development Phase' SO COORDINATOR CAN SCHEDULE
             query = { 
                 status: { 
                     $in: [
                         'Development Phase',        // Ready to Schedule
                         'Final Defense Scheduled',  // Scheduled
                         'Final Defense Pending',    // Waiting for grades
                         'Project Completed'         // Done
                     ] 
                 } 
             };
        }

        const projects = await Project.find(query).populate('leaderId', 'name enrollment email');
        res.json(projects);
    } catch (error) { 
        console.error("Error fetching evaluation list:", error);
        res.status(500).json({ message: 'Server Error' }); 
    }
});

// ==========================================
//           COORDINATOR ROUTES
// ==========================================

router.get('/pending', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'Pending Coordinator Review' })
      .populate('leaderId', 'name enrollment email');
    res.json(projects);
  } catch (error) { 
    console.error("Error fetching pending projects:", error);
    res.status(500).json({ message: 'Server Error' }); 
  }
});

router.get('/supervisors', async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }, 'name email facultyId department');
    res.json(supervisors);
  } catch (error) { 
    console.error("Error fetching supervisors:", error);
    res.status(500).json({ message: 'Server Error' }); 
  }
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
  } catch (error) { 
    console.error("Error assigning supervisor:", error);
    res.status(500).json({ message: 'Server Error' }); 
  }
});

router.put('/decision/:id', async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const updateData = { status };
    if (feedback) updateData.coordinatorFeedback = feedback;
    const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('leaderId', 'name enrollment email');
    res.json({ message: `Project ${status}`, project });
  } catch (error) { 
    console.error("Error making coordinator decision:", error);
    res.status(500).json({ message: 'Server Error' }); 
  }
});

// Phase 2 Defense Assignment
router.put('/assign-defense/:id', async (req, res) => {
    try {
        const { date } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        project.defenseDate = date;
        project.status = 'Scheduled for Defense';
        await project.save();

        res.json({ message: "Defense Date Assigned", project });
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
  } catch (error) { 
    console.error("Error fetching supervisor pending:", error);
    res.status(500).json({ message: 'Server Error' }); 
  }
});

router.put('/supervisor-decision/:id', async (req, res) => {
  try {
    const { decision, feedback } = req.body;
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
  } catch (error) { 
    console.error("Error making supervisor decision:", error);
    res.status(500).json({ message: 'Server Error' }); 
  }
});

// New "Fetch All" route for Supervisor Dashboard consistency
router.get('/supervisor/all-my-projects/:id', async (req, res) => {
    try {
        const projects = await Project.find({ supervisorId: req.params.id })
            .populate('leaderId', 'name enrollment email')
            .populate('supervisorId', 'name email');
        res.json(projects);
    } catch (error) {
        console.error("Error fetching supervisor projects:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// ==========================================
//             PANEL ROUTES
// ==========================================

router.get('/defense-pending', async (req, res) => {
  try {
    const projects = await Project.find({ 
      status: { $in: ['Approved - Ready for Defense', 'Scheduled for Defense', 'Defense Changes Required'] } 
    }).populate('leaderId', 'name enrollment email').populate('supervisorId', 'name email');
    res.json(projects);
  } catch (error) { 
    console.error("Error fetching defense pending:", error);
    res.status(500).json({ message: 'Server Error' }); 
  }
});

// ==========================================
//     INITIAL DEFENSE EVALUATION ROUTES
// ==========================================

router.get('/initial-defense-projects', async (req, res) => {
  try {
    const projects = await Project.find({
      status: { $in: ['Scheduled for Defense', 'Defense Changes Required', 'Defense Cleared'] },
      presentationUrl: { $ne: null },
      $or: [
        { 'initialDefenseMarks.panel': null },
        { 'initialDefenseMarks.panel': { $exists: false } },
        { initialDefenseCompleted: false }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching initial defense projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/supervisor-initial-defense/:supervisorId', async (req, res) => {
  try {
    const projects = await Project.find({
      supervisorId: req.params.supervisorId,
      presentationUrl: { $ne: null },
      status: { $in: ['Scheduled for Defense', 'Defense Cleared'] }
    })
    .populate('leaderId', 'name enrollment email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching supervisor initial defense:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/submit-initial-defense-marks/:projectId', async (req, res) => {
  try {
    const { role, marks, feedback } = req.body;
    
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.initialDefenseMarks) project.initialDefenseMarks = {};

    if (role === 'coordinator') project.initialDefenseMarks.coordinator = marks;
    else if (role === 'supervisor') project.initialDefenseMarks.supervisor = marks;
    else if (role === 'panel') project.initialDefenseMarks.panel = marks;

    if (feedback) project.initialDefenseMarks.feedback = feedback;

    const allMarksGiven = project.initialDefenseMarks.coordinator !== null && 
                           project.initialDefenseMarks.supervisor !== null && 
                           project.initialDefenseMarks.panel !== null;

    if (allMarksGiven) {
      project.initialDefenseCompleted = true;
      project.status = 'Defense Cleared';
    }

    await project.save();
    
    res.json({ message: 'Marks submitted successfully', project: project, allMarksGiven });
  } catch (error) {
    console.error('Error submitting initial defense marks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
//     SRS/SDS REVIEW ROUTES
// ==========================================

router.put('/submit-srs-sds-review/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.srsUrl || !project.sdsUrl) {
      return res.status(400).json({ message: 'Both SRS and SDS documents must be uploaded' });
    }

    project.srsSdsStatus = 'Pending Review';
    project.status = 'Ready for SRS/SDS Review';
    if (!project.srsSdsReviewMarks) project.srsSdsReviewMarks = { coordinator: null, supervisor: null, panel: null };
    
    await project.save();
    res.json({ message: 'SRS/SDS submitted successfully', project });
  } catch (error) {
    console.error('Error submitting SRS/SDS:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/supervisor-srs-sds-decision/:id', async (req, res) => {
  try {
    const { decision, feedback } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (decision === 'Approved') {
      project.srsSdsStatus = 'Under Review';
      project.status = 'SRS/SDS Under Review';
    } else {
      project.srsSdsStatus = decision;
      project.status = `SRS/SDS ${decision}`;
    }
    
    if (feedback) project.srsSdsFeedback = feedback;
    
    await project.save();
    res.json({ message: `SRS/SDS ${decision}`, project });
  } catch (error) {
    console.error('Error making SRS/SDS decision:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/srs-sds-evaluation-projects', async (req, res) => {
  try {
    const projects = await Project.find({
      srsSdsStatus: 'Under Review',
      status: 'SRS/SDS Under Review',
      $or: [
        { 'srsSdsReviewMarks.panel': null },
        { 'srsSdsReviewMarks.panel': { $exists: false } },
        { srsSdsReviewCompleted: false }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching SRS/SDS evaluation projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/submit-srs-sds-marks/:projectId', async (req, res) => {
  try {
    const { role, marks, feedback } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.srsSdsReviewMarks) project.srsSdsReviewMarks = {};

    if (role === 'coordinator') project.srsSdsReviewMarks.coordinator = parseFloat(marks);
    else if (role === 'supervisor') project.srsSdsReviewMarks.supervisor = parseFloat(marks);
    else if (role === 'panel') project.srsSdsReviewMarks.panel = parseFloat(marks);

    if (feedback) project.srsSdsFeedback = feedback;

    const allMarksGiven = project.srsSdsReviewMarks.coordinator !== null && 
                           project.srsSdsReviewMarks.supervisor !== null && 
                           project.srsSdsReviewMarks.panel !== null;

    if (allMarksGiven) {
      project.srsSdsReviewCompleted = true;
      const avgMarks = (project.srsSdsReviewMarks.coordinator + project.srsSdsReviewMarks.supervisor + project.srsSdsReviewMarks.panel) / 3;
      
      if (avgMarks >= 2.5) {
        project.srsSdsStatus = 'Approved';
        project.status = 'Development Phase';
      } else {
        project.srsSdsStatus = 'Changes Required';
        project.status = 'SRS/SDS Changes Required';
      }
    }

    await project.save();
    res.json({ message: 'SRS/SDS marks submitted', project, allMarksGiven });
  } catch (error) {
    console.error('Error submitting SRS/SDS marks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Original Supervisor active active projects route (kept for safety/backup logic)
router.get('/supervisor-srs-sds-review/:supervisorId', async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;
    const supervisor = await User.findById(supervisorId);
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found' });

    const projects = await Project.find({
      supervisorId: supervisorId,
      srsUrl: { $exists: true },
      sdsUrl: { $exists: true },
      $or: [
        { srsSdsStatus: 'Pending Review' },
        { srsSdsStatus: 'Under Review' },
        { status: 'Ready for SRS/SDS Review' },
        { status: 'SRS/SDS Under Review' },
        { status: 'Development Phase' },
        { status: 'Final Defense Scheduled' },
        { status: 'Final Defense Pending' },
        { status: 'Project Completed' }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');

    res.json(projects);
  } catch (error) {
    console.error('Error fetching supervisor SRS/SDS projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;