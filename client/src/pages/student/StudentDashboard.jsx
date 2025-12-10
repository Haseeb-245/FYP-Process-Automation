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
  const [finalPptFile, setFinalPptFile] = useState(null); // UPDATED: For Final Defense PPT

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
      const response = await fetch(`http://localhost:5000/api/projects/my-project/${studentId}`);
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
        docType === 'final-ppt' ? finalPptFile : null; // UPDATED

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
      const response = await fetch('http://localhost:5000/api/projects/upload-doc', { 
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
        const response = await fetch('http://localhost:5000/api/projects/request-meeting', {
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
      const response = await fetch(`http://localhost:5000/api/projects/submit-srs-sds-review/${projectId}`, {
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

  if (!student) return <div className="text-white p-10">Loading...</div>;
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Student Dashboard</h1>
            <p className="text-gray-400 text-sm">Enrollment: {student.enrollment}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refreshProjectStatus(student._id)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-bold transition-colors">🔄 Refresh</button>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* === LEFT COLUMN: WORKFLOW === */}
        <div className="space-y-8">
            
            {/* PHASE 1: PROPOSAL */}
            {!project || !isPhase1Complete(project.status) ? (
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-purple-400"><span className="mr-3">📄</span> Phase 1: Submit Proposal</h2>
                    
                    {project?.status === 'Approved - Waiting for Supervisor Consent' && (
                        <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded text-purple-200 text-sm">
                            ℹ️ Coordinator accepted. Waiting for Supervisor to sign.
                        </div>
                    )}

                    <form onSubmit={(e) => handleUpload(e, 'proposal')} className="space-y-5">
                        <input type="text" value={proposedSupervisor} onChange={(e) => setProposedSupervisor(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg" placeholder="Proposed Supervisor (Optional)" />
                        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm" />
                        <button type="submit" disabled={uploading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors">
                            {uploading ? 'Uploading...' : 'Submit Proposal'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/50 flex justify-between items-center">
                    <div><h3 className="font-bold text-green-400">Phase 1 Completed</h3></div>
                    <span className="text-2xl">✅</span>
                </div>
            )}

            {/* PHASE 2: INITIAL DEFENSE */}
            {project && isPhase2Active(project.status) && (
                <div className={`bg-gray-800 rounded-lg shadow-lg p-6 border ${project.defenseDate ? 'border-blue-500' : 'border-gray-700'}`}>
                    <h2 className="text-xl font-bold mb-4 flex items-center text-blue-400"><span className="mr-3">🎤</span> Phase 2: Initial Defense</h2>
                    {project.defenseDate ? (
                        <>
                            <div className="mb-4 p-3 bg-blue-900/20 rounded border border-blue-500/30">
                                <p className="text-sm text-blue-200">Scheduled: {new Date(project.defenseDate).toDateString()} | Room: {project.defenseRoom}</p>
                            </div>
                            <form onSubmit={(e) => handleUpload(e, 'ppt')}>
                                <label className="text-sm mb-1 block">Upload Presentation (PPT)</label>
                                <input type="file" accept=".ppt,.pptx,.pdf" onChange={(e) => setPptFile(e.target.files[0])} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm mb-2" />
                                <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">Submit PPT</button>
                            </form>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 animate-pulse">⏳ Waiting for Coordinator to assign defense date...</p>
                    )}
                </div>
            )}

            {/* PHASE 3: SRS/SDS */}
            {project && (project.status === 'Defense Cleared' || project.srsSdsStatus) && (
                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 border border-blue-500/50">
                    <h2 className="text-2xl font-bold text-blue-400 mb-4">📋 Phase 3: SRS/SDS</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                             <h3 className="text-sm font-bold mb-2">SRS Upload</h3>
                             <form onSubmit={(e) => handleUpload(e, 'srs')}>
                                <input type="file" onChange={e=>setSrsFile(e.target.files[0])} className="w-full text-xs bg-gray-800 mb-2 p-1 rounded"/>
                                <button className="w-full bg-blue-600 text-xs py-1 rounded">Upload SRS</button>
                             </form>
                             {project.srsUrl && <p className="text-green-400 text-xs mt-1">✅ Uploaded</p>}
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                             <h3 className="text-sm font-bold mb-2">SDS Upload</h3>
                             <form onSubmit={(e) => handleUpload(e, 'sds')}>
                                <input type="file" onChange={e=>setSdsFile(e.target.files[0])} className="w-full text-xs bg-gray-800 mb-2 p-1 rounded"/>
                                <button className="w-full bg-blue-600 text-xs py-1 rounded">Upload SDS</button>
                             </form>
                             {project.sdsUrl && <p className="text-green-400 text-xs mt-1">✅ Uploaded</p>}
                        </div>
                    </div>
                    {project.srsUrl && project.sdsUrl && !project.srsSdsStatus && (
                        <button onClick={() => submitForSrsSdsReview(project._id)} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded font-bold">🚀 Submit for Review</button>
                    )}
                    {project.srsSdsStatus && (
                         <div className="mt-2 p-2 bg-gray-900 rounded text-center border border-gray-600">
                            <p className="text-sm">Status: <span className="font-bold text-blue-400">{project.srsSdsStatus}</span></p>
                         </div>
                    )}
                 </div>
            )}

            {/* PHASE 4: DEVELOPMENT (WEEKLY LOGS) */}
            {project && (project.status === 'Development Phase' || (project.weeklyLogs && project.weeklyLogs.length > 0)) && (
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 border border-green-500/50">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-2xl font-bold text-green-400">🛠️ Phase 4: Development</h2>
                         <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded border border-green-500">Active</span>
                    </div>
                    
                    {/* Meeting Scheduler */}
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 mb-6">
                        <h3 className="text-sm font-bold text-white mb-3">📅 Schedule Weekly Meeting</h3>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                min="1" max="16" 
                                value={meetingWeek} 
                                onChange={(e) => setMeetingWeek(e.target.value)}
                                className="w-20 p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                                placeholder="Week"
                            />
                            <input 
                                type="date" 
                                value={meetingDate} 
                                onChange={(e) => setMeetingDate(e.target.value)}
                                className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                            />
                            <button onClick={requestMeeting} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-bold">Request</button>
                        </div>
                    </div>

                    {/* Logs Display */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400">📋 Weekly Logs</h3>
                        {project.weeklyLogs && project.weeklyLogs.length > 0 ? (
                            project.weeklyLogs.sort((a,b) => a.weekNumber - b.weekNumber).map((log, index) => (
                                <div key={index} className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-blue-400 font-bold text-sm">Week {log.weekNumber}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            log.meetingStatus === 'Accepted' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                                        }`}>
                                            {log.meetingStatus}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">Meeting: {new Date(log.meetingDate).toDateString()}</div>
                                    <div className="bg-gray-900 p-2 rounded text-sm text-gray-300 border border-gray-700">
                                        {log.content ? (
                                            <>
                                                <span className="text-green-500 font-bold block text-xs mb-1">Supervisor Log:</span>
                                                {log.content}
                                            </>
                                        ) : (
                                            <span className="text-gray-500 italic">Waiting for supervisor entry...</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm text-center">No meetings scheduled yet.</p>
                        )}
                    </div>
                </div>
            )}

            {/* PHASE 5: FINAL DEFENSE */}
            {project && (project.status === 'Final Defense Scheduled' || project.status === 'Final Defense Pending' || project.status === 'Project Completed' || project.finalDefense?.scheduledDate) && (
                <div className="bg-gradient-to-br from-red-900/40 to-black rounded-2xl shadow-xl p-6 border border-red-500">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">🎓 Phase 5: Final Defense</h2>
                    
                    {/* Schedule Info */}
                    <div className="mb-6 bg-red-900/20 p-4 rounded border border-red-500/30 text-center">
                        <p className="text-gray-400 text-sm">Final Defense Date</p>
                        <p className="text-2xl font-bold text-white">
                            {project.finalDefense?.scheduledDate ? new Date(project.finalDefense.scheduledDate).toDateString() : "TBA"}
                        </p>
                    </div>

                    {/* Final PPT Upload */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-white mb-2">Upload Final Presentation</h3>
                        <form onSubmit={(e) => handleUpload(e, 'final-ppt')} className="flex gap-2">
                            <input type="file" onChange={(e) => setFinalPptFile(e.target.files[0])} className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded text-sm"/>
                            <button type="submit" disabled={uploading} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold">Upload</button>
                        </form>
                        {project.finalDefense?.finalPptUrl && <p className="text-green-400 text-xs mt-1 text-center">✅ Final PPT Uploaded</p>}
                    </div>

                    {/* Final Grades Display */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3">🏆 Final Evaluation (30%)</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <GradeBox role="Coordinator" mark={project.finalDefense?.marks?.coordinator} />
                            <GradeBox role="Supervisor" mark={project.finalDefense?.marks?.supervisor} />
                            <GradeBox role="Panel" mark={project.finalDefense?.marks?.panel} />
                            <GradeBox role="External" mark={project.finalDefense?.marks?.external} />
                        </div>
                         {project.status === 'Project Completed' && (
                             <div className="mt-4 p-3 bg-green-500 text-black font-bold text-center rounded animate-pulse">
                                 🎉 DEGREE COMPLETED! CONGRATULATIONS!
                             </div>
                         )}
                    </div>
                </div>
            )}

        </div>

        {/* === RIGHT COL: STATUS & TIMELINE === */}
        <div className="h-fit space-y-6">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-6 flex items-center"><span className="mr-3">📊</span> Project Status</h2>
                
                {!project ? (
                    <p className="text-gray-400 text-center py-4">No data available.</p>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">Current Stage</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(project.status)}`}>
                                {project.status}
                            </span>
                        </div>

                        {/* Timeline */}
                        <div className="border-t border-gray-700 pt-4">
                             <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Timeline</h3>
                             <div className="space-y-3">
                                <TimelineItem done={true} label="Project Submitted" />
                                <TimelineItem done={!['Pending Coordinator Review', 'Rejected'].includes(project.status)} label="Coordinator Review" />
                                <TimelineItem done={['Scheduled for Defense', 'Defense Cleared', 'Development Phase', 'Project Completed'].some(s => project.status === s || isPhase2Active(project.status))} label="Initial Defense" />
                                <TimelineItem done={project.srsSdsStatus === 'Approved' || project.status === 'Development Phase'} label="SRS/SDS Approved" />
                                <TimelineItem done={project.status === 'Development Phase' || project.status === 'Project Completed' || project.finalDefense?.scheduledDate} label="Development Phase" />
                                <TimelineItem done={project.status === 'Project Completed'} label="Final Defense Cleared" />
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

// UI Components
const TimelineItem = ({ done, label }) => (
    <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${done ? 'bg-green-500' : 'bg-gray-600'}`}></div>
        <span className={`text-sm ${done ? 'text-white' : 'text-gray-500'}`}>{label}</span>
    </div>
);

const GradeBox = ({ role, mark }) => (
    <div className="bg-gray-900 p-2 rounded border border-gray-700 flex justify-between">
        <span className="text-gray-400">{role}</span>
        <span className={`font-bold ${mark ? 'text-green-400' : 'text-yellow-500'}`}>
            {mark ? mark : '-'}
        </span>
    </div>
);

export default StudentDashboard;