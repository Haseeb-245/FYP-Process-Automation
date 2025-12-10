import React, { useState, useEffect } from 'react';

const BoardDashboard = () => {
  const [activeTab, setActiveTab] = useState('initial-defense'); // 'initial-defense', 'srs-sds-evaluation', 'final-defense'
  const [initialDefenseProjects, setInitialDefenseProjects] = useState([]);
  const [srsSdsProjects, setSrsSdsProjects] = useState([]);
  const [finalDefenseProjects, setFinalDefenseProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [marks, setMarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setDebugInfo('Fetching data from backend...');
      
      const [initialRes, srsSdsRes, finalRes] = await Promise.all([
        fetch('http://localhost:5000/api/projects/initial-defense-projects'),
        fetch('http://localhost:5000/api/projects/srs-sds-evaluation-projects'),
        fetch('http://localhost:5000/api/projects/evaluation-list/final')
      ]);

      if (initialRes.ok) setInitialDefenseProjects(await initialRes.json());
      if (srsSdsRes.ok) setSrsSdsProjects(await srsSdsRes.json());
      if (finalRes.ok) setFinalDefenseProjects(await finalRes.json());

    } catch (error) {
      console.error('Error fetching projects:', error);
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBackendEndpoints = async () => {
      fetchData();
  };

  // --- HELPER: Fix Windows File Paths ---
  const getFileUrl = (path) => {
    if (!path) return '#';
    // Replace backslashes with forward slashes for URL compatibility
    const cleanPath = path.replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };

  // --- SUBMIT HANDLERS ---

  const handleSubmitInitialDefenseEvaluation = async (status) => {
    if (!selectedProject) return;
    if (status === 'Defense Cleared' && (!marks || marks < 0 || marks > 5)) return alert('Enter valid marks (0-5)');
    
    try {
      setProcessing(true);
      const submitData = { role: 'panel', feedback: feedback || undefined, marks: parseFloat(marks) };
      const res = await fetch(`http://localhost:5000/api/projects/submit-initial-defense-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      if (res.ok) {
        alert('✅ Initial Defense Submitted!');
        resetForm();
        fetchData();
      }
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  const handleSubmitSrsSdsEvaluation = async () => {
    if (!marks || marks < 0 || marks > 5) return alert('Enter valid marks (0-5)');
    try {
      setProcessing(true);
      const res = await fetch(`http://localhost:5000/api/projects/submit-srs-sds-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'panel', marks: parseFloat(marks), feedback }),
      });
      if (res.ok) {
        alert('✅ SRS/SDS Evaluation Submitted!');
        resetForm();
        fetchData();
      }
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  // Final Defense Submission
  const handleSubmitFinalDefenseEvaluation = async () => {
      if (!marks || marks < 0 || marks > 30) return alert('Enter valid marks (0-30)');
      try {
          setProcessing(true);
          const res = await fetch(`http://localhost:5000/api/projects/submit-final-marks/${selectedProject._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'panel', marks: parseFloat(marks) }) // 30% weight
          });
          if(res.ok) {
              alert('✅ Final Defense Grade Submitted!');
              resetForm();
              fetchData();
          }
      } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  const resetForm = () => {
    setFeedback("");
    setMarks('');
    setSelectedProject(null);
  };

  // --- RENDER HELPERS ---

  const renderInitialDefenseCard = (project) => {
    const isEvaluated = project.initialDefenseMarks?.panel !== null && project.initialDefenseMarks?.panel !== undefined;
    return (
      <div key={project._id} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2">{project.leaderId?.name}</h2>
        <p className="text-sm text-gray-400 mb-4">{project.leaderId?.enrollment}</p>
        
        {project.presentationUrl ? (
            <a 
              href={getFileUrl(project.presentationUrl)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-blue-600 rounded mb-4 text-sm font-bold hover:bg-blue-700"
            >
              📥 Download PPT
            </a>
        ) : <p className="text-sm text-yellow-500 mb-4">No PPT Uploaded</p>}
        
        <button 
            onClick={() => { setSelectedProject({...project, evaluationType: 'initial-defense'}); setMarks(isEvaluated ? project.initialDefenseMarks.panel : ''); }}
            disabled={isEvaluated}
            className={`w-full py-2 rounded font-bold ${isEvaluated ? 'bg-green-900 text-green-300' : 'bg-red-600 hover:bg-red-700'}`}
        >
            {isEvaluated ? `✅ Graded: ${project.initialDefenseMarks.panel}/5` : '📝 Grade (5%)'}
        </button>
      </div>
    );
  };

  const renderSrsSdsCard = (project) => {
    const isEvaluated = project.srsSdsReviewMarks?.panel !== null && project.srsSdsReviewMarks?.panel !== undefined;
    return (
      <div key={project._id} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2">{project.leaderId?.name}</h2>
        <div className="flex gap-2 mb-4">
            {project.srsUrl && (
              <a 
                href={getFileUrl(project.srsUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 text-xs underline"
              >
                View SRS
              </a>
            )}
            {project.sdsUrl && (
              <a 
                href={getFileUrl(project.sdsUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 text-xs underline"
              >
                View SDS
              </a>
            )}
        </div>
        <button 
            onClick={() => { setSelectedProject({...project, evaluationType: 'srs-sds'}); setMarks(isEvaluated ? project.srsSdsReviewMarks.panel : ''); }}
            disabled={isEvaluated}
            className={`w-full py-2 rounded font-bold ${isEvaluated ? 'bg-green-900 text-green-300' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
            {isEvaluated ? `✅ Graded: ${project.srsSdsReviewMarks.panel}/5` : '📝 Grade (5%)'}
        </button>
      </div>
    );
  };

  // Render Final Defense Card
  const renderFinalDefenseCard = (project) => {
      const isEvaluated = project.finalDefense?.marks?.panel !== null && project.finalDefense?.marks?.panel !== undefined;
      return (
        <div key={project._id} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl hover:border-green-500/50">
          <h2 className="text-xl font-bold text-white mb-1">{project.leaderId?.name}</h2>
          <p className="text-xs text-gray-400 mb-4">Date: {project.finalDefense?.scheduledDate ? new Date(project.finalDefense.scheduledDate).toDateString() : 'TBA'}</p>
          
          {project.finalDefense?.finalPptUrl ? (
              <a 
                href={getFileUrl(project.finalDefense.finalPptUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center py-2 bg-blue-600 rounded mb-4 text-sm font-bold hover:bg-blue-700"
              >
                📥 Final PPT
              </a>
          ) : <p className="text-sm text-yellow-500 mb-4 text-center">PPT Pending</p>}

          <button 
              onClick={() => { setSelectedProject({...project, evaluationType: 'final-defense'}); setMarks(isEvaluated ? project.finalDefense.marks.panel : ''); }}
              disabled={isEvaluated || !project.finalDefense?.finalPptUrl}
              className={`w-full py-2 rounded font-bold ${isEvaluated ? 'bg-green-900 text-green-300' : 'bg-green-600 hover:bg-green-700'}`}
          >
              {isEvaluated ? `✅ Graded: ${project.finalDefense.marks.panel}/30` : '🏆 Grade (30%)'}
          </button>
        </div>
      );
  };

  const renderEmptyState = (type) => (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl p-12 text-center">
      <div className="text-6xl mb-4">📂</div>
      <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
      <p className="text-gray-400">Waiting for projects to reach this stage.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">Panel Member Dashboard</h1>
        <p className="text-gray-400 mt-2">Evaluate Student Projects</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button onClick={() => setActiveTab('initial-defense')} className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'initial-defense' ? 'bg-red-600' : 'bg-gray-700'}`}>🎤 Initial (5%)</button>
        <button onClick={() => setActiveTab('srs-sds-evaluation')} className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'srs-sds-evaluation' ? 'bg-purple-600' : 'bg-gray-700'}`}>📋 SRS/SDS (5%)</button>
        <button onClick={() => setActiveTab('final-defense')} className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'final-defense' ? 'bg-green-600' : 'bg-gray-700'}`}>🏆 Final (30%)</button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : (
        <>
            {activeTab === 'initial-defense' && (
                initialDefenseProjects.length === 0 ? renderEmptyState() : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{initialDefenseProjects.map(renderInitialDefenseCard)}</div>
            )}
            {activeTab === 'srs-sds-evaluation' && (
                srsSdsProjects.length === 0 ? renderEmptyState() : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{srsSdsProjects.map(renderSrsSdsCard)}</div>
            )}
            {activeTab === 'final-defense' && (
                finalDefenseProjects.length === 0 ? renderEmptyState() : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{finalDefenseProjects.map(renderFinalDefenseCard)}</div>
            )}
        </>
      )}

      {/* Evaluation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-1">
                {selectedProject.evaluationType === 'final-defense' ? 'Final Defense Grade' : 
                 selectedProject.evaluationType === 'initial-defense' ? 'Initial Defense Grade' : 'SRS/SDS Grade'}
            </h2>
            <p className="text-gray-400 mb-6">{selectedProject.leaderId?.name}</p>

            <label className="block mb-2 font-bold">Marks</label>
            <input 
                type="number" 
                value={marks} 
                onChange={e => setMarks(e.target.value)} 
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded mb-1 text-white"
                placeholder={selectedProject.evaluationType === 'final-defense' ? "Out of 30" : "Out of 5"}
            />
            <p className="text-xs text-gray-500 mb-4">
                Max Marks: {selectedProject.evaluationType === 'final-defense' ? '30' : '5'}
            </p>

            {selectedProject.evaluationType !== 'final-defense' && (
                <>
                    <label className="block mb-2 font-bold">Feedback</label>
                    <textarea 
                        value={feedback} 
                        onChange={e => setFeedback(e.target.value)} 
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded mb-4 text-white"
                        rows="3"
                    ></textarea>
                </>
            )}

            <div className="flex gap-3">
                <button 
                    onClick={
                        selectedProject.evaluationType === 'final-defense' ? handleSubmitFinalDefenseEvaluation :
                        selectedProject.evaluationType === 'initial-defense' ? () => handleSubmitInitialDefenseEvaluation('Defense Cleared') :
                        handleSubmitSrsSdsEvaluation
                    }
                    disabled={processing}
                    className="flex-1 bg-green-600 py-2 rounded font-bold hover:bg-green-700"
                >
                    Submit
                </button>
                <button onClick={resetForm} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDashboard;