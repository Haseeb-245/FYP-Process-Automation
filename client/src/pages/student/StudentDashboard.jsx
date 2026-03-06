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
      const response = await fetch(`https://fyp-process-automation.vercel.app/api/projects/my-project/${studentId}`);
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
      const response = await fetch('https://fyp-process-automation.vercel.app/api/projects/upload-doc', { 
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
        const response = await fetch('https://fyp-process-automation.vercel.app/api/projects/request-meeting', {
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
      const response = await fetch(`https://fyp-process-automation.vercel.app/api/projects/submit-srs-sds-review/${projectId}`, {
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
    if (!status) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (status.includes('Approved') || status.includes('Cleared') || status.includes('Completed') || status.includes('Project Completed')) return 'bg-green-50 text-green-700 border-green-200';
    if (status.includes('Rejected')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  // --- MARKING SCHEME CALCULATION ---
  const calculateTotalMarks = () => {
    if (!project) return { total: 0, breakdown: {}, letterGrade: 'N/A' };

    const breakdown = {};
    let total = 0;

    // 1. Proposal Evaluation (10% weight)
    if (project.status === 'Approved - Waiting for Supervisor Consent' || 
        project.status === 'Approved - Ready for Defense' ||
        project.status === 'Scheduled for Defense') {
      
      const proposalMarks = 8;
      const proposalWeighted = (proposalMarks / 10) * 10;
      
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
      
      const initialDefenseAverage = (coordinatorMarks + supervisorMarks + panelMarks) / 3;
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
      
      const srsSdsAverage = (coordinatorMarks + supervisorMarks + panelMarks) / 3;
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
      
      const coordinatorMarks = finalMarks.coordinator || 0;
      const supervisorMarks = finalMarks.supervisor || 0;
      const panelMarks = finalMarks.panel || 0;
      const externalMarks = finalMarks.external || 0;
      
      const coordinatorWeighted = (coordinatorMarks / 15) * 15;
      const supervisorWeighted = (supervisorMarks / 15) * 15;
      const panelWeighted = (panelMarks / 25) * 25;
      const externalWeighted = (externalMarks / 10) * 10;
      
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

  if (!student) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="text-gray-600">Loading...</div></div>;
  
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-white to-[#F8FAFC] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF] mx-auto mb-4"></div>
        <p className="text-[#64748B]">Loading dashboard...</p>
      </div>
    </div>
  );

  const marksData = calculateTotalMarks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-white to-[#F8FAFC] font-['Arial',_'Helvetica',_sans-serif]">
      
      {/* Fully Responsive Navbar */}
      <header className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#1E40AF]"></div>
        
        <div className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              {/* Left: Logo and Info */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#3B82F6] blur-md opacity-50 rounded-md"></div>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-md flex items-center justify-center shadow-xl p-2">
                    <img 
                      src="/path/to/your/logo.png" 
                      alt="BU Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="text-[#0F172A] font-bold text-sm sm:text-lg">BU</div>';
                      }}
                    />
                  </div>
                </div>
                
                <div className="border-l-2 border-[#3B82F6]/30 pl-3 sm:pl-4">
                  <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">Student Dashboard</h1>
                  <p className="text-xs text-[#94A3B8] font-medium">{student.enrollment} • {student.name}</p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => refreshProjectStatus(student._id)}
                  className="relative group flex-1 sm:flex-initial"
                >
                  <div className="absolute inset-0 bg-[#1E40AF] blur-xl opacity-0 group-hover:opacity-30 rounded-md transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] px-3 sm:px-4 py-2 rounded-md shadow-md border border-[#3B82F6]/50 hover:shadow-lg transition-all">
                    <span className="flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Refresh</span>
                    </span>
                  </div>
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-md flex-1 sm:flex-initial"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-1 bg-gradient-to-b from-black/10 to-transparent"></div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* LEFT + MIDDLE COLUMNS: WORKFLOW (2 columns wide on desktop) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Phase 1: Proposal */}
          {!project || !isPhase1Complete(project.status) ? (
            <div className="bg-white border-2 border-[#CBD5E1] rounded-md shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] rounded-md flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] break-words">Phase 1: Proposal Submission</h2>
                  <p className="text-xs sm:text-sm text-[#64748B]">Weight: 10% • First step in FYP process</p>
                </div>
              </div>

              {project?.status === 'Approved - Waiting for Supervisor Consent' && (
                <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-[#EFF6FF] border-2 border-[#DBEAFE] rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="text-[#3B82F6] text-lg sm:text-xl flex-shrink-0">ℹ️</div>
                    <div className="min-w-0">
                      <p className="text-[#1E40AF] font-semibold text-sm sm:text-base">Coordinator Accepted</p>
                      <p className="text-xs sm:text-sm text-[#475569]">Waiting for Supervisor to sign the consent form</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => handleUpload(e, 'proposal')} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0F172A] mb-2">Proposed Supervisor (Optional)</label>
                  <input 
                    type="text" 
                    value={proposedSupervisor} 
                    onChange={(e) => setProposedSupervisor(e.target.value)} 
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-md text-sm sm:text-base text-[#0F172A] placeholder-[#94A3B8] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 focus:outline-none transition-all"
                    placeholder="Enter supervisor name..."
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0F172A] mb-2">Proposal Document</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-md text-sm text-[#0F172A] file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-[#1E40AF] file:text-white hover:file:bg-[#1E3A8A] cursor-pointer transition-all"
                  />
                  <p className="text-xs text-[#64748B] mt-2">Supported formats: PDF, DOC, DOCX</p>
                </div>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white font-bold py-2.5 sm:py-3.5 rounded-md transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-md p-4 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-md flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-green-700 text-base sm:text-lg">Phase 1 Completed</h3>
                    <p className="text-xs sm:text-sm text-green-600">Proposal Evaluation • 10% weight</p>
                  </div>
                </div>
                {marksData.breakdown.proposal && (
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">{marksData.breakdown.proposal.weighted}%</div>
                    <div className="text-xs sm:text-sm text-green-600">{marksData.breakdown.proposal.marks}/{marksData.breakdown.proposal.maxMarks} marks</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 2: Initial Defense */}
          {project && isPhase2Active(project.status) && (
            <div className="bg-white border-2 border-[#CBD5E1] rounded-md shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-md flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] break-words">Phase 2: Initial Defense</h2>
                  <p className="text-xs sm:text-sm text-[#64748B]">Weight: 10% • Presentation evaluation</p>
                </div>
              </div>

              {project.defenseDate ? (
                <>
                  <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-purple-50 border-2 border-purple-200 rounded-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                      <div>
                        <p className="text-xs sm:text-sm text-purple-600 font-semibold">Scheduled Defense</p>
                        <p className="text-base sm:text-lg font-bold text-purple-900">{new Date(project.defenseDate).toDateString()}</p>
                        <p className="text-xs sm:text-sm text-purple-700">Room: {project.defenseRoom}</p>
                      </div>
                      <div className="text-3xl sm:text-4xl">⚖️</div>
                    </div>
                  </div>

                  <form onSubmit={(e) => handleUpload(e, 'ppt')} className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#0F172A] mb-2">Presentation File (PPT)</label>
                      <input 
                        type="file" 
                        accept=".ppt,.pptx,.pdf" 
                        onChange={(e) => setPptFile(e.target.files[0])} 
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-md text-sm text-[#0F172A] file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                      />
                      <p className="text-xs text-[#64748B] mt-2">Upload your defense presentation</p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2.5 sm:py-3.5 rounded-md transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      Submit Presentation
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 sm:py-8 bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md">
                  <div className="text-3xl sm:text-4xl mb-3">⏳</div>
                  <p className="text-[#0F172A] font-medium text-sm sm:text-base">Waiting for Coordinator to schedule defense...</p>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2">You'll be notified when a date is assigned</p>
                </div>
              )}
            </div>
          )}

          {/* Phase 3: SRS/SDS */}
          {project && (project.status === 'Defense Cleared' || project.srsSdsStatus) && (
            <div className="bg-white border-2 border-[#CBD5E1] rounded-md shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] rounded-md flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] break-words">Phase 3: SRS/SDS Documentation</h2>
                  <p className="text-xs sm:text-sm text-[#64748B]">Weight: 15% • System documentation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                {/* SRS Upload */}
                <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#1E40AF] rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-base sm:text-lg">📄</span>
                    </div>
                    <h3 className="font-semibold text-[#0F172A] text-xs sm:text-sm break-words">Software Requirements Specification</h3>
                  </div>
                  <form onSubmit={(e) => handleUpload(e, 'srs')} className="space-y-3">
                    <input 
                      type="file" 
                      onChange={e => setSrsFile(e.target.files[0])} 
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border-2 border-[#CBD5E1] rounded-md text-[#0F172A] text-xs sm:text-sm"
                    />
                    <button className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-md">
                      Upload SRS
                    </button>
                  </form>
                  {project.srsUrl && (
                    <div className="mt-3 p-2 bg-green-50 border-2 border-green-200 rounded-md text-center">
                      <span className="text-green-700 text-xs sm:text-sm font-semibold">✅ Uploaded</span>
                    </div>
                  )}
                </div>

                {/* SDS Upload */}
                <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#1E40AF] rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-base sm:text-lg">📄</span>
                    </div>
                    <h3 className="font-semibold text-[#0F172A] text-xs sm:text-sm break-words">Software Design Specification</h3>
                  </div>
                  <form onSubmit={(e) => handleUpload(e, 'sds')} className="space-y-3">
                    <input 
                      type="file" 
                      onChange={e => setSdsFile(e.target.files[0])} 
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border-2 border-[#CBD5E1] rounded-md text-[#0F172A] text-xs sm:text-sm"
                    />
                    <button className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-md">
                      Upload SDS
                    </button>
                  </form>
                  {project.sdsUrl && (
                    <div className="mt-3 p-2 bg-green-50 border-2 border-green-200 rounded-md text-center">
                      <span className="text-green-700 text-xs sm:text-sm font-semibold">✅ Uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {project.srsUrl && project.sdsUrl && !project.srsSdsStatus && (
                <button 
                  onClick={() => submitForSrsSdsReview(project._id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2.5 sm:py-3.5 rounded-md transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>🚀</span>
                  Submit for Review
                </button>
              )}

              {project.srsSdsStatus && (
                <div className="mt-4 p-3 sm:p-4 bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <span className="text-[#475569] font-medium text-xs sm:text-sm">Review Status:</span>
                    <span className={`px-3 py-1.5 rounded-md text-xs font-semibold border-2 ${
                      project.srsSdsStatus === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      project.srsSdsStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {project.srsSdsStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 4: Development */}
          {project && (project.status === 'Development Phase' || (project.weeklyLogs && project.weeklyLogs.length > 0)) && (
            <div className="bg-white border-2 border-[#CBD5E1] rounded-md shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-md flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] break-words">Phase 4: Development</h2>
                    <p className="text-xs sm:text-sm text-[#64748B]">Supervisor meetings & progress tracking</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-md border-2 border-emerald-200">
                  Active
                </span>
              </div>

              {/* Meeting Scheduler */}
              <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-4 sm:p-5 mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-lg sm:text-xl">📅</span>
                  Schedule Weekly Meeting
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#0F172A] mb-2">Week Number</label>
                    <input 
                      type="number" 
                      min="1" max="16" 
                      value={meetingWeek} 
                      onChange={(e) => setMeetingWeek(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-[#CBD5E1] rounded-md text-sm sm:text-base text-[#0F172A] placeholder-[#94A3B8] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 focus:outline-none"
                      placeholder="Week"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#0F172A] mb-2">Meeting Date</label>
                    <input 
                      type="date" 
                      value={meetingDate} 
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-[#CBD5E1] rounded-md text-sm sm:text-base text-[#0F172A] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={requestMeeting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-2 sm:py-2.5 rounded-md transition-all shadow-md text-sm sm:text-base"
                    >
                      Request Meeting
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Display */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                  <span className="text-lg sm:text-xl">📋</span>
                  Weekly Logs
                </h3>
                
                {project.weeklyLogs && project.weeklyLogs.length > 0 ? (
                  <div className="space-y-3">
                    {project.weeklyLogs.sort((a,b) => a.weekNumber - b.weekNumber).map((log, index) => (
                      <div key={index} className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-[#1E40AF] text-white px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold">
                              Week {log.weekNumber}
                            </span>
                            <span className="text-xs sm:text-sm text-[#64748B] font-medium">
                              {new Date(log.meetingDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold border-2 ${
                            log.meetingStatus === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                            log.meetingStatus === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {log.meetingStatus}
                          </span>
                        </div>
                        
                        {log.content ? (
                          <div className="bg-white border-2 border-[#E5E7EB] rounded-md p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs">👨‍🏫</span>
                              </div>
                              <span className="text-xs sm:text-sm font-semibold text-emerald-700">Supervisor Log</span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#475569] break-words">{log.content}</p>
                          </div>
                        ) : (
                          <div className="text-center py-3 sm:py-4 border-2 border-[#E5E7EB] rounded-md bg-white">
                            <span className="text-[#94A3B8] italic text-xs sm:text-sm">Waiting for supervisor entry...</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 border-2 border-[#E5E7EB] rounded-md bg-[#F8FAFC]">
                    <div className="text-3xl sm:text-4xl mb-3">📭</div>
                    <p className="text-[#0F172A] font-medium text-sm sm:text-base">No meetings scheduled yet</p>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">Schedule your first meeting above</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 5: Final Defense */}
          {project && (project.status === 'Final Defense Scheduled' || project.status === 'Final Defense Pending' || project.status === 'Project Completed' || project.finalDefense?.scheduledDate) && (
            <div className="bg-white border-2 border-[#CBD5E1] rounded-md shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-md flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] break-words">Phase 5: Final Defense</h2>
                  <p className="text-xs sm:text-sm text-[#64748B]">Weight: 65% • Comprehensive evaluation</p>
                </div>
              </div>

              {/* Defense Schedule */}
              <div className="mb-4 sm:mb-5 p-4 sm:p-5 bg-red-50 border-2 border-red-200 rounded-md text-center">
                <div className="text-xs sm:text-sm text-red-600 font-semibold mb-2">Final Defense Date</div>
                <div className="text-xl sm:text-2xl font-bold text-red-900 mb-2 break-words">
                  {project.finalDefense?.scheduledDate ? new Date(project.finalDefense.scheduledDate).toDateString() : "To Be Announced"}
                </div>
                {project.finalDefense?.venue && (
                  <div className="text-xs sm:text-sm text-red-700 font-medium">Venue: {project.finalDefense.venue}</div>
                )}
              </div>

              {/* Final PPT Upload */}
              <div className="mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-lg sm:text-xl">📊</span>
                  Final Presentation Upload
                </h3>
                <form onSubmit={(e) => handleUpload(e, 'final-ppt')} className="space-y-4">
                  <input 
                    type="file" 
                    onChange={(e) => setFinalPptFile(e.target.files[0])} 
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-md text-sm text-[#0F172A] file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                  />
                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2.5 sm:py-3.5 rounded-md transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    Upload Final Presentation
                  </button>
                </form>
                {project.finalDefense?.finalPptUrl && (
                  <div className="mt-3 p-2 sm:p-3 bg-green-50 border-2 border-green-200 rounded-md text-center">
                    <span className="text-green-700 font-semibold text-xs sm:text-sm">✅ Final PPT Uploaded Successfully</span>
                  </div>
                )}
              </div>

              {/* Final Evaluation Breakdown */}
              {project.finalDefense?.marks && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                    <span className="text-lg sm:text-xl">🏆</span>
                    Final Evaluation Breakdown
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-[#64748B] font-medium mb-1">Coordinator</div>
                      <div className="text-xl sm:text-2xl font-bold text-[#1E40AF]">{project.finalDefense.marks.coordinator || '0'}<span className="text-xs sm:text-sm text-[#64748B]">/15</span></div>
                      <div className="text-xs text-[#64748B]">15% weight</div>
                    </div>
                    <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-[#64748B] font-medium mb-1">Supervisor</div>
                      <div className="text-xl sm:text-2xl font-bold text-[#1E40AF]">{project.finalDefense.marks.supervisor || '0'}<span className="text-xs sm:text-sm text-[#64748B]">/15</span></div>
                      <div className="text-xs text-[#64748B]">15% weight</div>
                    </div>
                    <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-[#64748B] font-medium mb-1">Panel</div>
                      <div className="text-xl sm:text-2xl font-bold text-[#1E40AF]">{project.finalDefense.marks.panel || '0'}<span className="text-xs sm:text-sm text-[#64748B]">/25</span></div>
                      <div className="text-xs text-[#64748B]">25% weight</div>
                    </div>
                    <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-[#64748B] font-medium mb-1">External</div>
                      <div className="text-xl sm:text-2xl font-bold text-[#1E40AF]">{project.finalDefense.marks.external || '0'}<span className="text-xs sm:text-sm text-[#64748B]">/10</span></div>
                      <div className="text-xs text-[#64748B]">10% weight</div>
                    </div>
                  </div>

                  {marksData.breakdown.finalDefense && (
                    <div className="bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-2 border-[#BFDBFE] rounded-md p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                        <span className="text-[#0F172A] font-medium text-sm sm:text-base">Final Defense Total:</span>
                        <span className="text-lg sm:text-xl font-bold text-[#1E40AF]">{marksData.breakdown.finalDefense.weighted.total}%</span>
                      </div>
                      <div className="text-xs sm:text-sm text-[#475569]">
                        Raw Score: {marksData.breakdown.finalDefense.rawTotal}/{marksData.breakdown.finalDefense.maxRawTotal}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {project.status === 'Project Completed' && (
                <div className="mt-5 sm:mt-6 p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-md text-center shadow-lg">
                  <div className="text-2xl sm:text-3xl mb-2">🎉</div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">FYP Process Completed</h3>
                  <p className="text-white/90 mt-1 text-sm sm:text-base">Congratulations on completing your Final Year Project!</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STATUS & MARKS (sticky on desktop only) */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Project Status Card */}
          <div className="bg-white border-2 border-[#CBD5E1] rounded-md shadow-md p-4 sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-4 sm:mb-5 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">📊</span>
              Project Status
            </h2>

            {!project ? (
              <div className="text-center py-6 sm:py-8 bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md">
                <div className="text-3xl sm:text-4xl mb-3">📭</div>
                <p className="text-[#0F172A] font-medium text-sm sm:text-base">No project data</p>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">Submit a proposal to start</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {/* Current Status */}
                <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-md p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-[#64748B] font-medium mb-2">Current Status</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold border-2 break-words ${
                      project.status.includes('Approved') ? 'bg-green-50 text-green-700 border-green-200' :
                      project.status.includes('Rejected') ? 'bg-red-50 text-red-700 border-red-200' :
                      project.status.includes('Pending') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {project.status}
                    </span>
                    <div className="text-xl sm:text-2xl flex-shrink-0">⚡</div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] mb-3 sm:mb-4">Timeline</h3>
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
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-md shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-4 sm:mb-5 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🏆</span>
              Grading Summary
            </h2>

            {marksData.total > 0 ? (
              <div className="space-y-4 sm:space-y-5">
                {/* Overall Grade */}
                <div className="text-center bg-white border-2 border-purple-200 rounded-md p-4 sm:p-5">
                  <div className="text-4xl sm:text-5xl font-bold text-[#1E40AF] mb-2">{marksData.total}%</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-3">{marksData.letterGrade}</div>
                  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold border-2 ${
                    marksData.isComplete ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {marksData.isComplete ? '✅ Evaluation Complete' : '⏳ Evaluation In Progress'}
                  </div>
                </div>

                {/* Weight Distribution */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] mb-2 sm:mb-3">Weight Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-[#475569]">Proposal Defense</span>
                      </div>
                      <span className="font-semibold text-purple-600 text-xs sm:text-sm">10%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-[#475569]">Initial Defense</span>
                      </div>
                      <span className="font-semibold text-blue-600 text-xs sm:text-sm">10%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-[#475569]">SRS/SDS Documentation</span>
                      </div>
                      <span className="font-semibold text-blue-600 text-xs sm:text-sm">15%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-[#475569]">Final Defense</span>
                      </div>
                      <span className="font-semibold text-red-600 text-xs sm:text-sm">65%</span>
                    </div>
                  </div>
                </div>

                {/* Current Breakdown */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] mb-2 sm:mb-3">Current Breakdown</h3>
                  <div className="space-y-2">
                    {marksData.breakdown.proposal && (
                      <div className="bg-white border-2 border-[#E5E7EB] rounded-md p-2.5 sm:p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs sm:text-sm text-purple-600 font-medium">Proposal Defense</span>
                          <span className="text-xs sm:text-sm text-green-600 font-bold">+{marksData.breakdown.proposal.weighted}%</span>
                        </div>
                        <div className="text-xs text-[#64748B]">
                          Marks: {marksData.breakdown.proposal.marks}/{marksData.breakdown.proposal.maxMarks}
                        </div>
                      </div>
                    )}

                    {marksData.breakdown.initialDefense && (
                      <div className="bg-white border-2 border-[#E5E7EB] rounded-md p-2.5 sm:p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs sm:text-sm text-blue-600 font-medium">Initial Defense</span>
                          <span className="text-xs sm:text-sm text-green-600 font-bold">+{marksData.breakdown.initialDefense.weighted}%</span>
                        </div>
                        <div className="text-xs text-[#64748B]">
                          Average: {marksData.breakdown.initialDefense.average}/{marksData.breakdown.initialDefense.maxMarks}
                        </div>
                      </div>
                    )}

                    {marksData.breakdown.srsSds && (
                      <div className="bg-white border-2 border-[#E5E7EB] rounded-md p-2.5 sm:p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs sm:text-sm text-blue-600 font-medium">SRS/SDS Documentation</span>
                          <span className="text-xs sm:text-sm text-green-600 font-bold">+{marksData.breakdown.srsSds.weighted}%</span>
                        </div>
                        <div className="text-xs text-[#64748B]">
                          Average: {marksData.breakdown.srsSds.average}/{marksData.breakdown.srsSds.maxMarks}
                        </div>
                      </div>
                    )}

                    {marksData.breakdown.finalDefense && (
                      <div className="bg-white border-2 border-[#E5E7EB] rounded-md p-2.5 sm:p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs sm:text-sm text-red-600 font-medium">Final Defense</span>
                          <span className="text-xs sm:text-sm text-green-600 font-bold">+{marksData.breakdown.finalDefense.weighted.total}%</span>
                        </div>
                        <div className="text-xs text-[#64748B]">
                          Total: {marksData.breakdown.finalDefense.rawTotal}/{marksData.breakdown.finalDefense.maxRawTotal}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 bg-white border-2 border-[#E5E7EB] rounded-md">
                <div className="text-3xl sm:text-4xl mb-3">📊</div>
                <p className="text-[#0F172A] font-medium mb-2 text-sm sm:text-base">Marks will appear as you progress</p>
                <p className="text-xs sm:text-sm text-[#64748B]">Complete each phase to see your marks</p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

// Timeline Item Component
const TimelineItem = ({ done, label, date }) => (
  <div className="flex items-start gap-2 sm:gap-3">
    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
      done ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'
    }`}>
      {done ? (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full"></div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs sm:text-sm font-medium break-words ${done ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{label}</p>
      {date && <p className="text-xs text-[#64748B]">{date}</p>}
    </div>
  </div>
);

export default StudentDashboard;