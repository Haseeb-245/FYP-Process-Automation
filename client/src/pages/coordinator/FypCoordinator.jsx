import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Users,
  Calendar,
  UserCog,
  LogOut,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  FileCheck,
  Send,
  User,
  MoreVertical
} from "lucide-react";

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
            {/* User Profile */}
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
                icon={<Users className="w-5 h-5" />} 
                label="Assign Groups" 
                onClick={() => navigate('/coordinator/assign-groups')}
                collapsed={!sidebarOpen}
              />
              <SidebarButton 
                icon={<Calendar className="w-5 h-5" />} 
                label="Schedule Defense" 
                onClick={() => navigate('/coordinator/schedule-defense')}
                collapsed={!sidebarOpen}
              />
              <SidebarButton 
                icon={<UserCog className="w-5 h-5" />} 
                label="Manage Panels" 
                onClick={() => navigate('/coordinator/panels')}
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
      setProposals(data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      alert('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (projectId, status) => {
    // For approval, must select supervisor
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
        // Approve and assign supervisor
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
        // Reject or request changes
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
      case 'Rejected': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'Changes Required': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case 'Pending Supervisor Consent': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
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

// Other stub components
export const PendingProposals = () => (
  <div>
    <h1 className="text-3xl font-bold mb-6">Pending Proposals</h1>
    <p>List of pending proposals will appear here</p>
  </div>
);

export const AllProjects = () => (
  <div>
    <h1 className="text-3xl font-bold mb-6">All Projects</h1>
    <p>Complete project list</p>
  </div>
);

export const AssignGroups = () => (
  <div>
    <h1 className="text-3xl font-bold mb-6">Assign Groups</h1>
    <p>Group assignment interface</p>
  </div>
);

export const ScheduleDefense = () => (
  <div>
    <h1 className="text-3xl font-bold mb-6">Schedule Defense</h1>
    <p>Defense scheduling tool</p>
  </div>
);

export const ManagePanels = () => (
  <div>
    <h1 className="text-3xl font-bold mb-6">Manage Panels</h1>
    <p>Panel management interface</p>
  </div>
);

export default FypCoordinator;