import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';



const BoardDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('initial-defense');
  const [initialDefenseProjects, setInitialDefenseProjects] = useState([]);
  const [srsSdsProjects, setSrsSdsProjects] = useState([]);
  const [finalDefenseProjects, setFinalDefenseProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [marks, setMarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Check authentication
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'board') {
      navigate('/');
      alert('Please login as Panel Member first');
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [initialRes, srsSdsRes, finalRes] = await Promise.all([
        fetch('${process.env.REACT_APP_API_URL}/api/projects/initial-defense-projects'),
        fetch('${process.env.REACT_APP_API_URL}/api/projects/srs-sds-evaluation-projects'),
        fetch('${process.env.REACT_APP_API_URL}/api/projects/evaluation-list/final')
      ]);

      if (initialRes.ok) setInitialDefenseProjects(await initialRes.json());
      if (srsSdsRes.ok) setSrsSdsProjects(await srsSdsRes.json());
      if (finalRes.ok) setFinalDefenseProjects(await finalRes.json());

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const getFileUrl = (path) => {
    if (!path) return '#';
    const cleanPath = path.replace(/\\/g, '/');
    return `${process.env.REACT_APP_API_URL}/${cleanPath}`;
  };

  // --- SUBMIT HANDLERS ---
  const handleSubmitInitialDefenseEvaluation = async (status) => {
    if (!selectedProject) return;
    if (status === 'Defense Cleared' && (!marks || marks < 0 || marks > 5)) return alert('Enter valid marks (0-5)');
    
    try {
      setProcessing(true);
      const submitData = { role: 'panel', feedback: feedback || undefined, marks: parseFloat(marks) };
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/submit-initial-defense-marks/${selectedProject._id}`, {
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/submit-srs-sds-marks/${selectedProject._id}`, {
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

  const handleSubmitFinalDefenseEvaluation = async () => {
      if (!marks || marks < 0 || marks > 30) return alert('Enter valid marks (0-30)');
      try {
          setProcessing(true);
          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/submit-final-marks/${selectedProject._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'panel', marks: parseFloat(marks) })
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
      <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-red-500/30 transition-all hover:shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{project.leaderId?.name}</h2>
            <p className="text-sm text-white/60">{project.leaderId?.enrollment}</p>
            <p className="text-sm text-white/80 mt-2 truncate">{project.projectTitle}</p>
          </div>
          {isEvaluated ? (
            <span className="bg-green-900/30 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30">
              ✅ Evaluated
            </span>
          ) : (
            <span className="bg-yellow-900/30 text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30">
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
        
        <button 
          onClick={() => { 
            setSelectedProject({...project, evaluationType: 'initial-defense'}); 
            setMarks(isEvaluated ? project.initialDefenseMarks.panel : ''); 
          }}
          disabled={isEvaluated}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            isEvaluated 
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
              : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25'
          } flex items-center justify-center gap-2`}
        >
          {isEvaluated ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Graded: {project.initialDefenseMarks.panel}/5
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Grade Initial Defense (5%)
            </>
          )}
        </button>
      </div>
    );
  };

  const renderSrsSdsCard = (project) => {
    const isEvaluated = project.srsSdsReviewMarks?.panel !== null && project.srsSdsReviewMarks?.panel !== undefined;
    return (
      <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-purple-500/30 transition-all hover:shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{project.leaderId?.name}</h2>
            <p className="text-sm text-white/60">{project.leaderId?.enrollment}</p>
            <p className="text-sm text-white/80 mt-2 truncate">{project.projectTitle}</p>
          </div>
          {isEvaluated ? (
            <span className="bg-green-900/30 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30">
              ✅ Evaluated
            </span>
          ) : (
            <span className="bg-purple-900/30 text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-500/30">
              Pending
            </span>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          {project.srsUrl && (
            <a 
              href={getFileUrl(project.srsUrl)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View SDS
            </a>
          )}
        </div>
        
        <button 
          onClick={() => { 
            setSelectedProject({...project, evaluationType: 'srs-sds'}); 
            setMarks(isEvaluated ? project.srsSdsReviewMarks.panel : ''); 
          }}
          disabled={isEvaluated}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            isEvaluated 
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
          } flex items-center justify-center gap-2`}
        >
          {isEvaluated ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Graded: {project.srsSdsReviewMarks.panel}/5
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Grade Documentation (5%)
            </>
          )}
        </button>
      </div>
    );
  };

  const renderFinalDefenseCard = (project) => {
    const isEvaluated = project.finalDefense?.marks?.panel !== null && project.finalDefense?.marks?.panel !== undefined;
    return (
      <div key={project._id} className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all hover:shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{project.leaderId?.name}</h2>
            <p className="text-sm text-white/60">{project.leaderId?.enrollment}</p>
            <p className="text-sm text-white/80 mt-2 truncate">{project.projectTitle}</p>
          </div>
          {isEvaluated ? (
            <span className="bg-green-900/30 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30">
              ✅ Evaluated
            </span>
          ) : (
            <span className="bg-emerald-900/30 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/30">
              Pending
            </span>
          )}
        </div>

        {project.finalDefense?.scheduledDate && (
          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60">Defense Date</p>
                <p className="text-sm text-white font-medium">
                  {new Date(project.finalDefense.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}

        {project.finalDefense?.finalPptUrl ? (
          <a 
            href={getFileUrl(project.finalDefense.finalPptUrl)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full mb-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Final Presentation
          </a>
        ) : (
          <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg text-center">
            <p className="text-white/60">Final presentation pending</p>
          </div>
        )}

        <button 
          onClick={() => { 
            setSelectedProject({...project, evaluationType: 'final-defense'}); 
            setMarks(isEvaluated ? project.finalDefense.marks.panel : ''); 
          }}
          disabled={isEvaluated || !project.finalDefense?.finalPptUrl}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            isEvaluated 
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
              : project.finalDefense?.finalPptUrl
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                : 'bg-gray-600 text-white/50 cursor-not-allowed'
          } flex items-center justify-center gap-2`}
        >
          {isEvaluated ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Graded: {project.finalDefense.marks.panel}/30
            </>
          ) : project.finalDefense?.finalPptUrl ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Grade Final Defense (30%)
            </>
          ) : (
            'Awaiting Presentation'
          )}
        </button>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="col-span-full bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
      <div className="text-6xl mb-6">📂</div>
      <h3 className="text-xl font-bold text-white mb-2">No Projects Available</h3>
      <p className="text-white/60 mb-6">Waiting for projects to reach this evaluation stage.</p>
      <button 
        onClick={fetchData}
        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all flex items-center gap-2 mx-auto"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a2342] via-[#1a365d] to-[#0a2342] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading evaluation projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2342] via-[#1a365d] to-[#0a2342] text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
              <div className="text-center">
                <div className="text-[9px] font-bold text-[#0a2342] leading-tight">BU</div>
                <div className="text-[7px] font-bold text-[#0a2342] leading-tight">FYP</div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Panel Member Dashboard</h1>
              <p className="text-sm text-white/70">Project Evaluation Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
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
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('initial-defense')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'initial-defense' 
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25' 
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Initial Defense (5%)
          </button>
          <button 
            onClick={() => setActiveTab('srs-sds-evaluation')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'srs-sds-evaluation' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25' 
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            SRS/SDS (5%)
          </button>
          <button 
            onClick={() => setActiveTab('final-defense')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'final-defense' 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25' 
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Final Defense (30%)
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'initial-defense' && (
            initialDefenseProjects.length === 0 
              ? renderEmptyState() 
              : initialDefenseProjects.map(renderInitialDefenseCard)
          )}
          
          {activeTab === 'srs-sds-evaluation' && (
            srsSdsProjects.length === 0 
              ? renderEmptyState() 
              : srsSdsProjects.map(renderSrsSdsCard)
          )}
          
          {activeTab === 'final-defense' && (
            finalDefenseProjects.length === 0 
              ? renderEmptyState() 
              : finalDefenseProjects.map(renderFinalDefenseCard)
          )}
        </div>
      </main>

      {/* Evaluation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            {/* Close Button */}
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedProject.evaluationType === 'final-defense' ? 'bg-gradient-to-br from-emerald-900 to-emerald-800' :
                selectedProject.evaluationType === 'initial-defense' ? 'bg-gradient-to-br from-red-900 to-red-800' :
                'bg-gradient-to-br from-purple-900 to-purple-800'
              }`}>
                <span className="text-2xl">
                  {selectedProject.evaluationType === 'final-defense' ? '🏆' :
                   selectedProject.evaluationType === 'initial-defense' ? '🎤' : '📋'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedProject.evaluationType === 'final-defense' ? 'Final Defense Evaluation' : 
                   selectedProject.evaluationType === 'initial-defense' ? 'Initial Defense Evaluation' : 
                   'SRS/SDS Documentation Evaluation'}
                </h2>
                <p className="text-sm text-white/60">{selectedProject.leaderId?.name}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Marks ({selectedProject.evaluationType === 'final-defense' ? '0-30' : '0-5'})
                </label>
                <input 
                  type="number" 
                  value={marks} 
                  onChange={e => setMarks(e.target.value)} 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={`Enter marks (${selectedProject.evaluationType === 'final-defense' ? '30 max' : '5 max'})`}
                  min="0"
                  max={selectedProject.evaluationType === 'final-defense' ? '30' : '5'}
                  step="0.5"
                />
              </div>

              {selectedProject.evaluationType !== 'final-defense' && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Feedback</label>
                  <textarea 
                    value={feedback} 
                    onChange={e => setFeedback(e.target.value)} 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows="4"
                    placeholder="Provide constructive feedback..."
                  ></textarea>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={
                    selectedProject.evaluationType === 'final-defense' 
                      ? handleSubmitFinalDefenseEvaluation 
                      : selectedProject.evaluationType === 'initial-defense' 
                      ? () => handleSubmitInitialDefenseEvaluation('Defense Cleared') 
                      : handleSubmitSrsSdsEvaluation
                  }
                  disabled={processing}
                  className={`py-3 px-4 rounded-lg font-medium transition-all hover:shadow-lg ${
                    selectedProject.evaluationType === 'final-defense' 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white hover:shadow-emerald-500/25' 
                      : selectedProject.evaluationType === 'initial-defense' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-red-500/25'
                      : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white hover:shadow-purple-500/25'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
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
                <button 
                  onClick={resetForm}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg transition-all"
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

export default BoardDashboard;