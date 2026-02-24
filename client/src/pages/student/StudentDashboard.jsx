import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // File States
  const [file, setFile] = useState(null);
  const [pptFile, setPptFile] = useState(null);
  const [srsFile, setSrsFile] = useState(null);
  const [sdsFile, setSdsFile] = useState(null);
  const [finalPptFile, setFinalPptFile] = useState(null);

  // UI States
  const [uploading, setUploading] = useState(false);
  const [proposedSupervisor, setProposedSupervisor] = useState('');
  
  // Phase 4: Meeting Request State
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingWeek, setMeetingWeek] = useState(1);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'student') {
      navigate('/');
      alert('Please login as Student first');
      return;
    }
    setStudent(userInfo);
    refreshProjectStatus(userInfo._id);
  }, [navigate]);

  // Enhanced refresh function
  const refreshProjectStatus = async (studentId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://${process.env.REACT_APP_API_URL}/api/projects/my-project/${studentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error refreshing project:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Generic Upload Handler ---
  const handleUpload = async (e, docType) => {
    e.preventDefault();
    const fileToUpload = 
        docType === 'proposal' ? file : 
        docType === 'ppt' ? pptFile :
        docType === 'srs' ? srsFile :
        docType === 'sds' ? sdsFile :
        docType === 'final-ppt' ? finalPptFile : null;

    if (!fileToUpload) { 
      alert('Please select a file first!'); 
      return; 
    }
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('studentId', student._id);
    formData.append('docType', docType);
    
    if (docType === 'proposal' && proposedSupervisor) {
        formData.append('proposedSupervisor', proposedSupervisor);
    }

    try {
      setUploading(true);
      const response = await fetch('http://${process.env.REACT_APP_API_URL}/api/projects/upload-doc', { 
        method: 'POST', 
        body: formData 
      });
      const data = await response.json();

      if (response.ok) {
        alert('✅ Upload successful!');
        // Clear inputs
        if (docType === 'proposal') setFile(null);
        if (docType === 'ppt') setPptFile(null);
        if (docType === 'srs') setSrsFile(null);
        if (docType === 'sds') setSdsFile(null);
        if (docType === 'final-ppt') setFinalPptFile(null);
        // Refresh project data
        refreshProjectStatus(student._id);
      } else {
        alert('❌ ' + (data.message || 'Upload failed'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Server error');
    } finally {
      setUploading(false);
    }
  };

  // --- Phase 4: Request Meeting ---
  const requestMeeting = async () => {
    if (!meetingDate) {
        alert("Please select a date for the meeting.");
        return;
    }

    try {
        const response = await fetch('http://${process.env.REACT_APP_API_URL}/api/projects/request-meeting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: project._id,
                weekNumber: meetingWeek,
                date: meetingDate
            })
        });

        if (response.ok) {
            alert("📅 Meeting Requested Successfully!");
            refreshProjectStatus(student._id);
        } else {
            alert("Failed to request meeting.");
        }
    } catch (error) {
        console.error("Meeting request error:", error);
    }
  };

  const submitForSrsSdsReview = async (projectId) => {
    try {
      const response = await fetch(`http://${process.env.REACT_APP_API_URL}/api/projects/submit-srs-sds-review/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ SRS/SDS submitted for review!');
        refreshProjectStatus(student._id);
      } else {
        alert('❌ ' + (data.message || 'Failed to submit for review'));
      }
    } catch (error) {
      console.error('Error submitting for review:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  // --- HELPERS ---
  const isPhase1Complete = (status) => !['Pending Coordinator Review', 'Rejected', 'Changes Required'].includes(status);
  const isPhase2Active = (status) => ['Approved - Ready for Defense', 'Scheduled for Defense', 'Defense Changes Required'].includes(status);
  const getStatusColor = (status) => {
    if (!status) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (status.includes('Approved') || status.includes('Cleared') || status.includes('Completed') || status.includes('Project Completed')) return 'bg-green-100 text-green-800 border-green-300';
    if (status.includes('Rejected')) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  // --- MARKING SCHEME CALCULATION ---
  const calculateTotalMarks = () => {
    if (!project) return { total: 0, breakdown: {}, letterGrade: 'N/A' };

    const breakdown = {};
    let total = 0;

    // 1. Proposal Evaluation (10% weight)
    // Proposal is typically evaluated by coordinator only
    if (project.status === 'Approved - Waiting for Supervisor Consent' || 
        project.status === 'Approved - Ready for Defense' ||
        project.status === 'Scheduled for Defense') {
      
      // Proposal is considered "passed" if it reaches these stages
      const proposalMarks = 8; // 8/10 for passing proposal
      const proposalWeighted = (proposalMarks / 10) * 10; // 10% weight
      
      breakdown.proposal = {
        marks: proposalMarks,
        maxMarks: 10,
        weighted: proposalWeighted.toFixed(2),
        description: 'Proposal Defense Evaluation'
      };
      total += proposalWeighted;
    }

    // 2. Initial Defense Evaluation (10% weight)
    if (project.initialDefenseMarks) {
      const coordinatorMarks = project.initialDefenseMarks.coordinator || 0;
      const supervisorMarks = project.initialDefenseMarks.supervisor || 0;
      const panelMarks = project.initialDefenseMarks.panel || 0;
      
      // Average of all 3 evaluators (each out of 10)
      const initialDefenseAverage = (coordinatorMarks + supervisorMarks + panelMarks) / 3;
      // Convert to percentage of 10% weight
      const initialDefenseWeighted = (initialDefenseAverage / 10) * 10;
      
      breakdown.initialDefense = {
        marks: { coordinatorMarks, supervisorMarks, panelMarks },
        average: initialDefenseAverage.toFixed(2),
        maxMarks: 10,
        weighted: initialDefenseWeighted.toFixed(2),
        description: 'Initial Defense Evaluation'
      };
      total += initialDefenseWeighted;
    }

    // 3. SRS/SDS Evaluation (15% weight)
    if (project.srsSdsReviewMarks) {
      const coordinatorMarks = project.srsSdsReviewMarks.coordinator || 0;
      const supervisorMarks = project.srsSdsReviewMarks.supervisor || 0;
      const panelMarks = project.srsSdsReviewMarks.panel || 0;
      
      // Average of all 3 evaluators (each out of 15)
      const srsSdsAverage = (coordinatorMarks + supervisorMarks + panelMarks) / 3;
      // Convert to percentage of 15% weight
      const srsSdsWeighted = (srsSdsAverage / 15) * 15;
      
      breakdown.srsSds = {
        marks: { coordinatorMarks, supervisorMarks, panelMarks },
        average: srsSdsAverage.toFixed(2),
        maxMarks: 15,
        weighted: srsSdsWeighted.toFixed(2),
        description: 'SRS/SDS Documentation'
      };
      total += srsSdsWeighted;
    }

    // 4. Final Defense Evaluation (65% weight total)
    if (project.finalDefense?.marks) {
      const finalMarks = project.finalDefense.marks;
      
      // Individual marks and their weights (out of 65% total):
      // - Coordinator: 15 marks out of 65 (23% weight of final defense)
      // - Supervisor: 15 marks out of 65 (23% weight of final defense)
      // - Panel: 25 marks out of 65 (38% weight of final defense)
      // - External: 10 marks out of 65 (15% weight of final defense)
      
      const coordinatorMarks = finalMarks.coordinator || 0;
      const supervisorMarks = finalMarks.supervisor || 0;
      const panelMarks = finalMarks.panel || 0;
      const externalMarks = finalMarks.external || 0;
      
      // Calculate weighted contributions (out of 65%)
      const coordinatorWeighted = (coordinatorMarks / 15) * 15; // 15% of total
      const supervisorWeighted = (supervisorMarks / 15) * 15;   // 15% of total
      const panelWeighted = (panelMarks / 25) * 25;            // 25% of total
      const externalWeighted = (externalMarks / 10) * 10;       // 10% of total
      
      const finalTotalWeighted = coordinatorWeighted + supervisorWeighted + panelWeighted + externalWeighted;
      
      breakdown.finalDefense = {
        marks: { 
          coordinatorMarks, 
          supervisorMarks, 
          panelMarks, 
          externalMarks 
        },
        weighted: {
          coordinator: coordinatorWeighted.toFixed(2),
          supervisor: supervisorWeighted.toFixed(2),
          panel: panelWeighted.toFixed(2),
          external: externalWeighted.toFixed(2),
          total: finalTotalWeighted.toFixed(2)
        },
        rawTotal: coordinatorMarks + supervisorMarks + panelMarks + externalMarks,
        maxRawTotal: 65
      };
      total += finalTotalWeighted;
    }

    // Calculate letter grade based on percentage
    const getLetterGrade = (percentage) => {
      if (percentage >= 90) return 'A+';
      if (percentage >= 85) return 'A';
      if (percentage >= 80) return 'A-';
      if (percentage >= 75) return 'B+';
      if (percentage >= 70) return 'B';
      if (percentage >= 65) return 'B-';
      if (percentage >= 60) return 'C+';
      if (percentage >= 55) return 'C';
      if (percentage >= 50) return 'C-';
      if (percentage >= 45) return 'D+';
      if (percentage >= 40) return 'D';
      return 'F';
    };

    const letterGrade = total > 0 ? getLetterGrade(total) : 'N/A';

    return {
      total: total.toFixed(2),
      breakdown,
      letterGrade,
      isComplete: project.status === 'Project Completed'
    };
  };

  if (!student) return <div className="text-white p-10">Loading...</div>;
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2342] via-[#1a365d] to-[#0a2342] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white/70">Loading dashboard...</p>
      </div>
    </div>
  );

  const marksData = calculateTotalMarks();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2342] via-[#1a365d] to-[#0a2342] text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
              <div className="text-center">
                <div className="text-[9px] font-bold text-[#0a2342] leading-tight">BU</div>
                <div className="text-[7px] font-bold text-[#0a2342] leading-tight">FYP</div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Student Dashboard</h1>
              <p className="text-sm text-white/70">{student.enrollment} • {student.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => refreshProjectStatus(student._id)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </span>
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: WORKFLOW */}
        <div className="space-y-6">
          
          {/* Phase 1: Proposal */}
          {!project || !isPhase1Complete(project.status) ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Phase 1: Proposal Submission</h2>
                  <p className="text-sm text-white/60">Weight: 10% • First step in FYP process</p>
                </div>
              </div>

              {project?.status === 'Approved - Waiting for Supervisor Consent' && (
                <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-400 text-xl">ℹ️</div>
                    <div>
                      <p className="text-blue-300 font-medium">Coordinator Accepted</p>
                      <p className="text-sm text-blue-200/80">Waiting for Supervisor to sign the consent form</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => handleUpload(e, 'proposal')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Proposed Supervisor (Optional)</label>
                  <input 
                    type="text" 
                    value={proposedSupervisor} 
                    onChange={(e) => setProposedSupervisor(e.target.value)} 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter supervisor name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Proposal Document</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={(e) => setFile(e.target.files[0])} 
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mt-2">Supported formats: PDF, DOC, DOCX</p>
                </div>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Submit Proposal'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-xl border border-green-500/30 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-emerald-800 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-green-400">Phase 1 Completed</h3>
                    <p className="text-sm text-white/60">Proposal Evaluation • 10% weight</p>
                  </div>
                </div>
                {marksData.breakdown.proposal && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-300">{marksData.breakdown.proposal.weighted}%</div>
                    <div className="text-sm text-white/60">{marksData.breakdown.proposal.marks}/{marksData.breakdown.proposal.maxMarks} marks</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 2: Initial Defense */}
          {project && isPhase2Active(project.status) && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎤</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Phase 2: Initial Defense</h2>
                  <p className="text-sm text-white/60">Weight: 10% • Presentation evaluation</p>
                </div>
              </div>

              {project.defenseDate ? (
                <>
                  <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-300 font-medium">Scheduled Defense</p>
                        <p className="text-lg font-bold text-white">{new Date(project.defenseDate).toDateString()}</p>
                        <p className="text-sm text-white/70">Room: {project.defenseRoom}</p>
                      </div>
                      <div className="text-3xl">⚖️</div>
                    </div>
                  </div>

                  <form onSubmit={(e) => handleUpload(e, 'ppt')} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Presentation File (PPT)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="file" 
                          accept=".ppt,.pptx,.pdf" 
                          onChange={(e) => setPptFile(e.target.files[0])} 
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-2">Upload your defense presentation</p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      Submit Presentation
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-white/80">Waiting for Coordinator to schedule defense...</p>
                  <p className="text-sm text-white/60 mt-2">You'll be notified when a date is assigned</p>
                </div>
              )}
            </div>
          )}

          {/* Phase 3: SRS/SDS */}
          {project && (project.status === 'Defense Cleared' || project.srsSdsStatus) && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Phase 3: SRS/SDS Documentation</h2>
                  <p className="text-sm text-white/60">Weight: 15% • System documentation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* SRS Upload */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📄</span>
                    </div>
                    <h3 className="font-medium text-white">Software Requirements Specification</h3>
                  </div>
                  <form onSubmit={(e) => handleUpload(e, 'srs')} className="space-y-3">
                    <input 
                      type="file" 
                      onChange={e => setSrsFile(e.target.files[0])} 
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
                      Upload SRS
                    </button>
                  </form>
                  {project.srsUrl && (
                    <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded text-center">
                      <span className="text-green-400 text-sm">✅ Uploaded</span>
                    </div>
                  )}
                </div>

                {/* SDS Upload */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📄</span>
                    </div>
                    <h3 className="font-medium text-white">Software Design Specification</h3>
                  </div>
                  <form onSubmit={(e) => handleUpload(e, 'sds')} className="space-y-3">
                    <input 
                      type="file" 
                      onChange={e => setSdsFile(e.target.files[0])} 
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
                      Upload SDS
                    </button>
                  </form>
                  {project.sdsUrl && (
                    <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded text-center">
                      <span className="text-green-400 text-sm">✅ Uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {project.srsUrl && project.sdsUrl && !project.srsSdsStatus && (
                <button 
                  onClick={() => submitForSrsSdsReview(project._id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  Submit for Review
                </button>
              )}

              {project.srsSdsStatus && (
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Review Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.srsSdsStatus === 'Approved' ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                      project.srsSdsStatus === 'Rejected' ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                      'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {project.srsSdsStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 4: Development (Weekly Logs) */}
          {project && (project.status === 'Development Phase' || (project.weeklyLogs && project.weeklyLogs.length > 0)) && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🛠️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Phase 4: Development</h2>
                    <p className="text-sm text-white/60">Supervisor meetings & progress tracking</p>
                  </div>
                </div>
                <span className="bg-emerald-900/30 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/30">
                  Active
                </span>
              </div>

              {/* Meeting Scheduler */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  Schedule Weekly Meeting
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Week Number</label>
                    <input 
                      type="number" 
                      min="1" max="16" 
                      value={meetingWeek} 
                      onChange={(e) => setMeetingWeek(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                      placeholder="Week"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Meeting Date</label>
                    <input 
                      type="date" 
                      value={meetingDate} 
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={requestMeeting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-all"
                    >
                      Request Meeting
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Display */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  Weekly Logs
                </h3>
                
                {project.weeklyLogs && project.weeklyLogs.length > 0 ? (
                  <div className="space-y-3">
                    {project.weeklyLogs.sort((a,b) => a.weekNumber - b.weekNumber).map((log, index) => (
                      <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                              Week {log.weekNumber}
                            </span>
                            <span className="text-sm text-white/60">
                              {new Date(log.meetingDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.meetingStatus === 'Accepted' ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                            log.meetingStatus === 'Pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-900/30 text-red-400 border border-red-500/30'
                          }`}>
                            {log.meetingStatus}
                          </span>
                        </div>
                        
                        {log.content ? (
                          <div className="bg-white/5 border border-white/10 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                                <span className="text-xs">👨‍🏫</span>
                              </div>
                              <span className="text-sm font-medium text-emerald-400">Supervisor Log</span>
                            </div>
                            <p className="text-sm text-white/80">{log.content}</p>
                          </div>
                        ) : (
                          <div className="text-center py-4 border border-white/10 rounded">
                            <span className="text-white/50 italic">Waiting for supervisor entry...</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-white/10 rounded-lg">
                    <div className="text-3xl mb-3">📭</div>
                    <p className="text-white/80">No meetings scheduled yet</p>
                    <p className="text-sm text-white/60 mt-1">Schedule your first meeting above</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 5: Final Defense */}
          {project && (project.status === 'Final Defense Scheduled' || project.status === 'Final Defense Pending' || project.status === 'Project Completed' || project.finalDefense?.scheduledDate) && (
            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 backdrop-blur-sm rounded-xl border border-red-500/30 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-900 to-red-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Phase 5: Final Defense</h2>
                  <p className="text-sm text-white/60">Weight: 65% • Comprehensive evaluation</p>
                </div>
              </div>

              {/* Defense Schedule */}
              <div className="mb-6 p-5 bg-white/5 border border-white/10 rounded-xl text-center">
                <div className="text-sm text-white/60 mb-2">Final Defense Date</div>
                <div className="text-2xl font-bold text-white mb-2">
                  {project.finalDefense?.scheduledDate ? new Date(project.finalDefense.scheduledDate).toDateString() : "To Be Announced"}
                </div>
                {project.finalDefense?.venue && (
                  <div className="text-sm text-white/80">Venue: {project.finalDefense.venue}</div>
                )}
              </div>

              {/* Final PPT Upload */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Final Presentation Upload
                </h3>
                <form onSubmit={(e) => handleUpload(e, 'final-ppt')} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      onChange={(e) => setFinalPptFile(e.target.files[0])} 
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/25"
                  >
                    Upload Final Presentation
                  </button>
                </form>
                {project.finalDefense?.finalPptUrl && (
                  <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                    <span className="text-green-400">✅ Final PPT Uploaded Successfully</span>
                  </div>
                )}
              </div>

              {/* Final Evaluation Breakdown */}
              {project.finalDefense?.marks && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    Final Evaluation Breakdown
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-sm text-white/60 mb-1">Coordinator</div>
                      <div className="text-2xl font-bold text-green-400">{project.finalDefense.marks.coordinator || '0'}<span className="text-sm text-white/60">/15</span></div>
                      <div className="text-xs text-white/60">15% weight</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-sm text-white/60 mb-1">Supervisor</div>
                      <div className="text-2xl font-bold text-green-400">{project.finalDefense.marks.supervisor || '0'}<span className="text-sm text-white/60">/15</span></div>
                      <div className="text-xs text-white/60">15% weight</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-sm text-white/60 mb-1">Panel</div>
                      <div className="text-2xl font-bold text-green-400">{project.finalDefense.marks.panel || '0'}<span className="text-sm text-white/60">/25</span></div>
                      <div className="text-xs text-white/60">25% weight</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-sm text-white/60 mb-1">External</div>
                      <div className="text-2xl font-bold text-green-400">{project.finalDefense.marks.external || '0'}<span className="text-sm text-white/60">/10</span></div>
                      <div className="text-xs text-white/60">10% weight</div>
                    </div>
                  </div>

                  {marksData.breakdown.finalDefense && (
                    <div className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80">Final Defense Total:</span>
                        <span className="text-xl font-bold text-white">{marksData.breakdown.finalDefense.weighted.total}%</span>
                      </div>
                      <div className="text-sm text-white/60">
                        Raw Score: {marksData.breakdown.finalDefense.rawTotal}/{marksData.breakdown.finalDefense.maxRawTotal}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {project.status === 'Project Completed' && (
                <div className="mt-6 p-5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl text-center animate-pulse">
                  <div className="text-2xl mb-2">🎉</div>
                  <h3 className="text-xl font-bold text-white">FYP Process Completed</h3>
                  <p className="text-white/90 mt-1">Congratulations on completing your Final Year Project!</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STATUS & MARKS */}
        <div className="space-y-6">
          
          {/* Project Status Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Project Status Overview
            </h2>

            {!project ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">📭</div>
                <p className="text-white/80">No project data available</p>
                <p className="text-sm text-white/60 mt-1">Submit a proposal to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Status */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-2">Current Status</div>
                  <div className="flex items-center justify-between">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      project.status.includes('Approved') ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                      project.status.includes('Rejected') ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                      project.status.includes('Pending') ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                      'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                    }`}>
                      {project.status}
                    </span>
                    <div className="text-2xl">⚡</div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Project Timeline</h3>
                  <div className="space-y-3">
                    <TimelineItem 
                      done={true} 
                      label="Project Submitted" 
                      date={project.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
                    />
                    <TimelineItem 
                      done={!['Pending Coordinator Review', 'Rejected'].includes(project.status)} 
                      label="Coordinator Review"
                      date={project.reviewedAt ? new Date(project.reviewedAt).toLocaleDateString() : ''}
                    />
                    <TimelineItem 
                      done={['Scheduled for Defense', 'Defense Cleared', 'Development Phase', 'Project Completed'].some(s => project.status === s || isPhase2Active(project.status))} 
                      label="Initial Defense"
                      date={project.defenseDate ? new Date(project.defenseDate).toLocaleDateString() : ''}
                    />
                    <TimelineItem 
                      done={project.srsSdsStatus === 'Approved' || project.status === 'Development Phase'} 
                      label="SRS/SDS Approved"
                    />
                    <TimelineItem 
                      done={project.status === 'Development Phase' || project.status === 'Project Completed' || project.finalDefense?.scheduledDate} 
                      label="Development Phase"
                    />
                    <TimelineItem 
                      done={project.status === 'Project Completed'} 
                      label="Final Defense Cleared"
                      date={project.finalDefense?.completedAt ? new Date(project.finalDefense.completedAt).toLocaleDateString() : ''}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grading Summary Card */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Grading Summary
            </h2>

            {marksData.total > 0 ? (
              <div className="space-y-6">
                {/* Overall Grade */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{marksData.total}%</div>
                  <div className="text-xl font-bold text-purple-300 mb-3">{marksData.letterGrade}</div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    marksData.isComplete ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                    'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                  }`}>
                    {marksData.isComplete ? '✅ Evaluation Complete' : '⏳ Evaluation In Progress'}
                  </div>
                </div>

                {/* Weight Distribution */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Weight Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-white/80">Proposal Defense</span>
                      </div>
                      <span className="font-medium text-purple-300">10%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-white/80">Initial Defense</span>
                      </div>
                      <span className="font-medium text-blue-300">10%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-white/80">SRS/SDS Documentation</span>
                      </div>
                      <span className="font-medium text-blue-300">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-white/80">Final Defense</span>
                      </div>
                      <span className="font-medium text-red-300">65%</span>
                    </div>
                  </div>
                </div>

                {/* Current Breakdown */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Current Breakdown</h3>
                  <div className="space-y-3">
                    {marksData.breakdown.proposal && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-purple-400">Proposal Defense</span>
                          <span className="text-sm text-green-400 font-medium">+{marksData.breakdown.proposal.weighted}%</span>
                        </div>
                        <div className="text-xs text-white/60">
                          Marks: {marksData.breakdown.proposal.marks}/{marksData.breakdown.proposal.maxMarks}
                        </div>
                      </div>
                    )}

                    {marksData.breakdown.initialDefense && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-blue-400">Initial Defense</span>
                          <span className="text-sm text-green-400 font-medium">+{marksData.breakdown.initialDefense.weighted}%</span>
                        </div>
                        <div className="text-xs text-white/60">
                          Average: {marksData.breakdown.initialDefense.average}/{marksData.breakdown.initialDefense.maxMarks}
                        </div>
                      </div>
                    )}

                    {marksData.breakdown.srsSds && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-blue-400">SRS/SDS Documentation</span>
                          <span className="text-sm text-green-400 font-medium">+{marksData.breakdown.srsSds.weighted}%</span>
                        </div>
                        <div className="text-xs text-white/60">
                          Average: {marksData.breakdown.srsSds.average}/{marksData.breakdown.srsSds.maxMarks}
                        </div>
                      </div>
                    )}

                    {marksData.breakdown.finalDefense && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-red-400">Final Defense</span>
                          <span className="text-sm text-green-400 font-medium">+{marksData.breakdown.finalDefense.weighted.total}%</span>
                        </div>
                        <div className="text-xs text-white/60">
                          Total: {marksData.breakdown.finalDefense.rawTotal}/{marksData.breakdown.finalDefense.maxRawTotal}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-white/80 mb-2">Marks will appear here as evaluation progresses</p>
                <p className="text-sm text-white/60">Complete each phase to see your marks</p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

// UI Component: Timeline Item
const TimelineItem = ({ done, label, date }) => (
  <div className="flex items-start gap-3">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/10 border border-white/20'}`}>
      {done ? (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <div className="w-2 h-2 bg-white/40 rounded-full"></div>
      )}
    </div>
    <div className="flex-1">
      <p className={`text-sm ${done ? 'text-white' : 'text-white/60'}`}>{label}</p>
      {date && <p className="text-xs text-white/40">{date}</p>}
    </div>
  </div>
);

export default StudentDashboard;