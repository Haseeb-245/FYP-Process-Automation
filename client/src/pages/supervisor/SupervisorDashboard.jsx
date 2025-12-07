import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [supervisor, setSupervisor] = useState(null);
  const [pendingConsents, setPendingConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    if (!userInfo || userInfo.role !== 'supervisor') {
      navigate('/');
      alert('Please login as Supervisor first');
      return;
    }
    
    setSupervisor(userInfo);
    setSignatureName(userInfo.name); // Pre-fill signature with supervisor name
    fetchPendingConsents(userInfo._id);
  }, [navigate]);

  const fetchPendingConsents = async (supervisorId) => {
    try {
      setLoading(true);
      console.log('Fetching consents for supervisor ID:', supervisorId);
      
      const response = await fetch(`http://localhost:5000/api/projects/supervisor-pending/${supervisorId}`);
      const data = await response.json();
      
      console.log('Received consents:', data);
      setPendingConsents(data);
    } catch (error) {
      console.error('Error fetching consents:', error);
      alert('Failed to fetch pending consents');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (projectId, decision) => {
    // Validation for approval
    if (decision === 'Approved') {
      if (!signatureName.trim()) {
        alert('Please enter your signature name');
        return;
      }
      if (!agreedToTerms) {
        alert('Please agree to the supervision commitment terms');
        return;
      }
    }

    const action = decision === 'Approved' ? 'sign the consent form and approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this project?`)) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`http://localhost:5000/api/projects/supervisor-decision/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          decision: decision,
          feedback: feedback || undefined,
          signature: decision === 'Approved' ? signatureName : undefined,
          signedAt: decision === 'Approved' ? new Date().toISOString() : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (decision === 'Approved') {
          alert('✅ Consent Form Signed Successfully!\n\nThe student has been notified that you have accepted to supervise their project.');
        } else {
          alert('❌ Project Rejected!\n\nThe student and coordinator have been notified of your decision.');
        }
        setSelectedProject(null);
        setFeedback('');
        setSignatureName(supervisor.name);
        setAgreedToTerms(false);
        fetchPendingConsents(supervisor._id);
      } else {
        alert(data.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Error processing decision:', error);
      alert('Server error');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  if (!supervisor) {
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
            <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
            <p className="text-gray-400">Welcome, {supervisor.name}</p>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Pending Consent Requests</h2>
          <p className="text-gray-400">Review and sign consent forms for student project proposals</p>
        </div>

        {/* Stats Card */}
        <div className="bg-gray-800 p-6 rounded-lg shadow mb-8 border-l-4 border-yellow-500">
          <div className="text-4xl font-bold">{pendingConsents.length}</div>
          <div className="text-gray-400">Pending Consent Forms</div>
        </div>

        {/* Projects List */}
        {pendingConsents.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
            <p className="text-gray-400">All consent requests have been processed!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingConsents.map((project) => (
              <div key={project._id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-semibold rounded-full">
                      ⏳ Awaiting Signature
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{project.leaderId?.name}</h3>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center text-gray-400">
                      <span className="font-semibold mr-2">Enrollment:</span>
                      <span>{project.leaderId?.enrollment}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <span className="font-semibold mr-2">Email:</span>
                      <span className="truncate">{project.leaderId?.email || 'N/A'}</span>
                    </div>
                    {project.proposedSupervisorName && (
                      <div className="flex items-center text-gray-400">
                        <span className="font-semibold mr-2">Proposed:</span>
                        <span>{project.proposedSupervisorName}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-400">
                      <span className="font-semibold mr-2">Submitted:</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {project.coordinatorFeedback && (
                    <div className="mb-4 p-3 bg-gray-900 rounded">
                      <p className="text-xs font-semibold text-gray-400 mb-1">📝 Coordinator's Note:</p>
                      <p className="text-sm text-gray-300">{project.coordinatorFeedback}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors"
                  >
                    📋 Review & Sign Consent
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Consent Form Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-gray-700">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900 to-purple-900">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">📜 FYP Supervision Consent Form</h2>
                    <p className="text-gray-300 mt-1">University Final Year Project Program</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setFeedback('');
                      setSignatureName(supervisor.name);
                      setAgreedToTerms(false);
                    }}
                    className="text-gray-400 hover:text-gray-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Student Information */}
                <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <span className="text-2xl mr-3">👨‍🎓</span>
                    Student Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Full Name:</span>
                      <div className="font-medium text-white mt-1">{selectedProject.leaderId?.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Enrollment Number:</span>
                      <div className="font-medium text-white mt-1">{selectedProject.leaderId?.enrollment}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 text-sm">Email Address:</span>
                      <div className="font-medium text-white mt-1">{selectedProject.leaderId?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Proposal Document */}
                <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <span className="text-2xl mr-3">📄</span>
                    Project Proposal Document
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Please review the complete project proposal before signing the consent form.
                  </p>
                  <a
                    href={`http://localhost:5000/${selectedProject.documentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    📥 Download & Review Proposal
                  </a>
                </div>

                {/* Coordinator Comments */}
                {selectedProject.coordinatorFeedback && (
                  <div className="bg-blue-900 bg-opacity-30 p-5 rounded-lg border border-blue-700">
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <span className="text-xl mr-2">💬</span>
                      Coordinator's Comments
                    </h3>
                    <p className="text-gray-300">{selectedProject.coordinatorFeedback}</p>
                  </div>
                )}

                {/* Supervision Terms & Conditions */}
                <div className="bg-amber-900 bg-opacity-30 p-5 rounded-lg border border-amber-700">
                  <h3 className="font-semibold text-white mb-3 flex items-center text-lg">
                    <span className="text-2xl mr-2">⚖️</span>
                    Supervision Commitment & Responsibilities
                  </h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <p>By signing this consent form, I agree to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Supervise the student's FYP project for the entire academic year</li>
                      <li>Conduct regular meetings (minimum bi-weekly) to monitor progress</li>
                      <li>Provide timely feedback on project milestones and deliverables</li>
                      <li>Guide the student in research methodology and technical aspects</li>
                      <li>Review and approve all major project documents and presentations</li>
                      <li>Attend the final project defense and evaluation</li>
                      <li>Submit final grades and evaluation reports to the FYP coordinator</li>
                    </ul>
                    <p className="mt-4 font-semibold text-yellow-300">
                      ⚠️ Note: This is a formal commitment that will be recorded in university records.
                    </p>
                  </div>
                </div>

                {/* Your Feedback Section */}
                <div>
                  <label className="block font-semibold text-white mb-2 text-lg">
                    💭 Your Comments / Guidance (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-4 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="Provide guidance, expectations, or reasons for your decision..."
                  />
                </div>

                {/* Agreement Checkbox */}
                <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="agreeTerms" className="ml-3 text-sm text-gray-300">
                      <span className="font-semibold text-white">I have read and agree to the supervision responsibilities</span>
                      <p className="mt-1">
                        I confirm that I have reviewed the project proposal and understand my commitments as the project supervisor.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Digital Signature */}
                <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
                  <h3 className="font-semibold text-white mb-3 flex items-center text-lg">
                    <span className="text-2xl mr-2">✍️</span>
                    Digital Signature
                  </h3>
                  <label className="block text-sm text-gray-400 mb-2">
                    Type your full name to sign <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full p-4 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-signature text-2xl"
                    placeholder="Enter your full name"
                    style={{ fontFamily: 'Brush Script MT, cursive' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    📅 Date: {new Date().toLocaleDateString()} | 🕐 Time: {new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleDecision(selectedProject._id, 'Approved')}
                    disabled={processing || !signatureName.trim() || !agreedToTerms}
                    className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        ✅ Sign & Accept Supervision
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDecision(selectedProject._id, 'Rejected')}
                    disabled={processing}
                    className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-bold text-lg disabled:opacity-50 flex items-center justify-center shadow-lg"
                  >
                    ❌ Decline Request
                  </button>
                </div>

                {/* Warning Message */}
                {(!signatureName.trim() || !agreedToTerms) && (
                  <div className="bg-red-900 bg-opacity-30 p-4 rounded-lg border border-red-700">
                    <p className="text-red-300 text-sm flex items-center">
                      <span className="mr-2">⚠️</span>
                      {!agreedToTerms && !signatureName.trim() 
                        ? 'Please agree to the terms and provide your signature to approve.'
                        : !agreedToTerms 
                        ? 'Please agree to the supervision terms to proceed.'
                        : 'Please provide your signature to approve.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;