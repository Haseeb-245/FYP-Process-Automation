import React, { useState, useEffect } from 'react';

const BoardDashboard = () => {
  const [activeTab, setActiveTab] = useState('initial-defense'); // 'initial-defense', 'srs-sds-evaluation'
  const [initialDefenseProjects, setInitialDefenseProjects] = useState([]);
  const [srsSdsProjects, setSrsSdsProjects] = useState([]);
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
      console.log('Fetching data from backend...');
      
      // Fetch both initial defense and SRS/SDS projects in parallel
      const [initialResponse, srsSdsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/projects/initial-defense-projects'),
        fetch('http://localhost:5000/api/projects/srs-sds-evaluation-projects')
      ]);

      console.log('Initial Defense Response Status:', initialResponse.status);
      console.log('SRS/SDS Response Status:', srsSdsResponse.status);

      if (!initialResponse.ok) {
        const errorText = await initialResponse.text();
        console.error('Initial Defense API Error:', errorText);
        setDebugInfo(`Initial Defense API Error: ${initialResponse.status} - ${errorText}`);
        throw new Error(`Failed to fetch initial defense projects: ${initialResponse.status} ${initialResponse.statusText}`);
      }
      
      if (!srsSdsResponse.ok) {
        const errorText = await srsSdsResponse.text();
        console.error('SRS/SDS API Error:', errorText);
        setDebugInfo(`SRS/SDS API Error: ${srsSdsResponse.status} - ${errorText}`);
        throw new Error(`Failed to fetch SRS/SDS projects: ${srsSdsResponse.status} ${srsSdsResponse.statusText}`);
      }

      const initialData = await initialResponse.json();
      const srsSdsData = await srsSdsResponse.json();

      console.log('Initial Defense Projects Data:', initialData);
      console.log('SRS/SDS Projects Data:', srsSdsData);
      
      console.log('Number of Initial Defense Projects:', initialData.length);
      console.log('Number of SRS/SDS Projects:', srsSdsData.length);
      
      // Log first project structure for debugging
      if (initialData.length > 0) {
        console.log('Sample Initial Defense Project:', {
          id: initialData[0]._id,
          studentName: initialData[0].leaderId?.name,
          status: initialData[0].status,
          initialDefenseMarks: initialData[0].initialDefenseMarks,
          presentationUrl: initialData[0].presentationUrl,
          initialDefenseCompleted: initialData[0].initialDefenseCompleted
        });
      } else {
        console.log('No initial defense projects found');
      }
      
      if (srsSdsData.length > 0) {
        console.log('Sample SRS/SDS Project:', {
          id: srsSdsData[0]._id,
          studentName: srsSdsData[0].leaderId?.name,
          srsSdsStatus: srsSdsData[0].srsSdsStatus,
          srsSdsReviewMarks: srsSdsData[0].srsSdsReviewMarks,
          srsUrl: srsSdsData[0].srsUrl,
          sdsUrl: srsSdsData[0].sdsUrl,
          srsSdsReviewCompleted: srsSdsData[0].srsSdsReviewCompleted
        });
      } else {
        console.log('No SRS/SDS projects found');
      }

      setInitialDefenseProjects(initialData);
      setSrsSdsProjects(srsSdsData);
      setDebugInfo(`Loaded ${initialData.length} initial defense projects and ${srsSdsData.length} SRS/SDS projects`);
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('Error details:', error.message, error.stack);
      setDebugInfo(`Error: ${error.message}`);
      alert(`Failed to fetch projects: ${error.message}\n\nPlease check if backend is running and try refreshing.`);
    } finally {
      setLoading(false);
    }
  };

  const testBackendEndpoints = async () => {
    try {
      setDebugInfo('Testing backend endpoints...');
      console.log('Testing backend endpoints...');
      
      // Test initial defense endpoint
      console.log('Testing /api/projects/initial-defense-projects');
      const initialTest = await fetch('http://localhost:5000/api/projects/initial-defense-projects');
      console.log('Initial Defense Test Status:', initialTest.status);
      if (initialTest.ok) {
        const data = await initialTest.json();
        console.log('Initial Defense Test Data:', data);
        setDebugInfo(prev => prev + `\nInitial Defense OK: ${data.length} projects`);
      } else {
        const error = await initialTest.text();
        console.error('Initial Defense Test Error:', error);
        setDebugInfo(prev => prev + `\nInitial Defense Error: ${initialTest.status} - ${error}`);
      }
      
      // Test SRS/SDS endpoint
      console.log('Testing /api/projects/srs-sds-evaluation-projects');
      const srsSdsTest = await fetch('http://localhost:5000/api/projects/srs-sds-evaluation-projects');
      console.log('SRS/SDS Test Status:', srsSdsTest.status);
      if (srsSdsTest.ok) {
        const data = await srsSdsTest.json();
        console.log('SRS/SDS Test Data:', data);
        setDebugInfo(prev => prev + `\nSRS/SDS OK: ${data.length} projects`);
      } else {
        const error = await srsSdsTest.text();
        console.error('SRS/SDS Test Error:', error);
        setDebugInfo(prev => prev + `\nSRS/SDS Error: ${srsSdsTest.status} - ${error}`);
      }
      
      // Test submit endpoint
      console.log('Testing submit endpoint with dummy data');
      const testSubmit = await fetch('http://localhost:5000/api/projects/submit-srs-sds-marks/test-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'panel', marks: 4 })
      });
      console.log('Submit Test Status:', testSubmit.status);
      setDebugInfo(prev => prev + `\nSubmit Test Status: ${testSubmit.status}`);
      
    } catch (error) {
      console.error('Backend test error:', error);
      setDebugInfo(prev => prev + `\nTest Error: ${error.message}`);
    }
  };

  // ============================
  // INITIAL DEFENSE EVALUATION
  // ============================

  const handleSubmitInitialDefenseEvaluation = async (status) => {
    if (!selectedProject) return;

    if (status === 'Defense Cleared') {
      if (!marks || marks < 0 || marks > 5) {
        alert('Please enter valid marks between 0 and 5');
        return;
      }
    }

    if (status === 'Defense Changes Required' && !feedback.trim()) {
      alert('Please provide feedback when requesting changes');
      return;
    }

    try {
      setProcessing(true);
      setDebugInfo('Submitting initial defense evaluation...');
      
      const submitData = { 
        role: 'panel',
        feedback: feedback || undefined
      };
      
      if (status === 'Defense Cleared') {
        submitData.marks = parseFloat(marks);
      }
      
      console.log('Submitting initial defense evaluation:', {
        projectId: selectedProject._id,
        status,
        data: submitData
      });
      
      const response = await fetch(`http://localhost:5000/api/projects/submit-initial-defense-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      console.log('Submission Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Submission Success:', data);
        
        if (status === 'Defense Cleared') {
          alert('✅ Initial Defense Marks Submitted Successfully!');
          if (data.allMarksGiven) {
            alert('🎉 All evaluations received! Project moved to next phase.');
          }
        } else {
          alert('⚠️ Changes Requested. Student will resubmit.');
        }
        setDebugInfo('Evaluation submitted successfully');
        resetForm();
        fetchData();
      } else {
        const errorData = await response.json();
        console.error('Submission Error:', errorData);
        setDebugInfo(`Submission failed: ${errorData.message || response.statusText}`);
        alert(errorData.message || `Failed to submit marks: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setDebugInfo(`Network error: ${error.message}`);
      alert('Server error - check console for details');
    } finally {
      setProcessing(false);
    }
  };

  // ============================
  // SRS/SDS EVALUATION
  // ============================

  const handleSubmitSrsSdsEvaluation = async () => {
    if (!selectedProject) return;

    if (!marks || marks < 0 || marks > 5) {
      alert('Please enter valid marks between 0 and 5');
      return;
    }

    try {
      setProcessing(true);
      setDebugInfo('Submitting SRS/SDS evaluation...');
      
      const submitData = { 
        role: 'panel',
        marks: parseFloat(marks),
        feedback: feedback || undefined
      };
      
      console.log('Submitting SRS/SDS evaluation:', {
        projectId: selectedProject._id,
        data: submitData
      });
      
      const response = await fetch(`http://localhost:5000/api/projects/submit-srs-sds-marks/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      console.log('SRS/SDS Submission Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('SRS/SDS Submission Success:', data);
        
        alert('✅ SRS/SDS Evaluation Submitted Successfully!');
        
        if (data.allMarksGiven) {
          alert('🎉 All SRS/SDS evaluations received! Project moved to Development Phase.');
        }
        
        setDebugInfo('SRS/SDS evaluation submitted successfully');
        resetForm();
        fetchData();
      } else {
        const errorText = await response.text();
        console.error('SRS/SDS Submission Error:', errorText);
        setDebugInfo(`SRS/SDS submission failed: ${response.status} - ${errorText}`);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(errorData.message || `Failed to submit SRS/SDS evaluation: ${response.status}`);
        } catch {
          alert(`Failed to submit SRS/SDS evaluation: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error submitting SRS/SDS evaluation:', error);
      console.error('Error stack:', error.stack);
      setDebugInfo(`Network error: ${error.message}`);
      alert(`Server error: ${error.message}\n\nCheck browser console for details.`);
    } finally {
      setProcessing(false);
    }
  };

  // ============================
  // HELPER FUNCTIONS
  // ============================

  const resetForm = () => {
    setFeedback("");
    setMarks('');
    setSelectedProject(null);
  };

  // Function to check if panel has already evaluated INITIAL defense
  const hasPanelEvaluatedInitialDefense = (project) => {
    return project.initialDefenseMarks && 
           project.initialDefenseMarks.panel !== undefined && 
           project.initialDefenseMarks.panel !== null;
  };

  // Function to check if panel has already evaluated SRS/SDS
  const hasPanelEvaluatedSrsSds = (project) => {
    return project.srsSdsReviewMarks && 
           project.srsSdsReviewMarks.panel !== undefined && 
           project.srsSdsReviewMarks.panel !== null;
  };

  // Calculate total initial defense marks
  const calculateInitialDefenseMarks = (project) => {
    const marks = project.initialDefenseMarks || {};
    const total = (marks.coordinator || 0) + 
                  (marks.supervisor || 0) + 
                  (marks.panel || 0);
    const percentage = (total / 15 * 100).toFixed(1);
    return { total, percentage };
  };

  // Calculate total SRS/SDS marks
  const calculateSrsSdsMarks = (project) => {
    const marks = project.srsSdsReviewMarks || {};
    const total = (marks.coordinator || 0) + 
                  (marks.supervisor || 0) + 
                  (marks.panel || 0);
    const percentage = (total / 15 * 100).toFixed(1);
    return { total, percentage };
  };

  // Render Initial Defense Project Card
  const renderInitialDefenseCard = (project) => {
    const isEvaluated = hasPanelEvaluatedInitialDefense(project);
    const panelMarks = isEvaluated ? project.initialDefenseMarks.panel : null;
    const totalMarks = calculateInitialDefenseMarks(project);
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
            setSelectedProject({...project, evaluationType: 'initial-defense'}); 
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
  };

  // Render SRS/SDS Project Card
  const renderSrsSdsCard = (project) => {
    const isEvaluated = hasPanelEvaluatedSrsSds(project);
    const panelMarks = isEvaluated ? project.srsSdsReviewMarks.panel : null;
    const totalMarks = calculateSrsSdsMarks(project);
    const srsSdsMarks = project.srsSdsReviewMarks || {};
    
    return (
      <div key={project._id} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl hover:border-purple-500/50 transition-all">
        
        {/* Student Info */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">{project.leaderId?.name}</h2>
          <p className="text-sm text-gray-400">{project.leaderId?.enrollment}</p>
          <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${
            project.srsSdsStatus === 'Approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
            project.srsSdsStatus === 'Rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
            project.srsSdsStatus === 'Changes Required' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
            project.srsSdsStatus === 'Under Review' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          }`}>
            {project.srsSdsStatus || 'Pending Review'}
          </div>
        </div>

        {/* Project Details */}
        <div className="mb-6 space-y-3">
          <p className="text-sm text-gray-300">
            📋 <span className="font-semibold">SRS/SDS Review</span>
          </p>
          
          {/* Documents */}
          <div className="space-y-2">
            {project.srsUrl && (
              <a 
                href={`http://localhost:5000/${project.srsUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-sm font-semibold transition-all"
              >
                📄 View SRS Document
              </a>
            )}
            {project.sdsUrl && (
              <a 
                href={`http://localhost:5000/${project.sdsUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-sm font-semibold transition-all"
              >
                📄 View SDS Document
              </a>
            )}
          </div>
          
          {/* Marks Status */}
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-gray-400 mb-2">SRS/SDS Review Marks Status (15% weight):</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Coordinator:</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  srsSdsMarks.coordinator !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {srsSdsMarks.coordinator !== null ? `${srsSdsMarks.coordinator}/5` : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Supervisor:</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  srsSdsMarks.supervisor !== null ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {srsSdsMarks.supervisor !== null ? `${srsSdsMarks.supervisor}/5` : 'Pending'}
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

          {/* Supervisor Feedback */}
          {project.supervisorFeedback && (
            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <p className="text-xs text-blue-400 mb-1">Supervisor Feedback:</p>
              <p className="text-sm text-gray-300">{project.supervisorFeedback}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={() => { 
            setSelectedProject({...project, evaluationType: 'srs-sds'}); 
            setFeedback(""); 
            setMarks(isEvaluated ? panelMarks.toString() : ''); 
          }}
          disabled={isEvaluated || project.srsSdsReviewCompleted}
          className={`w-full py-3 rounded-lg font-bold transition-all ${
            isEvaluated || project.srsSdsReviewCompleted ? 
            'bg-gray-700 text-gray-400 cursor-not-allowed' : 
            'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
          }`}
        >
          {isEvaluated ? '✅ Already Evaluated' : 
           project.srsSdsReviewCompleted ? '✅ All Evaluations Complete' : 
           '📝 Evaluate SRS/SDS'}
        </button>
        
        {/* Show previous feedback if evaluated */}
        {isEvaluated && project.srsSdsFeedback && (
          <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Your feedback:</p>
            <p className="text-sm text-gray-300">{project.srsSdsFeedback}</p>
          </div>
        )}
      </div>
    );
  };

  // Render Empty State
  const renderEmptyState = (type) => (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-xl p-12 text-center">
      <div className="text-6xl mb-4">{type === 'initial-defense' ? '📊' : '📋'}</div>
      <h3 className="text-xl font-semibold text-white mb-2">
        No {type === 'initial-defense' ? 'Initial Defense' : 'SRS/SDS'} Projects
      </h3>
      <p className="text-gray-400">
        {type === 'initial-defense' 
          ? 'Projects will appear here after defense scheduling and PPT upload.'
          : 'Projects will appear here after SRS/SDS documents are uploaded and submitted for review.'}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
          Panel Member Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Evaluate Student Projects (Initial Defense & SRS/SDS Review)</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('initial-defense')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'initial-defense'
              ? 'bg-gradient-to-r from-red-500 to-orange-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          🎤 Initial Defense Evaluation
        </button>
        <button
          onClick={() => setActiveTab('srs-sds-evaluation')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'srs-sds-evaluation'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          📋 SRS/SDS Evaluation
        </button>
      </div>

      {/* Debug Panel */}
      <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-white">Debug Information</h3>
          <div className="flex space-x-2">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
            >
              🔄 Refresh List
            </button>
            <button
              onClick={testBackendEndpoints}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg"
            >
              🧪 Test Backend
            </button>
            <button
              onClick={() => setDebugInfo('')}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              Clear Log
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-300 font-mono bg-black/30 p-3 rounded max-h-32 overflow-y-auto">
          {debugInfo || 'No debug information yet. Click "Test Backend" to check connections.'}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          <p className="ml-4 text-gray-400">Loading projects...</p>
        </div>
      ) : activeTab === 'initial-defense' ? (
        initialDefenseProjects.length === 0 ? (
          renderEmptyState('initial-defense')
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialDefenseProjects.map(renderInitialDefenseCard)}
          </div>
        )
      ) : (
        srsSdsProjects.length === 0 ? (
          renderEmptyState('srs-sds-evaluation')
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {srsSdsProjects.map(renderSrsSdsCard)}
          </div>
        )
      )}

      {/* Evaluation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedProject.evaluationType === 'initial-defense' 
                      ? 'Initial Defense Evaluation' 
                      : 'SRS/SDS Document Evaluation'}
                  </h2>
                  <p className="text-gray-400 mt-1">Student: {selectedProject.leaderId?.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedProject.evaluationType === 'initial-defense' 
                      ? 'Panel Evaluation (5% weight)' 
                      : 'SRS/SDS Review (5% weight)'}
                  </p>
                </div>
                <button
                  onClick={resetForm}
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
                    <span className="text-gray-400">Enrollment:</span>
                    <div className="font-medium text-white">{selectedProject.leaderId?.enrollment}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Evaluation Type:</span>
                    <div className="font-medium text-blue-400">
                      {selectedProject.evaluationType === 'initial-defense' ? 'Initial Defense' : 'SRS/SDS Review'}
                    </div>
                  </div>
                </div>
                
                {/* Document Links */}
                {selectedProject.evaluationType === 'initial-defense' && selectedProject.presentationUrl && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <span className="text-gray-400">Presentation:</span>
                    <a
                      href={`http://localhost:5000/${selectedProject.presentationUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline block"
                    >
                      📥 Download Presentation
                    </a>
                  </div>
                )}
                
                {selectedProject.evaluationType === 'srs-sds' && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <span className="text-gray-400">Documents:</span>
                    <div className="flex space-x-3 mt-1">
                      {selectedProject.srsUrl && (
                        <a
                          href={`http://localhost:5000/${selectedProject.srsUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-sm"
                        >
                          📄 SRS
                        </a>
                      )}
                      {selectedProject.sdsUrl && (
                        <a
                          href={`http://localhost:5000/${selectedProject.sdsUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-sm"
                        >
                          📄 SDS
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
                  placeholder={
                    selectedProject.evaluationType === 'initial-defense'
                      ? "Provide feedback on presentation skills, content, delivery, technical aspects..."
                      : "Provide feedback on SRS/SDS quality, completeness, clarity, technical accuracy..."
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                {selectedProject.evaluationType === 'initial-defense' ? (
                  <>
                    <button
                      onClick={() => handleSubmitInitialDefenseEvaluation('Defense Cleared')}
                      disabled={processing || !marks || marks < 0 || marks > 5}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {processing ? 'Submitting...' : '✅ Submit Marks & Clear Defense'}
                    </button>
                    
                    <button
                      onClick={() => handleSubmitInitialDefenseEvaluation('Defense Changes Required')}
                      disabled={processing || !feedback.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {processing ? 'Processing...' : '⚠️ Request Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSubmitSrsSdsEvaluation}
                    disabled={processing || !marks || marks < 0 || marks > 5}
                    className="col-span-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {processing ? 'Submitting...' : '✅ Submit SRS/SDS Evaluation'}
                  </button>
                )}
              </div>
              
              {/* Cancel Button */}
              <button
                onClick={resetForm}
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