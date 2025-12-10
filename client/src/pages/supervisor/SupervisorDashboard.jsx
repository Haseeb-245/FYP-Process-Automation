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
  const [activeLogId, setActiveLogId] = useState(null); // { projectId, weekNumber }

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
        fetch(`http://localhost:5000/api/projects/supervisor-pending/${supervisorId}`),
        fetch(`http://localhost:5000/api/projects/supervisor-initial-defense/${supervisorId}`),
        // Ensure your backend 'supervisor-srs-sds-review' route fetches statuses: 
        // 'Development Phase', 'Final Defense Scheduled', etc.
        fetch(`http://localhost:5000/api/projects/supervisor-srs-sds-review/${supervisorId}`)
      ]);

      if (consentsRes.ok) setPendingConsents(await consentsRes.json());
      if (initialDefenseRes.ok) setInitialDefenseProjects(await initialDefenseRes.json());

      if (srsSdsRes.ok) {
          const data = await srsSdsRes.json();
          // Filter for SRS/SDS Review
          setSrsSdsReviewProjects(data.filter(p => p.srsSdsStatus === 'Pending Review' || p.srsSdsStatus === 'Under Review' || p.status === 'Ready for SRS/SDS Review'));
          
          // Filter for Phase 4 (Development)
          setDevelopmentProjects(data.filter(p => p.status === 'Development Phase'));
          
          // Filter for Phase 5 (Final Defense)
          setFinalDefenseProjects(data.filter(p => p.status.includes('Final Defense') || p.status === 'Project Completed'));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER: Fix Windows File Paths ---
  const getFileUrl = (path) => {
    if (!path) return '#';
    // Replace backslashes with forward slashes for URL compatibility
    const cleanPath = path.replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };

  // --- ACTIONS ---

  const handleDecision = async (projectId, decision) => {
    if (decision === 'Approved') {
      if (!signatureName.trim()) return alert('Please enter your signature name');
      if (!agreedToTerms) return alert('Please agree to the supervision commitment terms');
    }

    try {
      setProcessing(true);
      const response = await fetch(`http://localhost:5000/api/projects/supervisor-decision/${projectId}`, {
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
      const response = await fetch(`http://localhost:5000/api/projects/submit-initial-defense-marks/${projectId}`, {
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
          const res = await fetch(`http://localhost:5000/api/projects/accept-meeting/${projectId}`, {
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
          const res = await fetch(`http://localhost:5000/api/projects/write-weekly-log/${projectId}`, {
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
          const res = await fetch(`http://localhost:5000/api/projects/submit-final-marks/${projectId}`, {
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
      await fetch(`http://localhost:5000/api/projects/supervisor-srs-sds-decision/${projectId}`, {
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
      await fetch(`http://localhost:5000/api/projects/submit-srs-sds-marks/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'supervisor', marks: parseFloat(marksInput), feedback: feedbackInput })
      });
      alert('✅ Evaluation Submitted!');
      fetchAllData(supervisor._id);
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  if (!supervisor) return <div className="text-white p-10">Loading...</div>;
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
          <button onClick={() => fetchAllData(supervisor._id)} className="bg-blue-600 px-4 py-2 rounded text-sm font-bold">Refresh</button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-12">
        
        {/* 1. PENDING CONSENTS */}
        {pendingConsents.length > 0 && (
            <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center"><span className="mr-2">📝</span> Pending Consents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingConsents.map(p => (
                        <div key={p._id} className="bg-gray-800 p-6 rounded-lg border border-yellow-500/50">
                            <h3 className="font-bold text-lg">{p.leaderId?.name}</h3>
                            <p className="text-gray-400 text-sm mb-4">{p.leaderId?.enrollment}</p>
                            <button onClick={() => setSelectedProject(p)} className="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded text-white font-bold">
                                Review Proposal
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* 2. INITIAL DEFENSE EVALUATIONS */}
        {initialDefenseProjects.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center text-green-400">🎤 Initial Defense Evaluations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initialDefenseProjects.map((project) => (
                <div key={project._id} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-green-700">
                  <h3 className="text-xl font-bold mb-1">{project.leaderId?.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{project.leaderId?.enrollment}</p>
                  
                  {project.presentationUrl ? (
                    <a
                      href={getFileUrl(project.presentationUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
                    >
                      📥 Download Presentation (PPT)
                    </a>
                  ) : (
                    <div className="mb-4 p-2 bg-gray-700 rounded text-center text-gray-400 text-sm">No PPT Uploaded</div>
                  )}
                  
                  {project.initialDefenseMarks?.supervisor !== null && project.initialDefenseMarks?.supervisor !== undefined ? (
                    <div className="p-3 bg-green-900/30 rounded border border-green-500 text-center">
                      <p className="text-green-300 font-bold">✅ Evaluated</p>
                      <p className="text-white">Marks: {project.initialDefenseMarks.supervisor}/5</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input type="number" id={`marks-${project._id}`} min="0" max="5" step="0.5" placeholder="Marks (0-5)" className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"/>
                      <textarea id={`feedback-${project._id}`} placeholder="Feedback (Optional)" className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white" rows="2"></textarea>
                      <button onClick={() => handleInitialDefenseEvaluation(project._id)} disabled={processing} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">Submit Evaluation</button>
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
                <h2 className="text-2xl font-bold mb-4 flex items-center"><span className="mr-2">📋</span> SRS/SDS Reviews</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {srsSdsReviewProjects.map(p => (
                        <div key={p._id} className="bg-gray-800 p-6 rounded-lg border border-purple-500/50">
                            <h3 className="font-bold text-lg">{p.leaderId?.name}</h3>
                            <div className="flex gap-2 my-3">
                                {p.srsUrl && <a href={getFileUrl(p.srsUrl)} target="_blank" className="text-blue-400 text-sm underline">View SRS</a>}
                                {p.sdsUrl && <a href={getFileUrl(p.sdsUrl)} target="_blank" className="text-blue-400 text-sm underline">View SDS</a>}
                            </div>
                            
                            {p.srsSdsStatus === 'Under Review' ? (
                                p.srsSdsReviewMarks?.supervisor ? (
                                    <div className="bg-green-900/30 p-2 rounded text-center text-green-300 font-bold border border-green-500">
                                        ✅ Graded: {p.srsSdsReviewMarks.supervisor}/5
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-4 border-t border-gray-700 pt-4">
                                        <p className="text-sm font-bold text-green-400">Evaluate Documents (5%)</p>
                                        <input type="number" id={`srs-sds-marks-${p._id}`} placeholder="Marks (0-5)" className="w-full bg-gray-900 p-2 rounded text-white"/>
                                        <textarea id={`srs-sds-feedback-${p._id}`} placeholder="Feedback..." className="w-full bg-gray-900 p-2 rounded text-white" rows="2"></textarea>
                                        <button onClick={() => handleSrsSdsEvaluation(p._id)} className="w-full bg-green-600 py-2 rounded font-bold">Submit Marks</button>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-2">
                                    <textarea id={`feedback-${p._id}`} placeholder="Review Feedback..." className="w-full bg-gray-900 p-2 rounded text-white text-sm" rows="2"></textarea>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSrsSdsDecision(p._id, 'Approved')} className="flex-1 bg-green-600 py-2 rounded font-bold text-sm">Approve</button>
                                        <button onClick={() => handleSrsSdsDecision(p._id, 'Changes Required')} className="flex-1 bg-yellow-600 py-2 rounded font-bold text-sm">Changes Req.</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* 4. PHASE 4: DEVELOPMENT (MEETINGS & LOGS) */}
        {developmentProjects.length > 0 && (
            <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center text-green-400"><span className="mr-2">🛠️</span> Development Phase (Weekly Logs)</h2>
                <div className="grid grid-cols-1 gap-6">
                    {developmentProjects.map(p => (
                        <div key={p._id} className="bg-gray-800 p-6 rounded-lg border border-green-500/30">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-xl">{p.leaderId?.name}</h3>
                                <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs">Active Development</span>
                            </div>
                            
                            <div className="space-y-3">
                                {p.weeklyLogs && p.weeklyLogs.length > 0 ? (
                                    p.weeklyLogs.sort((a,b)=>a.weekNumber-b.weekNumber).map(log => (
                                    <div key={log.weekNumber} className="bg-gray-900 p-4 rounded border border-gray-700 flex justify-between items-start">
                                        <div>
                                            <span className="text-blue-400 font-bold text-sm">Week {log.weekNumber}</span>
                                            <div className="text-xs text-gray-400 mt-1">Requested: {new Date(log.meetingDate).toDateString()}</div>
                                            {log.content && <p className="text-sm text-gray-300 mt-2 border-l-2 border-green-500 pl-2">{log.content}</p>}
                                        </div>
                                        
                                        <div className="flex flex-col gap-2">
                                            {log.meetingStatus === 'Pending' && (
                                                <button onClick={() => handleAcceptMeeting(p._id, log.weekNumber)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-bold">Accept Meeting</button>
                                            )}
                                            {log.meetingStatus === 'Accepted' && !log.content && activeLogId?.weekNumber !== log.weekNumber && (
                                                <button onClick={() => setActiveLogId({ projectId: p._id, weekNumber: log.weekNumber })} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-bold">Write Log</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                                ) : <p className="text-gray-500 italic">No meetings scheduled yet.</p>}
                                
                                {activeLogId && activeLogId.projectId === p._id && (
                                    <div className="bg-gray-700 p-4 rounded border border-green-500 mt-2">
                                        <h4 className="text-sm font-bold mb-2">Write Log for Week {activeLogId.weekNumber}</h4>
                                        <textarea value={logContent} onChange={(e) => setLogContent(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white text-sm mb-2" rows="3" placeholder="Log details..."></textarea>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleWriteLog(p._id, activeLogId.weekNumber)} className="bg-green-600 px-4 py-1 rounded text-sm font-bold">Save</button>
                                            <button onClick={() => setActiveLogId(null)} className="bg-gray-500 px-4 py-1 rounded text-sm font-bold">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* 5. PHASE 5: FINAL DEFENSE */}
        {finalDefenseProjects.length > 0 && (
            <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center text-red-400"><span className="mr-2">🎓</span> Final Defense Evaluation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {finalDefenseProjects.map(p => (
                        <div key={p._id} className="bg-gray-800 p-6 rounded-lg border border-red-500/50">
                            <h3 className="font-bold text-lg mb-1">{p.leaderId?.name}</h3>
                            <p className="text-xs text-gray-400 mb-4">Date: {p.finalDefense?.scheduledDate ? new Date(p.finalDefense.scheduledDate).toDateString() : 'TBA'}</p>
                            
                            {p.finalDefense?.finalPptUrl ? (
                                <a href={getFileUrl(p.finalDefense.finalPptUrl)} target="_blank" className="block mb-4 text-blue-400 text-sm underline">📥 Download Final PPT</a>
                            ) : (
                                <p className="text-xs text-yellow-500 mb-4">PPT not uploaded yet</p>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <label className="text-sm font-bold block mb-1">Supervisor Marks (30%)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        id={`final-mark-${p._id}`}
                                        defaultValue={p.finalDefense?.marks?.supervisor || ''}
                                        disabled={p.finalDefense?.marks?.supervisor}
                                        className="bg-gray-900 border border-gray-600 p-2 rounded w-24 text-white" 
                                        placeholder="0-30"
                                    />
                                    {!p.finalDefense?.marks?.supervisor ? (
                                        <button onClick={() => handleSubmitFinalMark(p._id)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold">Submit</button>
                                    ) : <span className="text-green-500 font-bold flex items-center">✅ Submitted</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* Empty State */}
        {pendingConsents.length === 0 && initialDefenseProjects.length === 0 && srsSdsReviewProjects.length === 0 && developmentProjects.length === 0 && finalDefenseProjects.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                <h3 className="text-xl">No active tasks found.</h3>
            </div>
        )}

      </div>

      {/* CONSENT FORM MODAL */}
      {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-6 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">Approve Project</h2>
                <p className="text-gray-300 mb-4">Student: {selectedProject.leaderId?.name}</p>
                <input type="text" value={signatureName} onChange={e=>setSignatureName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded text-white mb-4" placeholder="Digital Signature (Your Name)" />
                <div className="flex items-center mb-6">
                    <input type="checkbox" checked={agreedToTerms} onChange={e=>setAgreedToTerms(e.target.checked)} className="mr-2"/>
                    <label className="text-sm text-gray-300">I agree to supervise this project.</label>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => handleDecision(selectedProject._id, 'Approved')} disabled={processing} className="flex-1 bg-green-600 py-3 rounded font-bold text-white">Approve</button>
                    <button onClick={() => setSelectedProject(null)} className="flex-1 bg-gray-700 py-3 rounded font-bold text-white">Cancel</button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;