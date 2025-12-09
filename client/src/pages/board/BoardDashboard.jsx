import React, { useState, useEffect } from 'react';

const BoardDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [marks, setMarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInitialDefenseProjects();
  }, []);

  const fetchInitialDefenseProjects = async () => {
    try {
      setLoading(true);
      // Use the initial defense projects endpoint
      const response = await fetch('http://localhost:5000/api/projects/initial-defense-projects');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched initial defense projects for panel:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching defense projects:', error);
      alert('Failed to fetch projects. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvaluation = async (status) => {
    if (!selectedProject) return;

    // For evaluation - need marks
    if (status === 'Defense Cleared') {
      if (!marks || marks < 0 || marks > 5) {
        alert('Please enter valid marks between 0 and 5');
        return;
      }
    }

    // For "Defense Changes Required" - need feedback
    if (status === 'Defense Changes Required' && !feedback.trim()) {
      alert('Please provide feedback when requesting changes');
      return;
    }

    try {
      setProcessing(true);
      
      // Use the submit-initial-defense-marks endpoint
      const response = await fetch(`http://localhost:5000/api/projects/submit-initial-defense-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: 'panel', // Specify role as panel
          marks: status === 'Defense Cleared' ? parseFloat(marks) : undefined,
          feedback: feedback || undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (status === 'Defense Cleared') {
          alert('✅ Initial Defense Marks Submitted Successfully!');
          if (data.allMarksGiven) {
            alert('🎉 All evaluations received! Project moved to next phase.');
          }
        } else {
          alert('⚠️ Changes Requested. Student will resubmit.');
        }
        setFeedback("");
        setMarks('');
        setSelectedProject(null);
        fetchInitialDefenseProjects();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to submit marks");
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Server error');
    } finally {
      setProcessing(false);
    }
  };

  // Function to check if panel has already evaluated INITIAL defense
  const hasPanelEvaluated = (project) => {
    // Check for initial defense marks from panel
    if (project.initialDefenseMarks && 
        project.initialDefenseMarks.panel !== undefined && 
        project.initialDefenseMarks.panel !== null) {
      return true;
    }
    return false;
  };

  // Get panel marks for display
  const getPanelMarks = (project) => {
    if (project.initialDefenseMarks && project.initialDefenseMarks.panel !== undefined) {
      return project.initialDefenseMarks.panel;
    }
    return null;
  };

  // Calculate total initial defense marks
  const calculateTotalMarks = (project) => {
    const marks = project.initialDefenseMarks || {};
    const total = (marks.coordinator || 0) + 
                  (marks.supervisor || 0) + 
                  (marks.panel || 0);
    const percentage = (total / 15 * 100).toFixed(1);
    return { total, percentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
          Panel Member Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Evaluate Initial Defense Presentations (5% weightage each for Panel, Supervisor, Coordinator)</p>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchInitialDefenseProjects}
        className="mb-6 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl hover:from-red-600 hover:to-orange-700 transition-all shadow-lg"
      >
        🔄 Refresh List
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Initial Defense Presentations</h3>
          <p className="text-gray-400">Projects will appear here after defense scheduling and PPT upload.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const panelMarks = getPanelMarks(project);
            const isEvaluated = hasPanelEvaluated(project);
            const totalMarks = calculateTotalMarks(project);
            const initialMarks = project.initialDefenseMarks || {};
            
            return (
              <div key={project._id} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl hover:border-red-500/50 transition-all">
                
                {/* Student Info */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">{project.leaderId?.name}</h2>
                  <p className="text-sm text-gray-400">{project.leaderId?.enrollment}</p>
                  <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    project.status === 'Scheduled for Defense' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                    project.status === 'Defense Changes Required' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                    project.status === 'Defense Cleared' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}>
                    {project.status}
                  </div>
                </div>

                {/* Defense Details */}
                <div className="mb-6 space-y-3">
                  <p className="text-sm text-gray-300">
                    📅 <span className="font-semibold">Scheduled:</span> {project.defenseDate ? new Date(project.defenseDate).toLocaleDateString() : 'Not set'}
                  </p>
                  
                  {/* Marks Status */}
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-400 mb-2">Initial Defense Marks Status:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Coordinator:</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          initialMarks.coordinator !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {initialMarks.coordinator !== null ? `${initialMarks.coordinator}/5` : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Supervisor:</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          initialMarks.supervisor !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {initialMarks.supervisor !== null ? `${initialMarks.supervisor}/5` : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Your Marks:</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          isEvaluated ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {isEvaluated ? `${panelMarks}/5` : 'Pending'}
                        </span>
                      </div>
                      {isEvaluated && (
                        <div className="pt-2 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Total:</span>
                            <span className="text-white font-bold text-sm">
                              {totalMarks.total}/15 ({totalMarks.percentage}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PPT Download Button */}
                  {project.presentationUrl ? (
                    <a 
                      href={`http://localhost:5000/${project.presentationUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full text-center py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-sm font-semibold transition-all"
                    >
                      📥 Download Presentation (PPT)
                    </a>
                  ) : (
                    <div className="text-center py-2.5 bg-gray-700 rounded-lg text-sm text-gray-400 italic">
                      No PPT Uploaded
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => { 
                    setSelectedProject(project); 
                    setFeedback(""); 
                    setMarks(isEvaluated ? panelMarks.toString() : ''); 
                  }}
                  disabled={isEvaluated || project.initialDefenseCompleted}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    isEvaluated || project.initialDefenseCompleted ? 
                    'bg-gray-700 text-gray-400 cursor-not-allowed' : 
                    'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700'
                  }`}
                >
                  {isEvaluated ? '✅ Already Evaluated' : 
                   project.initialDefenseCompleted ? '✅ All Evaluations Complete' : 
                   '📝 Evaluate Initial Defense'}
                </button>
                
                {/* Show previous feedback if evaluated */}
                {isEvaluated && project.initialDefenseMarks?.feedback && (
                  <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Your feedback:</p>
                    <p className="text-sm text-gray-300">{project.initialDefenseMarks.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
                    setFeedback('');
                    setMarks('');
                  }}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Details */}
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Evaluation Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Student:</span>
                    <div className="font-medium text-white">{selectedProject.leaderId?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Your Role:</span>
                    <div className="font-medium text-red-400">Panel Member (5% weight)</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Defense Date:</span>
                    <div className="font-medium text-white">
                      {selectedProject.defenseDate ? new Date(selectedProject.defenseDate).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">PPT:</span>
                    <a
                      href={`http://localhost:5000/${selectedProject.presentationUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline block"
                    >
                      📥 Download Presentation
                    </a>
                  </div>
                </div>
              </div>

              {/* Grading Section */}
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
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Enter marks out of 5"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Grading Rubric: 5=Excellent, 4=Good, 3=Satisfactory, 2=Needs Improvement, 1=Poor, 0=Failed
                </p>
              </div>

              {/* Feedback Section */}
              <div>
                <label className="block font-semibold text-white mb-2">
                  Feedback / Comments (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-red-500"
                  rows="4"
                  placeholder="Provide feedback on presentation skills, content, delivery, technical aspects..."
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => handleSubmitEvaluation('Defense Cleared')}
                  disabled={processing || !marks || marks < 0 || marks > 5}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {processing ? 'Submitting...' : '✅ Submit Marks & Clear Defense'}
                </button>
                
                <button
                  onClick={() => handleSubmitEvaluation('Defense Changes Required')}
                  disabled={processing || !feedback.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {processing ? 'Processing...' : '⚠️ Request Changes'}
                </button>
              </div>
              
              {/* Cancel Button */}
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setFeedback('');
                  setMarks('');
                }}
                disabled={processing}
                className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDashboard;