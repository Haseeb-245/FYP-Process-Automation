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
  const [finalFile, setFinalFile] = useState(null);

  // UI States
  const [uploading, setUploading] = useState(false);
  const [proposedSupervisor, setProposedSupervisor] = useState('');
  
  // Weekly Log
  const [logContent, setLogContent] = useState("");
  const [weekNo, setWeekNo] = useState(1);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'student') {
      navigate('/');
      alert('Please login as Student first');
      return;
    }
    setStudent(userInfo);
    fetchProjectStatus(userInfo._id);
  }, [navigate]);

  const fetchProjectStatus = async (studentId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/projects/my-project/${studentId}`);
      const data = await response.json();
      setProject(data);
      console.log("Project Data Loaded:", data); // Debugging
    } catch (error) {
      console.error('Error fetching project:', error);
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
        docType === 'final' ? finalFile : null;

    if (!fileToUpload) { alert('Please select a file first!'); return; }
    
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
        setFile(null); setPptFile(null); setSrsFile(null); setSdsFile(null); setFinalFile(null);
        fetchProjectStatus(student._id);
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

  const submitLog = async () => {
      await fetch('http://localhost:5000/api/projects/submit-log', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ studentId: student._id, weekNo, content: logContent })
      });
      alert("Log Saved!");
      setLogContent("");
      fetchProjectStatus(student._id);
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  // --- LOGIC HELPERS (ROBUST VERSION) ---

  // 1. Is Phase 1 (Proposal) Complete?
  const isPhase1Complete = (status) => {
      const advancedStatuses = [
          'Approved - Ready for Defense', 
          'Scheduled for Defense', 
          'Defense Cleared', 
          'Defense Changes Required', 
          'Proposal Approved', 
          'Interim Scheduled', 
          'Final Scheduled', 
          'Completed'
      ];
      return advancedStatuses.includes(status);
  };

  // 2. Is Phase 2 (Defense) Active?
  // It is active if Phase 1 is done, but Phase 3 hasn't started yet.
  const isPhase2Active = (status) => {
      const phase2Statuses = [
          'Approved - Ready for Defense', 
          'Scheduled for Defense', 
          'Defense Changes Required'
      ];
      return phase2Statuses.includes(status);
  };

 // Add this helper function
const isInitialDefenseComplete = (project) => {
  if (!project || !project.initialDefenseMarks) return false;
  
  const marks = project.initialDefenseMarks;
  return marks.coordinator !== null && 
         marks.supervisor !== null && 
         marks.panel !== null &&
         project.initialDefenseCompleted === true;
};

// Update the isPhase3Active function:
const isPhase3Active = (status, project) => {
  const phase3Statuses = ['Defense Cleared', 'Proposal Approved', 'Interim Scheduled'];
  
  // Check if initial defense is complete even if status hasn't updated yet
  if (isInitialDefenseComplete(project)) {
    return true;
  }
  
  return phase3Statuses.includes(status);
};
  // 4. Is Phase 4 (Final) Active?
  const isPhase4Active = (status) => {
      const phase4Statuses = ['Final Scheduled', 'Completed'];
      return phase4Statuses.includes(status);
  };

  const getStatusColor = (status) => {
    if (status?.includes('Approved') || status?.includes('Cleared') || status?.includes('Completed') || status?.includes('Ready')) return 'bg-green-100 text-green-800 border-green-300';
    if (status?.includes('Rejected') || status?.includes('Changes')) return 'bg-red-100 text-red-800 border-red-300';
    if (status?.includes('Scheduled') || status?.includes('Waiting')) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold transition-colors">Logout</button>
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
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-4 rounded-lg border border-green-500/50 flex justify-between items-center">
                    <div><h3 className="font-bold text-green-400">Phase 1 Completed</h3><p className="text-xs text-green-200">Ready for Phase 2</p></div>
                    <span className="text-2xl">✅</span>
                </div>
            )}

            {/* PHASE 2: DEFENSE */}
            {project && isPhase2Active(project.status) && (
                <div className={`bg-gray-800 rounded-lg shadow-lg p-6 border ${project.defenseDate ? 'border-blue-500 shadow-blue-900/20' : 'border-gray-700 opacity-75'}`}>
                    <h2 className="text-xl font-bold mb-4 flex items-center text-blue-400"><span className="mr-3">🎤</span> Phase 2: Defense</h2>

                    {project.defenseDate ? (
                        <>
                            <div className="mb-4 p-3 bg-blue-900/20 rounded border border-blue-500/30">
                                <p className="text-sm text-blue-200">Scheduled For:</p>
                                <p className="text-lg font-bold text-white">{new Date(project.defenseDate).toDateString()}</p>
                                {project.defenseRoom && <p className="text-sm text-gray-300">Room: {project.defenseRoom}</p>}
                            </div>
                            <form onSubmit={(e) => handleUpload(e, 'ppt')}>
                                <label className="text-sm mb-1 block">Upload Presentation (PPT)</label>
                                <input type="file" accept=".ppt,.pptx,.pdf" onChange={(e) => setPptFile(e.target.files[0])} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm mb-2" />
                                <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">Submit PPT</button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4"><div className="animate-pulse text-yellow-500 text-xl mb-2">⏳</div><p className="text-sm text-gray-400">Waiting for Coordinator to assign defense date.</p></div>
                    )}
                </div>
            )}

          {/* PHASE 3: DEVELOPMENT */}
{project && isPhase3Active(project.status, project) && (
  <div className="bg-gray-800 p-6 rounded-xl border border-orange-500 shadow-orange-900/20">
    <h2 className="text-xl font-bold mb-4 flex items-center text-orange-400">
      <span className="mr-3">🛠️</span> Phase 3: Development
    </h2>
    
    {/* Show completion message if initial defense is complete */}
    {isInitialDefenseComplete(project) && (
      <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
        <p className="text-green-300 font-bold mb-1">✅ Initial Defense Complete!</p>
        <p className="text-sm text-green-200">
          Total Marks: {(
            (project.initialDefenseMarks.coordinator || 0) + 
            (project.initialDefenseMarks.supervisor || 0) + 
            (project.initialDefenseMarks.panel || 0)
          ).toFixed(1)}/15
        </p>
      </div>
    )}
    
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Software Requirements Specification (SRS)</label>
        <form onSubmit={(e) => handleUpload(e, 'srs')} className="space-y-2">
          <input 
            type="file" 
            onChange={e=>setSrsFile(e.target.files[0])} 
            className="w-full text-sm p-2 bg-gray-900 border border-gray-700 rounded"
            accept=".pdf,.doc,.docx"
          />
          <button 
            type="submit" 
            disabled={uploading || !srsFile}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-bold text-sm disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : '📄 Upload SRS'}
          </button>
        </form>
      </div>
      
      <div>
        <label className="block text-sm text-gray-400 mb-2">Software Design Specification (SDS)</label>
        <form onSubmit={(e) => handleUpload(e, 'sds')} className="space-y-2">
          <input 
            type="file" 
            onChange={e=>setSdsFile(e.target.files[0])} 
            className="w-full text-sm p-2 bg-gray-900 border border-gray-700 rounded"
            accept=".pdf,.doc,.docx"
          />
          <button 
            type="submit" 
            disabled={uploading || !sdsFile}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-bold text-sm disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : '📄 Upload SDS'}
          </button>
        </form>
      </div>
    </div>

    {/* Weekly Logs Section */}
    <div className="bg-gray-900 p-4 rounded border border-gray-600">
      <h3 className="text-sm font-bold mb-2 text-gray-300">📝 Weekly Progress Logs</h3>
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Week Number</label>
          <input 
            type="number" 
            value={weekNo} 
            onChange={e=>setWeekNo(e.target.value)} 
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
            min="1"
            max="16"
            placeholder="Week"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Log Content</label>
          <input 
            type="text" 
            value={logContent} 
            onChange={e=>setLogContent(e.target.value)} 
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
            placeholder="What did you accomplish this week?"
          />
        </div>
      </div>
      <button 
        onClick={submitLog} 
        disabled={!logContent.trim()}
        className="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded text-sm font-bold disabled:opacity-50"
      >
        Submit Weekly Log
      </button>
    </div>
    
    {/* Show uploaded documents if they exist */}
    {(project.srsUrl || project.sdsUrl) && (
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-bold text-gray-300 mb-2">📁 Uploaded Documents</h4>
        <div className="space-y-2">
          {project.srsUrl && (
            <a 
              href={`http://localhost:5000/${project.srsUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 bg-gray-900 hover:bg-gray-800 rounded text-sm"
            >
              <span>📄 SRS Document</span>
              <span className="text-blue-400 text-xs">View</span>
            </a>
          )}
          {project.sdsUrl && (
            <a 
              href={`http://localhost:5000/${project.sdsUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 bg-gray-900 hover:bg-gray-800 rounded text-sm"
            >
              <span>📄 SDS Document</span>
              <span className="text-blue-400 text-xs">View</span>
            </a>
          )}
        </div>
      </div>
    )}
  </div>
)}

            {/* PHASE 4: FINALIZATION */}
            {project && isPhase4Active(project.status) && (
                <div className="bg-gray-800 p-6 rounded-xl border border-red-500/50">
                    <h2 className="text-xl font-bold mb-4 text-red-400">Phase 4: Semester 8</h2>
                    <form onSubmit={(e) => handleUpload(e, 'final')}>
                        <label className="block text-sm mb-1">Final Project Report</label>
                        <input type="file" onChange={e=>setFinalFile(e.target.files[0])} className="w-full text-sm mb-2"/>
                        <button className="w-full bg-red-600 py-2 rounded font-bold">Submit Final Report</button>
                    </form>
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
                        {/* Current Stage Badge */}
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">Current Stage</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(project.status)}`}>
                                {project.status}
                            </span>
                        </div>

                        {/* Defense Feedback */}
                        {project.defenseFeedback && (
                            <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/50">
                                 <h3 className="text-sm font-bold text-red-400 mb-1">⚠️ Panel Feedback</h3>
                                 <p className="text-gray-300 text-sm italic">"{project.defenseFeedback}"</p>
                            </div>
                        )}

                        {/* Timeline - FIXED */}
                        <div className="border-t border-gray-700 pt-4">
                             <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Timeline</h3>
                             <div className="space-y-3">
                                <TimelineItem done={true} label="Submitted" />
                                
                                <TimelineItem done={
                                    // Green if NOT pending, rejected, or changes required
                                    !['Pending Coordinator Review', 'Rejected', 'Changes Required'].includes(project.status)
                                } label="Coordinator Review" />
                                
                                <TimelineItem done={
                                    // Green if NOT waiting for supervisor (i.e., Ready for defense or further)
                                    !['Pending Coordinator Review', 'Rejected', 'Changes Required', 'Approved - Waiting for Supervisor Consent', 'Supervisor Rejected'].includes(project.status)
                                } label="Supervisor Consent" />
                                
                                <TimelineItem done={
                                    // Green if Date Exists
                                    !!project.defenseDate
                                } label="Defense Scheduled" />
                                
                                <TimelineItem done={
                                    // Green if Cleared or Proposal Approved
                                    ['Defense Cleared', 'Proposal Approved', 'Interim Scheduled', 'Final Scheduled', 'Completed'].includes(project.status)
                                } label="Defense Cleared" />
                             </div>
                             {/* Initial Defense Marks Table */}
{project?.initialDefenseMarks && (
  <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 mt-6">
    <h3 className="text-lg font-bold mb-4 flex items-center">
      <span className="mr-2">📊</span> Initial Defense Marks (15%)
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900/50">
            <th className="py-2 px-3 text-left">Evaluator</th>
            <th className="py-2 px-3 text-left">Marks (out of 5)</th>
            <th className="py-2 px-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-3">Coordinator</td>
            <td className="py-2 px-3 font-bold">
              {project.initialDefenseMarks.coordinator !== null 
                ? `${project.initialDefenseMarks.coordinator}/5` 
                : 'Pending'}
            </td>
            <td className="py-2 px-3">
              {project.initialDefenseMarks.coordinator !== null 
                ? <span className="text-green-400">✓ Evaluated</span>
                : <span className="text-yellow-400">⏳ Waiting</span>}
            </td>
          </tr>
          <tr>
            <td className="py-2 px-3">Supervisor</td>
            <td className="py-2 px-3 font-bold">
              {project.initialDefenseMarks.supervisor !== null 
                ? `${project.initialDefenseMarks.supervisor}/5` 
                : 'Pending'}
            </td>
            <td className="py-2 px-3">
              {project.initialDefenseMarks.supervisor !== null 
                ? <span className="text-green-400">✓ Evaluated</span>
                : <span className="text-yellow-400">⏳ Waiting</span>}
            </td>
          </tr>
          <tr>
            <td className="py-2 px-3">Panel Member</td>
            <td className="py-2 px-3 font-bold">
              {project.initialDefenseMarks.panel !== null 
                ? `${project.initialDefenseMarks.panel}/5` 
                : 'Pending'}
            </td>
            <td className="py-2 px-3">
              {project.initialDefenseMarks.panel !== null 
                ? <span className="text-green-400">✓ Evaluated</span>
                : <span className="text-yellow-400">⏳ Waiting</span>}
            </td>
          </tr>
          <tr className="border-t border-gray-700">
            <td className="py-2 px-3 font-bold">Total</td>
            <td className="py-2 px-3 font-bold text-green-400">
              {((project.initialDefenseMarks.coordinator || 0) + 
                (project.initialDefenseMarks.supervisor || 0) + 
                (project.initialDefenseMarks.panel || 0)).toFixed(1)}/15
            </td>
            <td className="py-2 px-3">
              {project.initialDefenseCompleted 
                ? <span className="text-green-400">✅ Completed</span>
                : <span className="text-yellow-400">⏳ In Progress</span>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    {project.initialDefenseMarks.feedback && (
      <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-600">
        <p className="text-sm text-gray-400 mb-1">Overall Feedback:</p>
        <p className="text-white text-sm">{project.initialDefenseMarks.feedback}</p>
      </div>
    )}
  </div>
)}
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

const TimelineItem = ({ done, label }) => (
    <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${done ? 'bg-green-500' : 'bg-gray-600'}`}></div>
        <span className={`text-sm ${done ? 'text-white' : 'text-gray-500'}`}>{label}</span>
    </div>
);

export default StudentDashboard;