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
    } catch (error) { 
        console.error("Error submitting log:", error);
        res.status(500).json({ message: "Server Error" }); 
    }
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
    } catch (error) { 
        console.error("Error fetching evaluation list:", error);
        res.status(500).json({ message: 'Server Error' }); 
    }
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
    } catch (error) { 
        console.error("Error submitting grade:", error);
        res.status(500).json({ message: "Server Error" }); 
    }
});

// ==========================================
//          COORDINATOR ROUTES
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

// --- FIX: ASSIGN DEFENSE ROUTE ---
router.put('/assign-defense/:id', async (req, res) => {
    try {
        const { date, room } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        const allowedStatuses = [
            'Approved - Ready for Defense', 
            'Scheduled for Defense',
            'Supervisor Approved',
            'Approved'
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
        console.error("Error making defense decision:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// ==========================================
//     INITIAL DEFENSE EVALUATION ROUTES
// ==========================================

// 1. Get projects ready for initial defense evaluation - FIXED FOR PANEL
router.get('/initial-defense-projects', async (req, res) => {
  try {
    const projects = await Project.find({
      status: { $in: ['Scheduled for Defense', 'Defense Changes Required'] },
      presentationUrl: { $ne: null },
      $or: [
        { 'initialDefenseMarks.panel': null },
        { 'initialDefenseMarks.panel': { $exists: false } },
        { initialDefenseCompleted: false }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');
    
    console.log(`Found ${projects.length} initial defense projects for panel evaluation`);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching initial defense projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. Get supervisor's assigned project for initial defense
router.get('/supervisor-initial-defense/:supervisorId', async (req, res) => {
  try {
    const projects = await Project.find({
      supervisorId: req.params.supervisorId,
      presentationUrl: { $ne: null },
      status: 'Scheduled for Defense'
    })
    .populate('leaderId', 'name enrollment email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching supervisor initial defense:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 3. Submit initial defense marks - UPDATED LOGIC
router.put('/submit-initial-defense-marks/:projectId', async (req, res) => {
  try {
    const { role, marks, feedback } = req.body;
    
    // Find project first
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Initialize marks if not exist
    if (!project.initialDefenseMarks) {
      project.initialDefenseMarks = {
        coordinator: null,
        supervisor: null,
        panel: null,
        feedback: ''
      };
    }

    // Update marks based on role
    if (role === 'coordinator') {
      project.initialDefenseMarks.coordinator = marks;
    } else if (role === 'supervisor') {
      project.initialDefenseMarks.supervisor = marks;
    } else if (role === 'panel') {
      project.initialDefenseMarks.panel = marks;
    }

    // Update feedback if provided
    if (feedback) {
      project.initialDefenseMarks.feedback = feedback;
    }

    // Check if all marks are given
    const allMarksGiven = project.initialDefenseMarks.coordinator !== null && 
                         project.initialDefenseMarks.supervisor !== null && 
                         project.initialDefenseMarks.panel !== null;

    if (allMarksGiven) {
      project.initialDefenseCompleted = true;
      // Set status to 'Defense Cleared' - THIS IS CRITICAL FOR SRS/SDS FLOW
      project.status = 'Defense Cleared';
    }

    await project.save();
    
    res.json({ 
      message: 'Marks submitted successfully', 
      project: project,
      allMarksGiven 
    });
  } catch (error) {
    console.error('Error submitting initial defense marks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 4. Get student's initial defense marks
router.get('/initial-defense-marks/:studentId', async (req, res) => {
  try {
    const project = await Project.findOne({ 
      leaderId: req.params.studentId 
    }).select('initialDefenseMarks initialDefenseCompleted');
    res.json(project);
  } catch (error) {
    console.error('Error fetching initial defense marks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
//     SRS/SDS REVIEW ROUTES - FIXED VERSION
// ==========================================

// 1. Submit SRS/SDS for review - FIXED
router.put('/submit-srs-sds-review/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if both SRS and SDS are uploaded
    if (!project.srsUrl || !project.sdsUrl) {
      return res.status(400).json({ 
        message: 'Both SRS and SDS documents must be uploaded before submission' 
      });
    }

    // Update project status
    project.srsSdsStatus = 'Pending Review';
    project.status = 'Ready for SRS/SDS Review';
    
    // Initialize review marks if not exists
    if (!project.srsSdsReviewMarks) {
      project.srsSdsReviewMarks = {
        coordinator: null,
        supervisor: null,
        panel: null
      };
    }
    
    await project.save();
    
    res.json({ 
      message: 'SRS/SDS submitted for review successfully', 
      project 
    });
  } catch (error) {
    console.error('Error submitting SRS/SDS for review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. Get projects for SRS/SDS review (for Supervisor first) - FIXED
router.get('/srs-sds-review-projects', async (req, res) => {
  try {
    const projects = await Project.find({
      srsSdsStatus: 'Pending Review',
      status: 'Ready for SRS/SDS Review'
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching SRS/SDS review projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 3. Supervisor accepts/rejects SRS/SDS - FIXED
router.put('/supervisor-srs-sds-decision/:id', async (req, res) => {
  try {
    const { decision, feedback } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (decision === 'Approved') {
      project.srsSdsStatus = 'Under Review';
      project.status = 'SRS/SDS Under Review';
      // Supervisor gives their marks - set to 0 initially, will be updated when they evaluate
      if (project.srsSdsReviewMarks) {
        project.srsSdsReviewMarks.supervisor = 0;
      }
    } else {
      project.srsSdsStatus = decision;
      project.status = `SRS/SDS ${decision}`;
    }
    
    if (feedback) {
      project.srsSdsFeedback = feedback;
    }
    
    await project.save();
    
    res.json({ 
      message: `SRS/SDS ${decision} by supervisor`, 
      project 
    });
  } catch (error) {
    console.error('Error making SRS/SDS decision:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 4. Get projects for Coordinator/Panel review (after supervisor approval) - FIXED FOR PANEL
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
    
    console.log(`Found ${projects.length} SRS/SDS evaluation projects for panel`);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching SRS/SDS evaluation projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/// 5. Submit SRS/SDS evaluation marks (Coordinator, Supervisor, Panel) - FIXED
router.put('/submit-srs-sds-marks/:projectId', async (req, res) => {
  try {
    const { role, marks, feedback } = req.body;
    const projectId = req.params.projectId;
    
    console.log('SRS/SDS Marks Submission Request - PANEL VERSION:', {
      projectId,
      role,
      marks,
      feedback,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!role || marks === undefined) {
      return res.status(400).json({ 
        message: 'Role and marks are required' 
      });
    }

    if (marks < 0 || marks > 5) {
      return res.status(400).json({ 
        message: 'Marks must be between 0 and 5' 
      });
    }

    // Find project first
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('Project found for SRS/SDS evaluation:', {
      projectId: project._id,
      studentId: project.leaderId,
      srsSdsStatus: project.srsSdsStatus,
      currentMarks: project.srsSdsReviewMarks,
      currentPanelMarks: project.srsSdsReviewMarks?.panel
    });

    // Initialize review marks if not exists
    if (!project.srsSdsReviewMarks) {
      project.srsSdsReviewMarks = {
        coordinator: null,
        supervisor: null,
        panel: null
      };
    }

    // Update marks based on role
    if (role === 'coordinator') {
      project.srsSdsReviewMarks.coordinator = parseFloat(marks);
    } else if (role === 'supervisor') {
      project.srsSdsReviewMarks.supervisor = parseFloat(marks);
    } else if (role === 'panel') {
      // Check if panel has already evaluated
      if (project.srsSdsReviewMarks.panel !== null && 
          project.srsSdsReviewMarks.panel !== undefined) {
        console.log('Panel has already evaluated this project. Previous marks:', project.srsSdsReviewMarks.panel);
      }
      project.srsSdsReviewMarks.panel = parseFloat(marks);
    } else {
      return res.status(400).json({ 
        message: 'Invalid role. Must be coordinator, supervisor, or panel' 
      });
    }

    // Update feedback if provided
    if (feedback) {
      project.srsSdsFeedback = feedback;
    }

    // Check if all marks are given
    const allMarksGiven = project.srsSdsReviewMarks.coordinator !== null && 
                         project.srsSdsReviewMarks.supervisor !== null && 
                         project.srsSdsReviewMarks.panel !== null;

    console.log('All marks status after update:', {
      coordinator: project.srsSdsReviewMarks.coordinator,
      supervisor: project.srsSdsReviewMarks.supervisor,
      panel: project.srsSdsReviewMarks.panel,
      allMarksGiven
    });

    if (allMarksGiven) {
      project.srsSdsReviewCompleted = true;
      
      // Calculate average marks
      const avgMarks = (project.srsSdsReviewMarks.coordinator + 
                       project.srsSdsReviewMarks.supervisor + 
                       project.srsSdsReviewMarks.panel) / 3;
      
      console.log('All evaluations complete. Average marks:', avgMarks);
      
      // Determine status based on marks (e.g., if avg >= 2.5)
      if (avgMarks >= 2.5) {
        project.srsSdsStatus = 'Approved';
        project.status = 'Development Phase';
        console.log('Project approved, moving to Development Phase');
      } else {
        project.srsSdsStatus = 'Changes Required';
        project.status = 'SRS/SDS Changes Required';
        console.log('Project requires changes');
      }
    }

    // Save the project
    const savedProject = await project.save();
    
    // Populate the leaderId for response
    const populatedProject = await Project.findById(savedProject._id)
      .populate('leaderId', 'name enrollment email')
      .populate('supervisorId', 'name email');
    
    console.log('Project saved successfully:', {
      projectId: populatedProject._id,
      studentName: populatedProject.leaderId?.name,
      srsSdsStatus: populatedProject.srsSdsStatus,
      status: populatedProject.status,
      reviewCompleted: populatedProject.srsSdsReviewCompleted,
      finalMarks: populatedProject.srsSdsReviewMarks
    });
    
    res.json({ 
      message: 'SRS/SDS marks submitted successfully', 
      project: populatedProject,
      allMarksGiven 
    });
  } catch (error) {
    console.error('Error submitting SRS/SDS marks:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message // Always show error in development
    });
  }
});

// 6. Get supervisor's SRS/SDS review projects
router.get('/supervisor-srs-sds-review/:supervisorId', async (req, res) => {
  try {
    console.log('Fetching SRS/SDS review projects for supervisor:', req.params.supervisorId);
    
    const supervisorId = req.params.supervisorId;
    
    // First verify if supervisor exists
    const supervisor = await User.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({ message: 'Supervisor not found' });
    }

    // Find projects where:
    // 1. Supervisor ID matches
    // 2. Both SRS and SDS are uploaded
    // 3. Project is in a state related to SRS/SDS
    const projects = await Project.find({
      supervisorId: supervisorId,
      srsUrl: { $exists: true, $ne: null },
      sdsUrl: { $exists: true, $ne: null },
      $or: [
        { srsSdsStatus: 'Pending Review' },
        { srsSdsStatus: 'Under Review' },
        { srsSdsStatus: null },
        { status: 'Ready for SRS/SDS Review' },
        { status: 'SRS/SDS Under Review' }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');

    console.log(`Found ${projects.length} SRS/SDS projects for supervisor ${supervisorId}`);
    
    // Format the response
    const formattedProjects = projects.map(project => ({
      ...project.toObject(),
      // Ensure srsSdsStatus has a default value
      srsSdsStatus: project.srsSdsStatus || 'Pending Review',
      // Ensure review marks exist
      srsSdsReviewMarks: project.srsSdsReviewMarks || {
        coordinator: null,
        supervisor: null,
        panel: null
      }
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching supervisor SRS/SDS projects:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 7. Get supervisor's projects for SRS/SDS evaluation (after acceptance)
router.get('/supervisor-srs-sds-evaluation/:supervisorId', async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;
    
    // Find projects where:
    // 1. Supervisor ID matches
    // 2. SRS/SDS is under review
    // 3. Supervisor hasn't evaluated yet or evaluation is pending
    const projects = await Project.find({
      supervisorId: supervisorId,
      srsSdsStatus: 'Under Review',
      status: 'SRS/SDS Under Review',
      $or: [
        { 'srsSdsReviewMarks.supervisor': null },
        { 'srsSdsReviewMarks.supervisor': { $exists: false } }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');

    res.json(projects);
  } catch (error) {
    console.error('Error fetching supervisor SRS/SDS evaluation projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 8. Check if panel has already evaluated SRS/SDS
router.get('/check-panel-srs-sds-evaluation/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .select('srsSdsReviewMarks srsSdsReviewCompleted');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const hasEvaluated = project.srsSdsReviewMarks && 
                       project.srsSdsReviewMarks.panel !== undefined && 
                       project.srsSdsReviewMarks.panel !== null;
    
    res.json({ 
      hasEvaluated, 
      panelMarks: project.srsSdsReviewMarks?.panel,
      isCompleted: project.srsSdsReviewCompleted 
    });
  } catch (error) {
    console.error('Error checking panel evaluation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 9. DEBUG: Get all project data for a student (for testing)
router.get('/debug/:studentId', async (req, res) => {
  try {
    const project = await Project.findOne({ leaderId: req.params.studentId });
    res.json({
      project: project,
      hasSrsSdsData: !!project?.srsSdsReviewMarks,
      srsSdsMarks: project?.srsSdsReviewMarks,
      srsSdsStatus: project?.srsSdsStatus,
      projectStatus: project?.status
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
//     PANEL-SPECIFIC ROUTES (for BoardDashboard)
// ==========================================

// 10. Get coordinator's initial defense projects
router.get('/coordinator-initial-defense-projects', async (req, res) => {
  try {
    const projects = await Project.find({
      status: { $in: ['Scheduled for Defense', 'Defense Changes Required'] },
      presentationUrl: { $ne: null },
      $or: [
        { 'initialDefenseMarks.coordinator': null },
        { 'initialDefenseMarks.coordinator': { $exists: false } },
        { initialDefenseCompleted: false }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');
    
    console.log(`Found ${projects.length} initial defense projects for coordinator`);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching coordinator initial defense projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 11. Get coordinator's SRS/SDS evaluation projects
router.get('/coordinator-srs-sds-evaluation-projects', async (req, res) => {
  try {
    const projects = await Project.find({
      srsSdsStatus: 'Under Review',
      status: 'SRS/SDS Under Review',
      $or: [
        { 'srsSdsReviewMarks.coordinator': null },
        { 'srsSdsReviewMarks.coordinator': { $exists: false } },
        { srsSdsReviewCompleted: false }
      ]
    })
    .populate('leaderId', 'name enrollment email')
    .populate('supervisorId', 'name email');
    
    console.log(`Found ${projects.length} SRS/SDS evaluation projects for coordinator`);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching coordinator SRS/SDS evaluation projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;