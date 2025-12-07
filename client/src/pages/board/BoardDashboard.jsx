import React, { useState, useEffect } from 'react';

const BoardDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState("");

  // 1. Fetch Defense Projects
  useEffect(() => {
    fetchDefenseProjects();
  }, []);

  const fetchDefenseProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects/defense-pending');
      const data = await response.json();
      setProjects(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };

  // 2. Handle Decision (Approve or Changes)
  const submitDecision = async (status) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/projects/defense-decision/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: status,
          feedback: feedback // Send feedback text if requesting changes
        }),
      });

      if (response.ok) {
        alert("Decision Recorded Successfully!");
        setFeedback("");
        setSelectedProject(null); // Close modal
        fetchDefenseProjects(); // Refresh list
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">
        FYP Board Portal (Panel)
      </h1>

      {loading ? (
        <p className="text-center text-gray-400">Loading Defense Schedules...</p>
      ) : projects.length === 0 ? (
        <div className="text-center p-10 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-gray-400">No presentations scheduled for review yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:border-red-500/50 transition">
              
              {/* Student Info */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">{project.leaderId?.name}</h2>
                <p className="text-sm text-gray-400">{project.leaderId?.enrollment}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-gray-700 rounded-full text-xs text-yellow-400 border border-yellow-400/30">
                  {project.status}
                </div>
              </div>

              {/* Defense Details */}
              <div className="mb-6 space-y-2">
                <p className="text-sm text-gray-300">
                  📅 <span className="font-semibold">Date:</span> {new Date(project.defenseDate).toDateString()}
                </p>
                {project.presentationUrl ? (
                   <a 
                     href={`http://localhost:5000/${project.presentationUrl}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition"
                   >
                     📥 View Presentation (PPT)
                   </a>
                ) : (
                   <div className="text-center py-2 bg-gray-700 rounded text-sm text-gray-400 italic">
                     No PPT Uploaded yet
                   </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedProject(project); setFeedback(""); }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition"
                >
                  Grade / Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- DECISION MODAL --- */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md border border-gray-600">
            <h3 className="text-xl font-bold mb-4">Review: {selectedProject.leaderId?.name}</h3>
            
            <label className="block text-sm text-gray-400 mb-2">Feedback / Instructions (Required for Changes)</label>
            <textarea 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white mb-6 focus:border-red-500 outline-none"
              rows="4"
              placeholder="Enter feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>

            <div className="flex gap-3 flex-col">
              <button 
                onClick={() => submitDecision('Defense Cleared')}
                className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold"
              >
                ✅ Approve (Clear Defense)
              </button>
              
              <button 
                onClick={() => submitDecision('Defense Changes Required')}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold"
              >
                ⚠️ Request Changes (Resubmit)
              </button>

              <button 
                onClick={() => setSelectedProject(null)}
                className="w-full py-2 bg-transparent text-gray-400 hover:text-white mt-2"
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