import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [supervisor, setSupervisor] = useState(null);
  const [pendingConsents, setPendingConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Consent Form State
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Evaluation States
  const [initialDefenseProjects, setInitialDefenseProjects] = useState([]);
  const [srsSdsReviewProjects, setSrsSdsReviewProjects] = useState([]);
  
  // Phase 4 & 5 States
  const [developmentProjects, setDevelopmentProjects] = useState([]);
  const [finalDefenseProjects, setFinalDefenseProjects] = useState([]);
  
  // Log Writing State
  const [logContent, setLogContent] = useState('');
  const [activeLogId, setActiveLogId] = useState(null);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    if (!userInfo || userInfo.role !== 'supervisor') {
      navigate('/');
      alert('Please login as Supervisor first');
      return;
    }
    
    setSupervisor(userInfo);
    setSignatureName(userInfo.name);
    fetchAllData(userInfo._id);
  }, [navigate]);

  const fetchAllData = async (supervisorId) => {
    try {
      setLoading(true);
      
      const [
        consentsRes,
        initialDefenseRes,
        srsSdsRes
      ] = await Promise.all([
        fetch(`https://fyp-process-automation.vercel.app/api/projects/supervisor-pending/${supervisorId}`),
        fetch(`https://fyp-process-automation.vercel.app/api/projects/supervisor-initial-defense/${supervisorId}`),
        fetch(`https://fyp-process-automation.vercel.app/api/projects/supervisor-srs-sds-review/${supervisorId}`)
      ]);

      if (consentsRes.ok) setPendingConsents(await consentsRes.json());
      if (initialDefenseRes.ok) setInitialDefenseProjects(await initialDefenseRes.json());

      if (srsSdsRes.ok) {
          const data = await srsSdsRes.json();
          setSrsSdsReviewProjects(data.filter(p => p.srsSdsStatus === 'Pending Review' || p.srsSdsStatus === 'Under Review' || p.status === 'Ready for SRS/SDS Review'));
          setDevelopmentProjects(data.filter(p => p.status === 'Development Phase'));
          setFinalDefenseProjects(data.filter(p => p.status.includes('Final Defense') || p.status === 'Project Completed'));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '#';
    const cleanPath = path.replace(/\\/g, '/');
    return `https://fyp-process-automation.vercel.app/${cleanPath}`;
  };

  // --- ACTIONS ---
  const handleDecision = async (projectId, decision) => {
    if (decision === 'Approved') {
      if (!signatureName.trim()) return alert('Please enter your signature name');
      if (!agreedToTerms) return alert('Please agree to the supervision commitment terms');
    }

    try {
      setProcessing(true);
      const response = await fetch(`https://fyp-process-automation.vercel.app/api/projects/supervisor-decision/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          decision: decision,
          feedback: feedback || undefined,
          signature: decision === 'Approved' ? signatureName : undefined
        }),
      });

      if (response.ok) {
        alert(decision === 'Approved' ? '✅ Consent Signed!' : '❌ Project Rejected');
        setSelectedProject(null);
        setFeedback('');
        setAgreedToTerms(false);
        fetchAllData(supervisor._id);
      } else {
        alert('Failed to process decision');
      }
    } catch (error) {
      console.error(error);
      alert('Server error');
    } finally {
      setProcessing(false);
    }
  };

  const handleInitialDefenseEvaluation = async (projectId) => {
    const marksInput = document.getElementById(`marks-${projectId}`)?.value;
    const feedbackInput = document.getElementById(`feedback-${projectId}`)?.value || '';
    
    if (!marksInput || marksInput < 0 || marksInput > 5) return alert('Enter valid marks (0-5)');

    try {
      setProcessing(true);
      const response = await fetch(`https://fyp-process-automation.vercel.app/api/projects/submit-initial-defense-marks/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'supervisor', marks: parseFloat(marksInput), feedback: feedbackInput })
      });

      if (response.ok) {
        alert('✅ Marks submitted successfully!');
        fetchAllData(supervisor._id);
      } else {
        alert('Failed to submit marks');
      }
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  const handleAcceptMeeting = async (projectId, weekNumber) => {
      try {
          const res = await fetch(`https://fyp-process-automation.vercel.app/api/projects/accept-meeting/${projectId}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ weekNumber })
          });
          if(res.ok) {
              alert("Meeting Accepted! ✅");
              fetchAllData(supervisor._id);
          }
      } catch (error) { console.error(error); }
  };

  const handleWriteLog = async (projectId, weekNumber) => {
      if(!logContent.trim()) return alert("Please write log content");
      try {
          const res = await fetch(`https://fyp-process-automation.vercel.app/api/projects/write-weekly-log/${projectId}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ weekNumber, content: logContent })
          });
          if(res.ok) {
              alert("Log Saved! ✅");
              setActiveLogId(null);
              setLogContent("");
              fetchAllData(supervisor._id);
          }
      } catch (error) { console.error(error); }
  };

  const handleSubmitFinalMark = async (projectId) => {
      const mark = document.getElementById(`final-mark-${projectId}`).value;
      if(!mark || mark < 0 || mark > 30) return alert("Please enter valid marks (0-30)");
      
      try {
          const res = await fetch(`https://fyp-process-automation.vercel.app/api/projects/submit-final-marks/${projectId}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ role: 'supervisor', marks: mark })
          });
          if(res.ok) {
              alert("Final Grade Submitted! 🏆");
              fetchAllData(supervisor._id);
          }
      } catch (error) { console.error(error); }
  };

  const handleSrsSdsDecision = async (projectId, decision) => {
    const feedbackInput = document.getElementById(`feedback-${projectId}`)?.value || '';
    if (decision !== 'Approved' && !feedbackInput.trim()) return alert('Please provide feedback');
    try {
      setProcessing(true);
      await fetch(`https://fyp-process-automation.vercel.app/api/projects/supervisor-srs-sds-decision/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback: feedbackInput })
      });
      alert(`✅ SRS/SDS ${decision}`);
      fetchAllData(supervisor._id);
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  const handleSrsSdsEvaluation = async (projectId) => {
    const marksInput = document.getElementById(`srs-sds-marks-${projectId}`)?.value;
    const feedbackInput = document.getElementById(`srs-sds-feedback-${projectId}`)?.value || '';
    if (!marksInput || marksInput < 0 || marksInput > 5) return alert('Enter valid marks (0-5)');

    try {
      setProcessing(true);
      await fetch(`https://fyp-process-automation.vercel.app/api/projects/submit-srs-sds-marks/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'supervisor', marks: parseFloat(marksInput), feedback: feedbackInput })
      });
      alert('✅ Evaluation Submitted!');
      fetchAllData(supervisor._id);
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  if (!supervisor) return <div className="text-white p-10">Loading...</div>;
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2342] via-[#1a365d] to-[#0a2342] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white/70">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2342] via-[#1a365d] to-[#0a2342] text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
              <div className="text-center">
                <div className="text-[9px] font-bold text-[#0a2342] leading-tight">BU</div>
                <div className="text-[7px] font-bold text-[#0a2342] leading-tight">SUP</div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Supervisor Dashboard</h1>
              <p className="text-sm text-white/70">Welcome, {supervisor.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchAllData(supervisor._id)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <SummaryCard 
            title="Pending Consents"
            count={pendingConsents.length}
            color="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20"
            borderColor="border-yellow-500/30"
            icon="📝"
          />
          <SummaryCard 
            title="Initial Defense"
            count={initialDefenseProjects.length}
            color="bg-gradient-to-br from-green-900/30 to-green-800/20"
            borderColor="border-green-500/30"
            icon="🎤"
          />
          <SummaryCard 
            title="Development Phase"
            count={developmentProjects.length}
            color="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20"
            borderColor="border-emerald-500/30"
            icon="🛠️"
          />
          <SummaryCard 
            title="Final Defense"
            count={finalDefenseProjects.length}
            color="bg-gradient-to-br from-red-900/30 to-red-800/20"
            borderColor="border-red-500/30"
            icon="🎓"
          />
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {/* 1. PENDING CONSENTS */}
          {pendingConsents.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Pending Consents</h2>
                  <p className="text-sm text-white/60">Review and approve project proposals</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingConsents.map(project => (
                  <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-yellow-500/30 transition-all hover:shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1">{project.leaderId?.name}</h3>
                        <p className="text-sm text-white/60">{project.leaderId?.enrollment}</p>
                        <p className="text-xs text-white/40 mt-2">Project Title:</p>
                        <p className="text-sm text-white/80 truncate">{project.projectTitle || 'No title provided'}</p>
                      </div>
                      <span className="bg-yellow-900/30 text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30">
                        Pending
                      </span>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button 
                        onClick={() => setSelectedProject(project)}
                        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-yellow-500/25 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Review Proposal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. INITIAL DEFENSE EVALUATIONS */}
          {initialDefenseProjects.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-900 to-green-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎤</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Initial Defense Evaluations</h2>
                  <p className="text-sm text-white/60">Evaluate student presentations (5 marks)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {initialDefenseProjects.map((project) => (
                  <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-green-500/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{project.leaderId?.name}</h3>
                        <p className="text-sm text-white/60 mb-3">{project.leaderId?.enrollment}</p>
                        <p className="text-sm text-white/80">{project.projectTitle}</p>
                      </div>
                      {project.initialDefenseMarks?.supervisor !== null && project.initialDefenseMarks?.supervisor !== undefined ? (
                        <span className="bg-green-900/30 text-green-400 text-sm px-3 py-1 rounded-full border border-green-500/30">
                          ✅ Evaluated
                        </span>
                      ) : (
                        <span className="bg-yellow-900/30 text-yellow-400 text-sm px-3 py-1 rounded-full border border-yellow-500/30">
                          Pending
                        </span>
                      )}
                    </div>

                    {project.presentationUrl ? (
                      <a
                        href={getFileUrl(project.presentationUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Presentation
                      </a>
                    ) : (
                      <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                        <p className="text-white/60">No presentation uploaded</p>
                      </div>
                    )}
                    
                    {project.initialDefenseMarks?.supervisor !== null && project.initialDefenseMarks?.supervisor !== undefined ? (
                      <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30 text-center">
                        <p className="text-green-300 font-bold text-lg">Marks Awarded</p>
                        <p className="text-white text-3xl font-bold mt-1">{project.initialDefenseMarks.supervisor}/5</p>
                        <p className="text-green-400/80 text-sm mt-2">✅ Evaluation Complete</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Marks (0-5)</label>
                          <input 
                            type="number" 
                            id={`marks-${project._id}`} 
                            min="0" max="5" step="0.5" 
                            placeholder="Enter marks"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Feedback (Optional)</label>
                          <textarea 
                            id={`feedback-${project._id}`} 
                            placeholder="Provide feedback..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            rows="2"
                          ></textarea>
                        </div>
                        <button 
                          onClick={() => handleInitialDefenseEvaluation(project._id)} 
                          disabled={processing}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {processing ? (
                            <>
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            'Submit Evaluation'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. SRS/SDS REVIEW */}
          {srsSdsReviewProjects.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">SRS/SDS Documentation Review</h2>
                  <p className="text-sm text-white/60">Review technical documentation (5 marks)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {srsSdsReviewProjects.map(project => (
                  <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-blue-500/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1">{project.leaderId?.name}</h3>
                        <p className="text-sm text-white/60">{project.leaderId?.enrollment}</p>
                        <p className="text-sm text-white/80 mt-2">{project.projectTitle}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full border ${
                        project.srsSdsStatus === 'Under Review' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' :
                        project.srsSdsStatus === 'Pending Review' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' :
                        'bg-blue-900/30 text-blue-400 border-blue-500/30'
                      }`}>
                        {project.srsSdsStatus || 'Ready for Review'}
                      </span>
                    </div>

                    {/* Document Links */}
                    <div className="flex gap-4 mb-6">
                      {project.srsUrl && (
                        <a 
                          href={getFileUrl(project.srsUrl)} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View SRS
                        </a>
                      )}
                      {project.sdsUrl && (
                        <a 
                          href={getFileUrl(project.sdsUrl)} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View SDS
                        </a>
                      )}
                    </div>
                    
                    {project.srsSdsStatus === 'Under Review' ? (
                      project.srsSdsReviewMarks?.supervisor ? (
                        <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30 text-center">
                          <p className="text-green-300 font-bold text-lg">Already Evaluated</p>
                          <p className="text-white text-2xl font-bold mt-1">{project.srsSdsReviewMarks.supervisor}/5</p>
                          <p className="text-green-400/80 text-sm mt-2">✅ Evaluation Complete</p>
                        </div>
                      ) : (
                        <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
                          <p className="text-sm font-bold text-blue-400">Evaluate Documents (5 marks)</p>
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Marks (0-5)</label>
                            <input 
                              type="number" 
                              id={`srs-sds-marks-${project._id}`} 
                              placeholder="Enter marks (0-5)"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Feedback</label>
                            <textarea 
                              id={`srs-sds-feedback-${project._id}`} 
                              placeholder="Provide feedback..."
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                              rows="2"
                            ></textarea>
                          </div>
                          <button 
                            onClick={() => handleSrsSdsEvaluation(project._id)}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25"
                          >
                            Submit Evaluation
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Review Feedback</label>
                          <textarea 
                            id={`feedback-${project._id}`} 
                            placeholder="Provide detailed feedback..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                            rows="3"
                          ></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleSrsSdsDecision(project._id, 'Approved')}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/25"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleSrsSdsDecision(project._id, 'Changes Required')}
                            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-yellow-500/25"
                          >
                            Request Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. DEVELOPMENT PHASE */}
          {developmentProjects.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🛠️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Development Phase Supervision</h2>
                  <p className="text-sm text-white/60">Manage weekly meetings and progress logs</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {developmentProjects.map(project => (
                  <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-xl text-white mb-1">{project.leaderId?.name}</h3>
                        <p className="text-sm text-white/60">{project.leaderId?.enrollment}</p>
                        <p className="text-sm text-white/80 mt-2">{project.projectTitle}</p>
                      </div>
                      <span className="bg-emerald-900/30 text-emerald-400 text-sm px-3 py-1 rounded-full border border-emerald-500/30">
                        Active Development
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Weekly Meetings
                      </h4>
                      
                      {project.weeklyLogs && project.weeklyLogs.length > 0 ? (
                        <div className="space-y-3">
                          {project.weeklyLogs.sort((a,b) => a.weekNumber - b.weekNumber).map(log => (
                            <div key={log.weekNumber} className="bg-white/5 border border-white/10 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                                    Week {log.weekNumber}
                                  </span>
                                  <span className="text-sm text-white/60">
                                    {new Date(log.meetingDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  log.meetingStatus === 'Accepted' ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                                  log.meetingStatus === 'Pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                                  'bg-red-900/30 text-red-400 border border-red-500/30'
                                }`}>
                                  {log.meetingStatus}
                                </span>
                              </div>
                              
                              {log.content ? (
                                <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs">📝</span>
                                    </div>
                                    <span className="text-sm font-medium text-emerald-400">Supervisor Log</span>
                                  </div>
                                  <p className="text-sm text-white/80">{log.content}</p>
                                </div>
                              ) : (
                                <p className="text-white/50 italic text-sm">No log entry yet</p>
                              )}
                              
                              <div className="mt-3 flex justify-end gap-2">
                                {log.meetingStatus === 'Pending' && (
                                  <button 
                                    onClick={() => handleAcceptMeeting(project._id, log.weekNumber)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded transition-all"
                                  >
                                    Accept Meeting
                                  </button>
                                )}
                                {log.meetingStatus === 'Accepted' && !log.content && activeLogId?.weekNumber !== log.weekNumber && (
                                  <button 
                                    onClick={() => setActiveLogId({ projectId: project._id, weekNumber: log.weekNumber })}
                                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-medium rounded transition-all"
                                  >
                                    Write Log
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-white/10 rounded-lg">
                          <p className="text-white/80">No meetings scheduled yet</p>
                          <p className="text-sm text-white/60 mt-1">Student will schedule weekly meetings</p>
                        </div>
                      )}
                      
                      {/* Log Writing Section */}
                      {activeLogId && activeLogId.projectId === project._id && (
                        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                          <h4 className="text-lg font-medium text-white mb-3">Write Log for Week {activeLogId.weekNumber}</h4>
                          <textarea 
                            value={logContent} 
                            onChange={(e) => setLogContent(e.target.value)} 
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 mb-3"
                            rows="4" 
                            placeholder="Enter meeting notes, progress updates, and action items..."
                          ></textarea>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleWriteLog(project._id, activeLogId.weekNumber)}
                              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/25"
                            >
                              Save Log
                            </button>
                            <button 
                              onClick={() => setActiveLogId(null)}
                              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2.5 px-4 rounded-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. FINAL DEFENSE */}
          {finalDefenseProjects.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-900 to-red-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Final Defense Evaluation</h2>
                  <p className="text-sm text-white/60">Submit final marks (30 marks)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {finalDefenseProjects.map(project => (
                  <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-red-500/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1">{project.leaderId?.name}</h3>
                        <p className="text-sm text-white/60">{project.leaderId?.enrollment}</p>
                        <p className="text-sm text-white/80 mt-2">{project.projectTitle}</p>
                      </div>
                      {project.finalDefense?.scheduledDate && (
                        <div className="text-right">
                          <p className="text-xs text-white/60">Defense Date</p>
                          <p className="text-sm text-white font-medium">
                            {new Date(project.finalDefense.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Final PPT */}
                    <div className="mb-6">
                      {project.finalDefense?.finalPptUrl ? (
                        <a 
                          href={getFileUrl(project.finalDefense.finalPptUrl)} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Final Presentation
                        </a>
                      ) : (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                          <p className="text-white/60">Final presentation not uploaded yet</p>
                        </div>
                      )}
                    </div>

                    {/* Marks Submission */}
                    <div className="pt-4 border-t border-white/10">
                      <label className="block text-lg font-medium text-white mb-3">Supervisor Evaluation (30 marks)</label>
                      
                      {project.finalDefense?.marks?.supervisor ? (
                        <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30 text-center">
                          <p className="text-green-300 font-bold text-lg">Marks Submitted</p>
                          <p className="text-white text-3xl font-bold mt-1">{project.finalDefense.marks.supervisor}/30</p>
                          <p className="text-green-400/80 text-sm mt-2">✅ Evaluation Complete</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Enter Marks (0-30)</label>
                            <input 
                              type="number" 
                              id={`final-mark-${project._id}`}
                              min="0" max="30" 
                              placeholder="Enter marks"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            />
                          </div>
                          <button 
                            onClick={() => handleSubmitFinalMark(project._id)}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Submit Final Marks
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {pendingConsents.length === 0 && initialDefenseProjects.length === 0 && 
           srsSdsReviewProjects.length === 0 && developmentProjects.length === 0 && 
           finalDefenseProjects.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📭</div>
              <h3 className="text-xl font-bold text-white mb-2">No Active Tasks</h3>
              <p className="text-white/60">You're all caught up! No pending evaluations or reviews.</p>
            </div>
          )}
        </div>
      </main>

      {/* CONSENT FORM MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Review Project Proposal</h2>
                <p className="text-sm text-white/60">Provide consent for project supervision</p>
              </div>
            </div>

            {/* Student Info */}
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Student Name</p>
                  <p className="text-white font-medium">{selectedProject.leaderId?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Enrollment</p>
                  <p className="text-white font-medium">{selectedProject.leaderId?.enrollment}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-white/60">Project Title</p>
                  <p className="text-white font-medium">{selectedProject.projectTitle}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Digital Signature</label>
                <input 
                  type="text" 
                  value={signatureName} 
                  onChange={e => setSignatureName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  placeholder="Enter your full name"
                />
                <p className="text-xs text-white/50 mt-1">This will serve as your digital signature</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Feedback (Optional)</label>
                <textarea 
                  value={feedback} 
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  rows="3"
                  placeholder="Add any comments or feedback..."
                ></textarea>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                <input 
                  type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                  id="consent-checkbox"
                />
                <label htmlFor="consent-checkbox" className="text-sm text-white/80">
                  I agree to supervise this project and provide guidance throughout the FYP process. 
                  I understand my responsibilities as a supervisor and commit to regular meetings and evaluations.
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleDecision(selectedProject._id, 'Approved')}
                  disabled={processing || !signatureName.trim() || !agreedToTerms}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Approve & Sign'
                  )}
                </button>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, count, color, borderColor, icon }) => (
  <div className={`${color} border ${borderColor} backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white/60 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{count}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-xs text-white/40">Pending actions</p>
    </div>
  </div>
);

export default SupervisorDashboard;