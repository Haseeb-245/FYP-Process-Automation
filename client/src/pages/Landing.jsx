import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  
  // State to manage which modal is open
  const [selectedRole, setSelectedRole] = useState(null); // 'student', 'coordinator', 'supervisor', 'board'
  const [boardSubRole, setBoardSubRole] = useState(null); // 'panel' or 'external'

  // Form States
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [loading, setLoading] = useState(false); // Added loading state

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setBoardSubRole(null); // Reset sub-role on new selection
    setCredentials({ id: '', password: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // --- 1. STUDENT LOGIN LOGIC ---
    if (selectedRole === 'student') {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            enrollment: credentials.id, 
            password: credentials.password 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('userInfo', JSON.stringify(data));
          console.log("Student Login Successful:", data);
          navigate('/student/dashboard');
        } else {
          alert("Login Failed: " + (data.message || "Invalid credentials"));
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert("Server error. Is the backend running on port 5000?");
      } finally {
        setLoading(false);
      }
      return; // Stop here for students
    }

    // --- 2. COORDINATOR LOGIN LOGIC ---
    if (selectedRole === 'coordinator') {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: credentials.id, // Coordinator uses email
            password: credentials.password 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Check if the user is actually a coordinator
          if (data.role !== 'coordinator') {
            alert(`Access Denied: This account is not a coordinator. Role: ${data.role}`);
            setLoading(false);
            return;
          }

          localStorage.setItem('userInfo', JSON.stringify(data));
          console.log("Coordinator Login Successful:", data);
          navigate('/coordinator/dashboard');
        } else {
          alert("Login Failed: " + (data.message || "Invalid credentials"));
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert("Server error. Is the backend running on port 5000?");
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- 3. SUPERVISOR LOGIN LOGIC ---
    if (selectedRole === 'supervisor') {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: credentials.id,
            password: credentials.password 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.role !== 'supervisor') {
            alert(`Access Denied: This account is not a supervisor. Role: ${data.role}`);
            setLoading(false);
            return;
          }

          localStorage.setItem('userInfo', JSON.stringify(data));
          console.log("Supervisor Login Successful:", data);
          navigate('/supervisor/dashboard');
        } else {
          alert("Login Failed: " + (data.message || "Invalid credentials"));
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert("Server error. Is the backend running on port 5000?");
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- 4. BOARD LOGIN (Now with proper External Examiner logic) ---
    if (selectedRole === 'board') {
      // First handle the board sub-role selection
      if (!boardSubRole) {
        alert("Please select Panel Member or External Examiner first");
        return;
      }

      setLoading(true);
      
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: credentials.id,
            password: credentials.password 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Check if the user's role matches the selected sub-role
          const expectedRole = boardSubRole === 'external' ? 'external' : 'board';
          
          if (data.role !== expectedRole) {
            alert(`Access Denied: This account is not a ${boardSubRole}. Role: ${data.role}`);
            setLoading(false);
            return;
          }

          localStorage.setItem('userInfo', JSON.stringify(data));
          console.log(`${boardSubRole} Login Successful:`, data);
          
          // Redirect based on sub-role
          if (boardSubRole === 'external') {
            navigate('/external/dashboard'); // External Examiner dashboard
          } else {
            navigate('/board/dashboard'); // Panel Member dashboard
          }
        } else {
          alert("Login Failed: " + (data.message || "Invalid credentials"));
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert("Server error. Is the backend running on port 5000?");
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2342] via-[#1a365d] to-[#0a2342] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      
      {/* Bahria University Header */}
      <div className="absolute top-0 left-0 right-0 bg-white/10 backdrop-blur-sm border-b border-white/20 py-4 px-8 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <div className="text-center ">
                <div className="text-[10px] font-bold text-[#0a2342] leading-tight ">
                  BU
                </div>
                <div className="text-[8px] font-bold text-[#0a2342] leading-tight"></div>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">Bahria University</div>
              <div className="text-sm text-white/80">Final Year Project Management System</div>
            </div>
          </div>
          <div className="text-sm text-white/70 hidden md:block">
            Secure Portal Access
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="z-10 w-full max-w-6xl text-center mt-20">
        <div className="mb-10">
          <div className="inline-block px-6 py-2 bg-white/10 rounded-full border border-white/20 mb-4">
            <span className="text-sm font-medium text-white/90">Welcome to BU-FYPMS</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-white">
            Final Year Project Management System
          </h1>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            A comprehensive platform for managing Final Year Projects across all departments of Bahria University
          </p>
        </div>

        {/* THE 4 MAIN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Card 1: Student */}
          <RoleCard 
            title="Student" 
            icon="🎓" 
            color="text-blue-400"
            borderColor="border-blue-500/30"
            bgColor="bg-gradient-to-br from-blue-900/40 to-blue-800/20"
            onClick={() => handleRoleSelect('student')}
            description="Project submission & tracking"
          />

          {/* Card 2: FYP Board */}
          <RoleCard 
            title="FYP Board" 
            icon="⚖️" 
            color="text-red-400"
            borderColor="border-red-500/30"
            bgColor="bg-gradient-to-br from-red-900/40 to-red-800/20"
            onClick={() => handleRoleSelect('board')}
            description="Evaluation & assessment"
          />

          {/* Card 3: Coordinator */}
          <RoleCard 
            title="Coordinator" 
            icon="👔" 
            color="text-emerald-400"
            borderColor="border-emerald-500/30"
            bgColor="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20"
            onClick={() => handleRoleSelect('coordinator')}
            description="Administrative oversight"
          />

          {/* Card 4: Supervisor */}
          <RoleCard 
            title="Supervisor" 
            icon="👓" 
            color="text-amber-400"
            borderColor="border-amber-500/30"
            bgColor="bg-gradient-to-br from-amber-900/40 to-amber-800/20"
            onClick={() => handleRoleSelect('supervisor')}
            description="Project guidance & evaluation"
          />
        </div>

        {/* Footer Note */}
        <div className="text-sm text-white/50 border-t border-white/10 pt-6 max-w-2xl mx-auto">
          <p>© {new Date().getFullYear()} Bahria University. All rights reserved.</p>
          <p className="mt-1">Select your role to access the secure portal</p>
        </div>
      </div>

      {/* LOGIN MODAL OVERLAY */}
      {selectedRole && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 p-8 rounded-xl w-full max-w-md shadow-2xl relative transform transition-all scale-100">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[8px] font-bold text-[#0a2342] leading-tight">BU</div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedRole === 'board' && !boardSubRole ? 'Select Board Role' : `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Portal`}
                </h2>
                <p className="text-sm text-white/60">Bahria University Authentication</p>
              </div>
            </div>

            {/* LOGIC: FYP BOARD SUB-SELECTION */}
            {selectedRole === 'board' && !boardSubRole ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setBoardSubRole('panel')}
                  className="w-full p-4 bg-gradient-to-r from-red-900/30 to-red-800/20 hover:from-red-900/40 hover:to-red-800/30 rounded-lg text-left flex items-center gap-4 transition-all border border-red-500/20 hover:border-red-500/40 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                  <div>
                    <div className="font-bold text-white">Panel Member</div>
                    <div className="text-xs text-white/60">Internal evaluation and grading</div>
                  </div>
                </button>
                <button 
                  onClick={() => setBoardSubRole('external')}
                  className="w-full p-4 bg-gradient-to-r from-red-900/30 to-red-800/20 hover:from-red-900/40 hover:to-red-800/30 rounded-lg text-left flex items-center gap-4 transition-all border border-red-500/20 hover:border-red-500/40 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🌍</span>
                  <div>
                    <div className="font-bold text-white">External Examiner</div>
                    <div className="text-xs text-white/60">Final year project defense</div>
                  </div>
                </button>
              </div>
            ) : (
              /* ACTUAL LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Dynamic Input */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {selectedRole === 'student' ? 'Enrollment Number' : 'University ID / Email'}
                  </label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all focus:border-blue-500"
                    placeholder={selectedRole === 'student' ? 'e.g. 01-134192-023' : 'Enter your university ID'}
                    value={credentials.id}
                    onChange={(e) => setCredentials({...credentials, id: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all focus:border-blue-500"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  />
                </div>

                {selectedRole === 'board' && (
                  <div className="text-xs text-white/60 text-center bg-red-900/20 py-2 rounded border border-red-500/20">
                    Logging in as: <span className="text-red-300 font-semibold capitalize">{boardSubRole}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : 'Access Portal'}
                </button>

                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50">
                    Need help? Contact IT Support at <span className="text-blue-300">it-support@bahria.edu.pk</span>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Reusable Card Component
const RoleCard = ({ title, icon, color, borderColor, bgColor, onClick, description }) => (
  <div 
    onClick={onClick}
    className={`group ${bgColor} border ${borderColor} p-6 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-xl backdrop-blur-sm relative overflow-hidden`}
  >
    {/* Hover effect overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="relative z-10">
      <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      <h3 className={`text-lg font-bold text-white mb-1 transition-colors ${color}`}>
        {title}
      </h3>
      <p className="text-sm text-white/60">{description}</p>
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
          Click to login →
        </div>
      </div>
    </div>
  </div>
);

export default Landing;