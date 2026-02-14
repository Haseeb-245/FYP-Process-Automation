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
    <div className="min-h-screen bg-[#0F172A] flex flex-col font-['Arial',_'Helvetica',_sans-serif]">
      
      {/* Professional University Header */}
      <header className="bg-white border-b-2 border-[#E5E7EB] py-5 px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* University Logo */}
            <div className="w-14 h-14 bg-[#0F172A] rounded flex items-center justify-center shadow-md">
              <div className="text-center">
                <div className="text-sm font-bold text-white leading-tight">BU</div>
              </div>
            </div>
            {/* University Name */}
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Bahria University</h1>
              <p className="text-sm text-[#64748B] font-medium mt-0.5">Final Year Project Management System</p>
            </div>
          </div>
          {/* Right Side Badge */}
          <div className="hidden md:flex items-center gap-2 bg-[#F8FAFC] px-4 py-2 rounded border border-[#E5E7EB]">
            <div className="w-2 h-2 bg-[#0F172A] rounded-full"></div>
            <span className="text-sm font-medium text-[#0F172A]">Secure Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          
          {/* Hero Section - Centered */}
          <div className="text-center mb-14">
            <div className="inline-block mb-4">
              <span className="bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/20">
                ACADEMIC PORTAL ACCESS
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Welcome to FYP Management System
            </h2>
            <p className="text-lg text-[#CBD5E1] max-w-2xl mx-auto leading-relaxed">
              Streamlined project management platform for students, faculty, and administration
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            
            {/* Student Card */}
            <RoleCard 
              title="Student" 
              icon={
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              }
              onClick={() => handleRoleSelect('student')}
              description="Submit projects and track progress"
            />

            {/* FYP Board Card */}
            <RoleCard 
              title="FYP Board" 
              icon={
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                </svg>
              }
              onClick={() => handleRoleSelect('board')}
              description="Evaluate and assess projects"
            />

            {/* Coordinator Card */}
            <RoleCard 
              title="Coordinator" 
              icon={
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
              }
              onClick={() => handleRoleSelect('coordinator')}
              description="Administrative oversight and management"
            />

            {/* Supervisor Card */}
            <RoleCard 
              title="Supervisor" 
              icon={
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              }
              onClick={() => handleRoleSelect('supervisor')}
              description="Guide and evaluate student projects"
            />
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-white/10">
            <p className="text-sm text-[#94A3B8]">
              © {new Date().getFullYear()} Bahria University. All rights reserved.
            </p>
            <p className="text-xs text-[#64748B] mt-2">
              Select your role above to access the portal
            </p>
          </div>
        </div>
      </main>

      {/* Glassmorphism Login Modal */}
      {selectedRole && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl w-full max-w-md p-8 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] transition-colors w-8 h-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center font-bold text-xl"
            >
              ×
            </button>

            {/* Modal Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#0F172A] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">BU</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">
                    {selectedRole === 'board' && !boardSubRole ? 'Select Board Role' : `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`}
                  </h3>
                  <p className="text-xs text-[#64748B]">Bahria University Portal</p>
                </div>
              </div>
              <div className="h-1 w-16 bg-[#0F172A] rounded-full"></div>
            </div>

            {/* Board Sub-Role Selection */}
            {selectedRole === 'board' && !boardSubRole ? (
              <div className="space-y-3">
                <button 
                  onClick={() => setBoardSubRole('panel')}
                  className="w-full p-5 bg-[#F8FAFC] hover:bg-[#0F172A] hover:text-white rounded-xl text-left flex items-center gap-4 transition-all border-2 border-[#E5E7EB] hover:border-[#0F172A] group"
                >
                  <div className="w-12 h-12 bg-white group-hover:bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#E5E7EB]">
                    <svg className="w-6 h-6 text-[#0F172A] group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] group-hover:text-white mb-1">Panel Member</div>
                    <div className="text-xs text-[#64748B] group-hover:text-white/80">Internal evaluation and grading</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setBoardSubRole('external')}
                  className="w-full p-5 bg-[#F8FAFC] hover:bg-[#0F172A] hover:text-white rounded-xl text-left flex items-center gap-4 transition-all border-2 border-[#E5E7EB] hover:border-[#0F172A] group"
                >
                  <div className="w-12 h-12 bg-white group-hover:bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#E5E7EB]">
                    <svg className="w-6 h-6 text-[#0F172A] group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] group-hover:text-white mb-1">External Examiner</div>
                    <div className="text-xs text-[#64748B] group-hover:text-white/80">Final project defense evaluation</div>
                  </div>
                </button>
              </div>
            ) : (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* ID/Email Input */}
                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-2">
                    {selectedRole === 'student' ? 'Enrollment Number' : 'University Email / ID'}
                  </label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-none transition-all"
                    placeholder={selectedRole === 'student' ? 'e.g. 01-134192-023' : 'Enter your university ID'}
                    value={credentials.id}
                    onChange={(e) => setCredentials({...credentials, id: e.target.value})}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-none transition-all"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  />
                </div>

                {/* Board Role Indicator */}
                {selectedRole === 'board' && (
                  <div className="text-xs text-[#64748B] text-center bg-[#F1F5F9] py-2.5 rounded-lg border border-[#E5E7EB]">
                    Logging in as: <span className="text-[#0F172A] font-bold capitalize">{boardSubRole}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform active:scale-98 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : 'Access Portal'}
                </button>

                {/* Support Info */}
                <div className="text-center pt-4 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#64748B]">
                    Need assistance? Contact <span className="text-[#0F172A] font-semibold">it-support@bahria.edu.pk</span>
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

// Professional Role Card Component
const RoleCard = ({ title, icon, onClick, description }) => (
  <div 
    onClick={onClick}
    className="group bg-white hover:bg-[#0F172A] border-2 border-[#E5E7EB] hover:border-[#0F172A] p-8 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
  >
    <div className="text-[#0F172A] group-hover:text-white mb-4 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-[#0F172A] group-hover:text-white mb-2 transition-colors">
      {title}
    </h3>
    <p className="text-sm text-[#64748B] group-hover:text-white/80 mb-4 transition-colors leading-relaxed">
      {description}
    </p>
    <div className="pt-4 border-t border-[#E5E7EB] group-hover:border-white/20">
      <span className="text-xs font-bold text-[#0F172A] group-hover:text-white transition-colors uppercase tracking-wide">
        Click to Login →
      </span>
    </div>
  </div>
);

export default Landing;