import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  Award, 
  User 
} from 'lucide-react';

const ExternalExaminerDashboard = () => {
  const navigate = useNavigate();
  const [examiner, setExaminer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Grading State
  const [selectedProject, setSelectedProject] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    // Auth Check
    if (!userInfo || userInfo.role !== 'external') {
      navigate('/');
      return;
    }
    
    setExaminer(userInfo);
    fetchProjects();
  }, [navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch projects ready for final defense evaluation
      const response = await fetch('${process.env.REACT_APP_API_URL}/api/projects/external-pending');
      const data = await response.json();
      console.log('External examiner projects:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER: Fix Windows File Paths ---
  const getFileUrl = (path) => {
    if (!path) return '#';
    // Replace backslashes with forward slashes for URL compatibility
    const cleanPath = path.replace(/\\/g, '/');
    return `${process.env.REACT_APP_API_URL}/${cleanPath}`;
  };

  const handleSubmitGrade = async () => {
    if (!marks || marks < 0 || marks > 30) {
      alert('Please enter valid marks between 0 and 30.');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/submit-final-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: 'external', 
          marks: parseFloat(marks),
          feedback: feedback || undefined
        }),
      });

      if (response.ok) {
        alert('✅ Grade submitted successfully!');
        setSelectedProject(null);
        setMarks('');
        setFeedback('');
        fetchProjects(); // Refresh list
      } else {
        alert('Failed to submit grade.');
      }
    } catch (error) {
      console.error('Error submitting grade:', error);
      alert('Server error.');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Calculate Stats
  const pendingCount = projects.filter(p => !p.finalDefense?.marks?.external).length;
  const completedCount = projects.filter(p => p.finalDefense?.marks?.external).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-sans">
      
      {/* --- HEADER --- */}
      <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                External Examiner
              </h1>
              <p className="text-xs text-gray-400">Final Year Project Evaluation Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="font-semibold text-sm">{examiner?.name}</p>
              <p className="text-xs text-gray-400">External Examiner</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="container mx-auto px-6 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Pending Evaluations</h3>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">{pendingCount}</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Completed Evaluations</h3>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">{completedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="text-lg font-bold mb-2">Welcome Back!</h3>
            <p className="text-sm opacity-90">
              Please download the student presentations below and evaluate them based on the 30% Final Defense weightage criteria.
            </p>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Assigned Projects ({projects.length})
            </h2>
            <button 
              onClick={fetchProjects} 
              className="text-sm text-purple-400 hover:text-purple-300 underline"
            >
              Refresh List
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-4">📂</div>
              <p>No projects assigned for Final Defense yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="p-5 font-semibold">Student</th>
                    <th className="p-5 font-semibold">Project Title</th>
                    <th className="p-5 font-semibold">Presentation</th>
                    <th className="p-5 font-semibold">Status</th>
                    <th className="p-5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {projects.map((project) => {
                    const isGraded = project.finalDefense?.marks?.external !== undefined && project.finalDefense?.marks?.external !== null;
                    
                    return (
                      <tr key={project._id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-purple-400 font-bold">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{project.leaderId?.name}</p>
                              <p className="text-xs text-gray-400">{project.leaderId?.enrollment}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="text-gray-300 font-medium">Final Year Project</span>
                        </td>
                        <td className="p-5">
                          {project.finalDefense?.finalPptUrl ? (
                            <a 
                              href={getFileUrl(project.finalDefense.finalPptUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-500/20 transition-all text-sm font-medium"
                            >
                              <Download className="w-4 h-4" /> PPT
                            </a>
                          ) : (
                            <span className="text-gray-500 text-sm italic">Not uploaded</span>
                          )}
                        </td>
                        <td className="p-5">
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                              <CheckCircle className="w-3 h-3" /> Graded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          {isGraded ? (
                            <span className="text-xl font-bold text-white">
                              {project.finalDefense.marks.external}/30
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedProject(project)}
                              disabled={!project.finalDefense?.finalPptUrl}
                              className={`px-5 py-2 rounded-lg text-sm font-bold shadow-lg transition-all transform hover:scale-105 ${
                                !project.finalDefense?.finalPptUrl 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                              }`}
                            >
                              Grade Project
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* --- GRADING MODAL --- */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden transform transition-all scale-100">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-gray-900 p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Evaluate Project</h2>
              <p className="text-gray-400 text-sm mt-1">{selectedProject.leaderId?.name}</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Final Marks (Out of 30) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  value={marks} 
                  onChange={(e) => setMarks(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="0 - 30"
                  max="30"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Feedback (Optional)
                </label>
                <textarea 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Enter specific feedback for the student..."
                  rows="3"
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex gap-3 bg-gray-800/50">
              <button 
                onClick={() => { setSelectedProject(null); setMarks(''); setFeedback(''); }}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitGrade}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {processing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Submit Grade'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ExternalExaminerDashboard;