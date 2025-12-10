import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Calendar,
  LogOut,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileCheck,
  Download,
  Search,
  BookOpen,
  GraduationCap // ← ADDED THIS
} from "lucide-react";

// ============================================
// FINAL DEFENSE COORDINATOR COMPONENT (NEW)
// ============================================
export const FinalDefenseCoordinator = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Scheduling State
  const [defenseDate, setDefenseDate] = useState('');
  
  // Grading State
  const [marks, setMarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchFinalDefenseProjects();
  }, []);

  const fetchFinalDefenseProjects = async () => {
    try {
      setLoading(true);
      // Fetch projects relevant to Final Phase
      // We look for projects in Development Phase (ready to schedule) or Final Defense stages
      const response = await fetch('http://localhost:5000/api/projects/evaluation-list/final');
      const data = await response.json();
      
      // Note: Backend endpoint should return projects with status: 
      // 'Development Phase', 'Final Defense Scheduled', 'Final Defense Pending', 'Project Completed'
      console.log('Final defense projects:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!defenseDate) return alert('Please select a date');
    try {
      setProcessing(true);
      const res = await fetch(`http://localhost:5000/api/projects/schedule-final-defense/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: defenseDate })
      });
      if(res.ok) {
        alert("Final Defense Scheduled! 📅");
        setSelectedProject(null);
        setDefenseDate('');
        fetchFinalDefenseProjects();
      } else {
        alert("Failed to schedule.");
      }
    } catch(err) { console.error(err); } finally { setProcessing(false); }
  };

  const handleGrade = async () => {
    if (!marks || marks < 0 || marks > 30) return alert('Enter valid marks (0-30)');
    try {
      setProcessing(true);
      const res = await fetch(`http://localhost:5000/api/projects/submit-final-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'coordinator', marks: marks })
      });
      if(res.ok) {
        alert("Grade Submitted! 🎓");
        setSelectedProject(null);
        setMarks('');
        fetchFinalDefenseProjects();
      } else {
        alert("Failed to submit grade.");
      }
    } catch(err) { console.error(err); } finally { setProcessing(false); }
  };

  if (loading) return <div className="p-10 text-white text-center">Loading...</div>;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          Final Defense Management
        </h1>
        <p className="text-gray-400 mt-2">Schedule dates and grade the final 30% evaluation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: SCHEDULING */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Calendar className="mr-2 text-blue-400"/> Schedule Final Defense
          </h2>
          <div className="space-y-4">
            {/* Filter projects that are ready but NOT yet scheduled */}
            {projects.filter(p => !p.finalDefense?.scheduledDate && (p.status === 'Development Phase' || p.status.includes('Final'))).map(p => (
              <div key={p._id} className="bg-gray-900 p-4 rounded-lg border border-gray-600 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">{p.leaderId?.name}</h3>
                  <p className="text-sm text-gray-400">{p.leaderId?.enrollment}</p>
                </div>
                <button 
                  onClick={() => setSelectedProject({...p, type: 'schedule'})}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white"
                >
                  Schedule
                </button>
              </div>
            ))}
            {projects.filter(p => !p.finalDefense?.scheduledDate && (p.status === 'Development Phase' || p.status.includes('Final'))).length === 0 && (
              <p className="text-gray-500 text-center">No projects waiting for scheduling.</p>
            )}
          </div>
        </div>

        {/* SECTION 2: GRADING */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <GraduationCap className="mr-2 text-green-400"/> Final Grading (30%)
          </h2>
          <div className="space-y-4">
            {/* Filter projects that ARE scheduled */}
            {projects.filter(p => p.finalDefense?.scheduledDate).map(p => (
              <div key={p._id} className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white">{p.leaderId?.name}</h3>
                    <p className="text-xs text-gray-400">Date: {new Date(p.finalDefense.scheduledDate).toDateString()}</p>
                  </div>
                  {p.finalDefense?.marks?.coordinator ? (
                    <span className="text-green-400 font-bold">{p.finalDefense.marks.coordinator}/30</span>
                  ) : (
                    <button 
                      onClick={() => setSelectedProject({...p, type: 'grade'})}
                      disabled={!p.finalDefense?.finalPptUrl} // Disable if PPT not uploaded
                      className={`px-3 py-1 rounded text-sm text-white ${!p.finalDefense?.finalPptUrl ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      Grade
                    </button>
                  )}
                </div>
                {p.finalDefense?.finalPptUrl ? (
                   <a href={`http://localhost:5000/${p.finalDefense.finalPptUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs underline">Download Final PPT</a>
                ) : <span className="text-yellow-500 text-xs">PPT Pending from Student</span>}
              </div>
            ))}
             {projects.filter(p => p.finalDefense?.scheduledDate).length === 0 && (
              <p className="text-gray-500 text-center">No scheduled projects.</p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-96 border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedProject.type === 'schedule' ? 'Set Defense Date' : 'Enter Final Marks'}
            </h3>
            
            {selectedProject.type === 'schedule' ? (
              <input 
                type="datetime-local" 
                className="w-full p-2 bg-gray-900 text-white rounded mb-4"
                onChange={(e) => setDefenseDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            ) : (
              <div>
                <input 
                  type="number" 
                  className="w-full p-2 bg-gray-900 text-white rounded mb-2"
                  placeholder="Marks (0-30)"
                  max="30"
                  onChange={(e) => setMarks(e.target.value)}
                />
                <p className="text-xs text-gray-400 mb-4">Weightage: 30% of Total Grade</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setSelectedProject(null)} className="px-4 py-2 bg-gray-600 rounded text-white">Cancel</button>
              <button 
                onClick={selectedProject.type === 'schedule' ? handleSchedule : handleGrade}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 rounded text-white font-bold"
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// INITIAL DEFENSE EVALUATION COMPONENT
// ============================================
export const InitialDefenseEvaluation = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
   

  useEffect(() => {
    fetchInitialDefenseProjects();
  }, []);

   

  const fetchInitialDefenseProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/projects/initial-defense-projects');
      const data = await response.json();
      console.log('Initial defense projects:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

   

  const handleSubmitMarks = async () => {
    if (!marks || marks < 0 || marks > 5) {
      alert('Please enter valid marks between 0 and 5');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`http://localhost:5000/api/projects/submit-initial-defense-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: 'coordinator', 
          marks: parseFloat(marks),
          feedback: feedback || undefined
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Marks submitted successfully!');
        if (data.allMarksGiven) {
          alert('🎉 All evaluations received! Project moved to next phase.');
        }
        setSelectedProject(null);
        setMarks('');
        setFeedback('');
        fetchInitialDefenseProjects();
      } else {
        alert(data.message || 'Failed to submit marks');
      }
    } catch (error) {
      console.error('Error submitting marks:', error);
      alert('Server error');
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotalMarks = (project) => {
    const m = project.initialDefenseMarks || {};
    const total = (m.coordinator || 0) + (m.supervisor || 0) + (m.panel || 0);
    const percentage = (total / 15 * 100).toFixed(1);
    return { total, percentage };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }




  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Initial Defense Evaluations
        </h1>
        <p className="text-gray-400 mt-2">Evaluate PPT presentations (5% weightage each for Coordinator, Supervisor, Panel)</p>
      </div>

      <button
        onClick={fetchInitialDefenseProjects}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
      >
        🔄 Refresh List
      </button>

      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <FileCheck className="w-6 h-6 mr-3 text-green-400" />
            Projects Ready for Initial Defense Evaluation ({projects.length})
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
            <p className="text-gray-400">Projects will appear here after PPT upload and defense scheduling.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">PPT</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Coordinator (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Supervisor (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Panel (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Total (15%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {projects.map((project) => {
                  const marks = project.initialDefenseMarks || {};
                  const total = calculateTotalMarks(project);
                  return (
                    <tr key={project._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{project.leaderId?.name}</div>
                        <div className="text-sm text-gray-400">{project.leaderId?.enrollment}</div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`http://localhost:5000/${project.presentationUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors inline-flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" /> View PPT
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${marks.coordinator !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {marks.coordinator !== null ? `${marks.coordinator}/5` : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${marks.supervisor !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {marks.supervisor !== null ? `${marks.supervisor}/5` : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${marks.panel !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {marks.panel !== null ? `${marks.panel}/5` : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{total.total}/15</div>
                        <div className="text-sm text-gray-400">{total.percentage}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedProject(project)}
                          disabled={marks.coordinator !== null}
                          className={`px-4 py-2 rounded-lg transition-all ${marks.coordinator !== null ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'}`}
                        >
                          {marks.coordinator !== null ? '✅ Evaluated' : '📝 Evaluate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">Initial Defense Evaluation</h2>
                  <p className="text-gray-400 mt-1">Student: {selectedProject.leaderId?.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setMarks('');
                    setFeedback('');
                  }}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Evaluation Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Student:</span>
                    <div className="font-medium text-white">{selectedProject.leaderId?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Your Role:</span>
                    <div className="font-medium text-blue-400">Coordinator (5% weight)</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Download PPT:</span>
                    <a
                      href={`http://localhost:5000/${selectedProject.presentationUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline block"
                    >
                      📥 Click to download
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white mb-2">
                  Enter Marks (0 to 5) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  min="0"
                  max="5"
                  step="0.5"
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter marks out of 5"
                />
                <p className="text-sm text-gray-400 mt-1">Note: This contributes 5% to the total grade</p>
              </div>

              <div>
                <label className="block font-semibold text-white mb-2">Feedback (Optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Provide feedback on presentation skills, content, delivery..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitMarks}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {processing ? 'Submitting...' : '✅ Submit Evaluation'}
                </button>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setMarks('');
                    setFeedback('');
                  }}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
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

// ============================================
// SRS/SDS COORDINATOR EVALUATION COMPONENT
// ============================================
export const SrsSdsCoordinator = () => { // ← ADD 'export' HERE
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSrsSdsProjects();
  }, []);

  const fetchSrsSdsProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/projects/srs-sds-evaluation-projects');
      const data = await response.json();
      console.log('SRS/SDS projects for coordinator:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching SRS/SDS projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMarks = async () => {
    if (!marks || marks < 0 || marks > 5) {
      alert('Please enter valid marks between 0 and 5');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`http://localhost:5000/api/projects/submit-srs-sds-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: 'coordinator', 
          marks: parseFloat(marks),
          feedback: feedback || undefined
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ SRS/SDS evaluation submitted successfully!');
        if (data.allMarksGiven) {
          alert('🎉 All evaluations received! Project moved to Development Phase.');
        }
        setSelectedProject(null);
        setMarks('');
        setFeedback('');
        fetchSrsSdsProjects();
      } else {
        alert(data.message || 'Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Server error');
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotalMarks = (project) => {
    const m = project.srsSdsReviewMarks || {};
    const total = (m.coordinator || 0) + (m.supervisor || 0) + (m.panel || 0);
    const percentage = (total / 15 * 100).toFixed(1);
    return { total, percentage };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          SRS/SDS Document Evaluation
        </h1>
        <p className="text-gray-400 mt-2">Evaluate SRS and SDS documents (5% weightage each for Coordinator, Supervisor, Panel)</p>
      </div>

      <button
        onClick={fetchSrsSdsProjects}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
      >
        🔄 Refresh List
      </button>

      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <span className="mr-3">📋</span>
            SRS/SDS Documents Ready for Evaluation ({projects.length})
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Documents Found</h3>
            <p className="text-gray-400">Documents will appear here after supervisor approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">SRS</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">SDS</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Coordinator (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Supervisor (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Panel (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Total (15%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {projects.map((project) => {
                  const marks = project.srsSdsReviewMarks || {};
                  const total = calculateTotalMarks(project);
                  return (
                    <tr key={project._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{project.leaderId?.name}</div>
                        <div className="text-sm text-gray-400">{project.leaderId?.enrollment}</div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`http://localhost:5000/${project.srsUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors inline-flex items-center"
                        >
                          📄 View SRS
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`http://localhost:5000/${project.sdsUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors inline-flex items-center"
                        >
                          📄 View SDS
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${marks.coordinator !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {marks.coordinator !== null ? `${marks.coordinator}/5` : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${marks.supervisor !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {marks.supervisor !== null ? `${marks.supervisor}/5` : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${marks.panel !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {marks.panel !== null ? `${marks.panel}/5` : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{total.total}/15</div>
                        <div className="text-sm text-gray-400">{total.percentage}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedProject(project)}
                          disabled={marks.coordinator !== null}
                          className={`px-4 py-2 rounded-lg transition-all ${marks.coordinator !== null ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'}`}
                        >
                          {marks.coordinator !== null ? '✅ Evaluated' : '📝 Evaluate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">SRS/SDS Document Evaluation</h2>
                  <p className="text-gray-400 mt-1">Student: {selectedProject.leaderId?.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setMarks('');
                    setFeedback('');
                  }}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Evaluation Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Student:</span>
                    <div className="font-medium text-white">{selectedProject.leaderId?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Your Role:</span>
                    <div className="font-medium text-blue-400">Coordinator (5% weight)</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Download SRS:</span>
                    <a
                      href={`http://localhost:5000/${selectedProject.srsUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline block"
                    >
                      📥 Click to download SRS
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400">Download SDS:</span>
                    <a
                      href={`http://localhost:5000/${selectedProject.sdsUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline block"
                    >
                      📥 Click to download SDS
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white mb-2">
                  Enter Marks (0 to 5) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  min="0"
                  max="5"
                  step="0.5"
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter marks out of 5"
                />
                <p className="text-sm text-gray-400 mt-1">Note: This contributes 5% to the total grade (15% total for SRS/SDS review)</p>
              </div>

              <div>
                <label className="block font-semibold text-white mb-2">Feedback (Optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Provide feedback on document quality, completeness, technical accuracy..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitMarks}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {processing ? 'Submitting...' : '✅ Submit Evaluation'}
                </button>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setMarks('');
                    setFeedback('');
                  }}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
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

const FypCoordinator = () => {
  const navigate = useNavigate();
  const [coordinator, setCoordinator] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
     
    if (!userInfo || userInfo.role !== 'coordinator') {
      navigate('/');
      return;
    }
     
    setCoordinator(userInfo);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  if (!coordinator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className={`h-0.5 bg-white transition-all duration-300 ${sidebarOpen ? 'w-4' : 'w-6'}`}></div>
                <div className="h-0.5 bg-white w-6"></div>
                <div className={`h-0.5 bg-white transition-all duration-300 ${sidebarOpen ? 'w-4' : 'w-6'}`}></div>
              </div>
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FYP Coordinator
              </h1>
              <p className="text-sm text-gray-400">Manage Final Year Projects</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="font-medium">{coordinator.name}</p>
                <p className="text-sm text-gray-400">{coordinator.department || "Computer Science"}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                {coordinator.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800/50 backdrop-blur-lg border-r border-gray-700 min-h-screen transition-all duration-300`}>
          <nav className="p-4">
            <div className="space-y-2 mt-6">
              <SidebarButton 
                icon={<BarChart3 className="w-5 h-5" />} 
                label="Dashboard" 
                active={true}
                onClick={() => navigate('/coordinator/dashboard')}
                collapsed={!sidebarOpen}
              />
              <SidebarButton 
                icon={<FileText className="w-5 h-5" />} 
                label="Proposals" 
                onClick={() => navigate('/coordinator/proposals')}
                collapsed={!sidebarOpen}
              />
              <SidebarButton 
                icon={<FileCheck className="w-5 h-5" />} 
                label="All Projects" 
                onClick={() => navigate('/coordinator/all-projects')}
                collapsed={!sidebarOpen}
              />
              <SidebarButton 
                icon={<Calendar className="w-5 h-5" />} 
                label="Schedule Defense" 
                onClick={() => navigate('/coordinator/schedule-defense')}
                collapsed={!sidebarOpen}
              />
              <SidebarButton 
                icon={<BarChart3 className="w-5 h-5" />} 
                label="Initial Defense" 
                onClick={() => navigate('/coordinator/initial-defense-evaluation')}
                collapsed={!sidebarOpen}
              />
              <SidebarButton 
                icon={<BookOpen className="w-5 h-5" />} 
                label="SRS/SDS Evaluation" 
                onClick={() => navigate('/coordinator/srs-sds-evaluation')}
                collapsed={!sidebarOpen}
              />
              {/* NEW SIDEBAR ITEM */}
              <SidebarButton 
                icon={<GraduationCap className="w-5 h-5" />} 
                label="Final Defense" 
                onClick={() => navigate('/coordinator/final-defense')}
                collapsed={!sidebarOpen}
              />
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

// Sidebar Button Component
const SidebarButton = ({ icon, label, active = false, onClick, collapsed }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-l-4 border-blue-400' 
          : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
      }`}
    >
      <div className={`${collapsed ? 'mx-auto' : ''}`}>
        {icon}
      </div>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
};

// ============================================
// DASHBOARD COMPONENT
// ============================================
export const Dashboard = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');

  useEffect(() => {
    fetchPendingProposals();
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects/supervisors');
      const data = await response.json();
      console.log('Supervisors fetched:', data);
      setSupervisors(data);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const fetchPendingProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/projects/pending');
      const data = await response.json();
      console.log('Proposals fetched:', data);
      setProposals(data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      alert('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (projectId, status) => {
    if (status === 'Approved' && !selectedSupervisor) {
      alert('Please select a supervisor before approving!');
      return;
    }

    const actionText = status === 'Approved' ? 'approve and assign supervisor' : status.toLowerCase();
    if (!window.confirm(`Are you sure you want to ${actionText} for this proposal?`)) {
      return;
    }

    try {
      setProcessing(true);
       
      let response;
      if (status === 'Approved') {
        response = await fetch(`http://localhost:5000/api/projects/assign-supervisor/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            supervisorId: selectedSupervisor,
            feedback: feedback || undefined
          }),
        });
      } else {
        response = await fetch(`http://localhost:5000/api/projects/decision/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: status,
            feedback: feedback || undefined
          }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        const message = status === 'Approved' 
          ? 'Proposal approved and sent to supervisor for consent!' 
          : `Proposal ${status} successfully!`;
        alert(message);
        setSelectedProposal(null);
        setFeedback('');
        setSelectedSupervisor('');
        fetchPendingProposals();
      } else {
        alert(data.message || 'Failed to update proposal');
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      alert('Server error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Coordinator Review': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'Approved': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Approved - Waiting for Supervisor Consent': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'Approved - Ready for Defense': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Scheduled for Defense': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'Supervisor Rejected': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'Changes Required': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Proposal Review Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Monitor and manage student FYP submissions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-500/30 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-white">{proposals.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/30 border border-green-500/30 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Approved</p>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 border border-yellow-500/30 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Changes Required</p>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/30 border border-red-500/30 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={fetchPendingProposals}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Proposals Table */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <FileText className="w-6 h-6 mr-3 text-blue-400" />
            Pending Proposals ({proposals.length})
          </h2>
        </div>

        {proposals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400">No pending proposals to review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Enrollment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {proposals.map((proposal) => (
                  <tr key={proposal._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {proposal.leaderId?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {proposal.leaderId?.enrollment || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {proposal.leaderId?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedProposal(proposal)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">Review Proposal</h2>
                  <p className="text-gray-400 mt-1">
                    Student: {selectedProposal.leaderId?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProposal(null);
                    setFeedback('');
                    setSelectedSupervisor('');
                  }}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Student Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <div className="font-medium text-white mt-1">{selectedProposal.leaderId?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Enrollment:</span>
                    <div className="font-medium text-white mt-1">{selectedProposal.leaderId?.enrollment}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Email:</span>
                    <div className="font-medium text-white mt-1">{selectedProposal.leaderId?.email || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Document */}
              <div>
                <h3 className="font-semibold text-white mb-2">Proposal Document</h3>
                <a
                  href={`http://localhost:5000/${selectedProposal.documentUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📄 View/Download Proposal
                </a>
              </div>

              {/* Feedback */}
              <div>
                <label className="block font-semibold text-white mb-2">
                  Feedback / Comments (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Provide feedback for the student..."
                />
              </div>

              {/* Supervisor Selection */}
              <div>
                <label className="block font-semibold text-white mb-2">
                  Assign Supervisor (Required for Approval) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Supervisor --</option>
                  {supervisors.map((sup) => (
                    <option key={sup._id} value={sup._id}>
                      {sup.name} ({sup.email})
                    </option>
                  ))}
                </select>
                {selectedProposal.proposedSupervisorName && (
                  <p className="text-sm text-gray-400 mt-2">
                    💡 Student proposed: {selectedProposal.proposedSupervisorName}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <button
                  onClick={() => handleDecision(selectedProposal._id, 'Approved')}
                  disabled={processing}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleDecision(selectedProposal._id, 'Changes Required')}
                  disabled={processing}
                  className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                >
                  📝 Request Changes
                </button>
                <button
                  onClick={() => handleDecision(selectedProposal._id, 'Rejected')}
                  disabled={processing}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// ALL PROJECTS COMPONENT
// ============================================
export const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/projects/defense-pending');
      const data = await response.json();
       
      // Also fetch pending proposals
      const pendingResponse = await fetch('http://localhost:5000/api/projects/pending');
      const pendingData = await pendingResponse.json();
       
      // Combine all projects
      const allProjects = [...data, ...pendingData];
      console.log('All projects:', allProjects);
      setProjects(allProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Coordinator Review': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'Approved - Waiting for Supervisor Consent': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'Approved - Ready for Defense': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Scheduled for Defense': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'Supervisor Rejected': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'Changes Required': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case 'Defense Passed': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.leaderId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.leaderId?.enrollment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusOptions = [
    'All',
    'Pending Coordinator Review',
    'Approved - Waiting for Supervisor Consent',
    'Approved - Ready for Defense',
    'Scheduled for Defense',
    'Defense Passed',
    'Rejected',
    'Supervisor Rejected',
    'Changes Required'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          All Projects
        </h1>
        <p className="text-gray-400 mt-2">Complete overview of all FYP submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name or enrollment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button
          onClick={fetchAllProjects}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Projects Table */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <FileCheck className="w-6 h-6 mr-3 text-blue-400" />
            Projects ({filteredProjects.length})
          </h2>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
            <p className="text-gray-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Enrollment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Supervisor</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Defense Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {project.leaderId?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.leaderId?.enrollment || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.supervisorId?.name || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.defenseDate ? new Date(project.defenseDate).toLocaleDateString() : 'Not Scheduled'}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`http://localhost:5000/${project.documentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all inline-flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// SCHEDULE DEFENSE COMPONENT
// ============================================
export const ScheduleDefense = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [defenseDate, setDefenseDate] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDefensePendingProjects();
  }, []);

  const fetchDefensePendingProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/projects/defense-pending');
      const data = await response.json();
      console.log('Defense pending projects:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleDefense = async () => {
    if (!defenseDate) {
      alert('Please select a defense date!');
      return;
    }

    if (!window.confirm('Are you sure you want to schedule this defense?')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`http://localhost:5000/api/projects/assign-defense/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: defenseDate }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Defense scheduled successfully!');
        setSelectedProject(null);
        setDefenseDate('');
        fetchDefensePendingProjects();
      } else {
        alert(data.message || 'Failed to schedule defense');
      }
    } catch (error) {
      console.error('Error scheduling defense:', error);
      alert('Server error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved - Ready for Defense': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Scheduled for Defense': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Defense Changes Required': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Schedule Defense
        </h1>
        <p className="text-gray-400 mt-2">Schedule defense dates for approved projects</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={fetchDefensePendingProjects}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Projects Table */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-400" />
            Projects Ready for Defense ({projects.length})
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Ready</h3>
            <p className="text-gray-400">Projects will appear here after supervisor approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Enrollment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Supervisor</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Defense Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {projects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {project.leaderId?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.leaderId?.enrollment || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.supervisorId?.name || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.defenseDate ? new Date(project.defenseDate).toLocaleDateString() : 'Not Scheduled'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedProject(project)}
                        disabled={project.status === 'Scheduled for Defense'}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {project.status === 'Scheduled for Defense' ? '✅ Scheduled' : '📅 Schedule'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">Schedule Defense</h2>
                  <p className="text-gray-400 mt-1">
                    Student: {selectedProject.leaderId?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setDefenseDate('');
                  }}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Info */}
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Project Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Student:</span>
                    <div className="font-medium text-white mt-1">{selectedProject.leaderId?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Enrollment:</span>
                    <div className="font-medium text-white mt-1">{selectedProject.leaderId?.enrollment}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Supervisor:</span>
                    <div className="font-medium text-white mt-1">{selectedProject.supervisorId?.name || 'Not Assigned'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="font-medium text-white mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedProject.status)}`}>
                        {selectedProject.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block font-semibold text-white mb-2">
                  Select Defense Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={defenseDate}
                  onChange={(e) => setDefenseDate(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleScheduleDefense}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  ✅ Schedule Defense
                </button>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setDefenseDate('');
                  }}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
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

export default FypCoordinator;