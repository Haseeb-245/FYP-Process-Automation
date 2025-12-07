import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [project, setProject] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposedSupervisor, setProposedSupervisor] = useState('');

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
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', student._id);
    if (proposedSupervisor) {
      formData.append('proposedSupervisor', proposedSupervisor);
    }

    try {
      setUploading(true);
      const response = await fetch('http://localhost:5000/api/projects/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Proposal submitted successfully!');
        fetchProjectStatus(student._id);
        setFile(null);
        setProposedSupervisor('');
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

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Coordinator Review': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'Changes Required': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Pending Supervisor Consent': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Supervisor Approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'Supervisor Rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusMessage = (status) => {
    switch(status) {
      case 'Pending Coordinator Review': 
        return '⏳ Your proposal is under review by the coordinator.';
      case 'Approved': 
        return '✅ Your proposal has been approved by the coordinator!';
      case 'Rejected': 
        return '❌ Your proposal has been rejected. Please check feedback and resubmit.';
      case 'Changes Required': 
        return '📝 Changes are required. Please review feedback and resubmit.';
      case 'Pending Supervisor Consent': 
        return '👨‍🏫 Waiting for supervisor to sign consent form...';
      case 'Supervisor Approved': 
        return '🎉 Phase 1 Completed! Your supervisor has signed the consent form. You can now proceed to Phase 2.';
      case 'Supervisor Rejected': 
        return '❌ Supervisor declined supervision. Please consult with coordinator.';
      default: 
        return 'ℹ️ Status unknown';
    }
  };

  if (!student) {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-gray-400">Welcome, {student.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Upload Section */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">📄</span>
              Submit Proposal
            </h2>
            
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Proposed Supervisor (Optional)
                </label>
                <input
                  type="text"
                  value={proposedSupervisor}
                  onChange={(e) => setProposedSupervisor(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dr. Ahmed Khan"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mention your preferred supervisor's name
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Proposal Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full p-3 bg-gray-900 border border-gray-700 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX (Max 10MB)
                </p>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span className="mr-2">⬆️</span>
                    {project ? 'Resubmit Proposal' : 'Submit Proposal'}
                  </>
                )}
              </button>
            </form>

            {project && (
              <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                <p className="text-sm text-blue-300">
                  💡 <strong>Note:</strong> Resubmitting will replace your previous proposal and reset the review status.
                </p>
              </div>
            )}
          </div>

          {/* Right: Status Section */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Proposal Status
            </h2>

            {!project ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">No Proposal Submitted</h3>
                <p className="text-gray-400">
                  Submit your FYP proposal using the form on the left to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Status */}
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Current Status</h3>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <p className="mt-3 text-gray-300">{getStatusMessage(project.status)}</p>
                </div>

                {/* Submission Details */}
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Submission Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Submitted On:</span>
                      <span className="text-white font-medium">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {project.proposedSupervisorName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Proposed Supervisor:</span>
                        <span className="text-white font-medium">{project.proposedSupervisorName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Document:</span>
                      <a
                        href={`http://localhost:5000/${project.documentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View/Download
                      </a>
                    </div>
                  </div>
                </div>

                {/* Assigned Supervisor */}
                {project.supervisorId && (
                  <div className="bg-purple-900 bg-opacity-30 p-4 rounded-lg border border-purple-700">
                    <h3 className="text-sm font-semibold text-purple-300 mb-3">👨‍🏫 Assigned Supervisor</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white font-medium">{project.supervisorId.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white font-medium">{project.supervisorId.email}</span>
                      </div>
                      {project.supervisorSignature && (
                        <>
                          <div className="mt-4 pt-3 border-t border-purple-600">
                            <p className="text-xs text-purple-300 mb-2">✍️ Digital Signature:</p>
                            <p className="text-xl text-white font-signature" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                              {project.supervisorSignature}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Signed on: {new Date(project.supervisorSignedAt).toLocaleString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Coordinator Feedback */}
                {project.coordinatorFeedback && (
                  <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-700">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">💬 Coordinator Feedback</h3>
                    <p className="text-gray-300 text-sm">{project.coordinatorFeedback}</p>
                  </div>
                )}

                {/* Supervisor Feedback */}
                {project.supervisorFeedback && (
                  <div className="bg-green-900 bg-opacity-30 p-4 rounded-lg border border-green-700">
                    <h3 className="text-sm font-semibold text-green-300 mb-2">💬 Supervisor Feedback</h3>
                    <p className="text-gray-300 text-sm">{project.supervisorFeedback}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">📅 Project Timeline</h3>
                  <div className="space-y-3">
                    {/* Step 1: Submission */}
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                      <div>
                        <p className="text-white font-medium">✅ Proposal Submitted</p>
                        <p className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2: Coordinator Review */}
                    {project.status !== 'Pending Coordinator Review' && (
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                          project.status === 'Approved' || project.status === 'Pending Supervisor Consent' || project.status === 'Supervisor Approved'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-white font-medium">
                            {project.status === 'Rejected' ? '❌' : '✅'} Coordinator Review
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.status === 'Approved' || project.status === 'Pending Supervisor Consent' || project.status === 'Supervisor Approved' 
                              ? 'Approved & Supervisor Assigned' 
                              : project.status === 'Rejected' 
                              ? 'Rejected' 
                              : 'Changes Required'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Supervisor Consent */}
                    {(project.status === 'Supervisor Approved' || project.status === 'Supervisor Rejected') && (
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                          project.status === 'Supervisor Approved' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-white font-medium">
                            {project.status === 'Supervisor Approved' ? '✅' : '❌'} Supervisor Consent
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.status === 'Supervisor Approved' 
                              ? `Signed on ${new Date(project.supervisorSignedAt).toLocaleString()}` 
                              : 'Declined'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pending Step */}
                    {project.status === 'Pending Supervisor Consent' && (
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 animate-pulse"></div>
                        <div>
                          <p className="text-white font-medium">⏳ Awaiting Supervisor Consent</p>
                          <p className="text-xs text-gray-500">In progress...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phase 1 Completion Badge */}
                {project.status === 'Supervisor Approved' && (
                  <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 rounded-lg border-2 border-green-500">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🎉</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-center text-white mb-2">
                      Phase 1 Completed!
                    </h3>
                    <p className="text-center text-green-200 text-sm mb-4">
                      Your proposal has been approved by both the coordinator and supervisor.
                    </p>
                    <div className="bg-green-800 bg-opacity-50 p-3 rounded-lg">
                      <p className="text-xs text-green-100 text-center">
                        ✅ Coordinator Approved<br/>
                        ✅ Supervisor Consent Signed<br/>
                        📋 Ready for Phase 2 Activities
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;