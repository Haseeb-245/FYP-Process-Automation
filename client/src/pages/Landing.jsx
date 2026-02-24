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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
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
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-white to-[#F8FAFC] flex flex-col font-['Arial',_'Helvetica',_sans-serif]">
      
      {/* Navy Premium Header */}
      <header className="bg-gradient-to-r from-[#0F172A] to-[#1E40AF] border-b-2 border-[#1E40AF] shadow-lg py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* University Logo - ADD YOUR LOGO PATH HERE */}
            <div className="h-16 w-16rounded-full flex items-center justify-center shadow-lg p-2">
              <img 
                src="/bu-logo.png"
                alt="Bahria University Logo" 
                
                className="object-fit   w-full h-full"
                onError={(e) => {
                  // Fallback if logo doesn't load
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="text-[#0F172A] font-bold text-xl">BU</div>';
                }}
              />
            </div>
            {/* University Name & Title */}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">Bahria University</h1>
              <p className="text-sm text-[#94A3B8] font-medium mt-1">Final Year Project Management System</p>
            </div>
          </div>
          {/* Premium Badge */}
          <div className="hidden md:flex items-center gap-3 bg-[#1E40AF] px-5 py-2.5 rounded-md shadow-md border border-[#3B82F6]/30">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-white">FYPMS</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-16  h-screen bg-[url('/19.jpg')] bg-cover bg-center ">
        <div className="w-full max-w-6xl">
          
          {/* Hero Section - Centered */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#0F172A] border border-[#1E40AF] px-4 py-2 rounded-md shadow-md mb-6">
              <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full"></div>
              <span className="text-xs font-semibold text-white uppercase tracking-wide">Academic Portal Access</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
              Welcome to FYP<br/>Management System
            </h2>
            <p className="text-lg text-[#E2E8F0] max-w-2xl mx-auto leading-relaxed">
              Comprehensive platform for managing final year projects across all departments
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            
            {/* Student Card */}
            <RoleCard 
              title="Student" 
              icon={
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              }
              onClick={() => handleRoleSelect('student')}
              description="Submit and track project progress"
            />

            {/* FYP Board Card */}
            <RoleCard 
              title="FYP Board" 
              icon={
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
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
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
              }
              onClick={() => handleRoleSelect('coordinator')}
              description="Administrative oversight"
            />

            {/* Supervisor Card */}
            <RoleCard 
              title="Supervisor" 
              icon={
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              }
              onClick={() => handleRoleSelect('supervisor')}
              description="Guide and evaluate students"
            />
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-[#CBD5E1]">
            <p className="text-sm text-[#475569] font-medium">
              © {new Date().getFullYear()} Bahria University. All rights reserved.
            </p>
            <p className="text-xs text-[#64748B] mt-2">
              Select your role above to access the secure portal
            </p>
          </div>
        </div>
      </main>

      {/* Navy-Themed Glassmorphism Login Modal */}
      {selectedRole && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md border-2 border-[#1E40AF]/20 shadow-2xl rounded-md w-full max-w-md p-8 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] transition-colors w-8 h-8 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center font-bold text-xl"
            >
              ×
            </button>

            {/* Modal Header with Logo */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-whiteflex items-center justify-center ">
                  <img 
                    src="/bu-logo.png" 
                    alt="BU Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-white text-xs font-bold">BU</span>';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">
                    {selectedRole === 'board' && !boardSubRole ? 'Select Board Role' : `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Bahria University Portal</p>
                </div>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-[#0F172A] to-[#1E40AF] rounded-full"></div>
            </div>

            {/* Board Sub-Role Selection */}
            {selectedRole === 'board' && !boardSubRole ? (
              <div className="space-y-3">
                <button 
                  onClick={() => setBoardSubRole('panel')}
                  className="w-full p-5 bg-white hover:bg-[#F8FAFC] rounded-md text-left flex items-center gap-4 transition-all border-2 border-[#CBD5E1] hover:border-[#1E40AF] hover:shadow-lg group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0F172A] to-[#1E40AF] rounded-md flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] mb-1">Panel Member</div>
                    <div className="text-xs text-[#64748B]">Internal evaluation and grading</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setBoardSubRole('external')}
                  className="w-full p-5 bg-white hover:bg-[#F8FAFC] rounded-md text-left flex items-center gap-4 transition-all border-2 border-[#CBD5E1] hover:border-[#1E40AF] hover:shadow-lg group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0F172A] to-[#1E40AF] rounded-md flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] mb-1">External Examiner</div>
                    <div className="text-xs text-[#64748B]">Final project defense evaluation</div>
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
                    className="w-full bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-md px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 focus:outline-none transition-all"
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
                    className="w-full bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-md px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 focus:outline-none transition-all"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  />
                </div>

                {/* Board Role Indicator */}
                {selectedRole === 'board' && (
                  <div className="text-xs text-white text-center bg-gradient-to-r from-[#0F172A] to-[#1E40AF] py-2.5 rounded-md">
                    Logging in as: <span className="font-bold capitalize">{boardSubRole}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-[#0F172A] to-[#1E40AF] hover:from-[#1E293B] hover:to-[#1E3A8A] text-white font-bold py-3.5 rounded-md transition-all shadow-lg hover:shadow-xl transform active:scale-98 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                <div className="text-center pt-4 border-t border-[#CBD5E1]">
                  <p className="text-xs text-[#64748B]">
                    Need assistance? Contact <span className="text-[#1E40AF] font-semibold">it-support@bahria.edu.pk</span>
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

// Professional Role Card Component with Navy Accents
const RoleCard = ({ title, icon, onClick, description }) => (
  <div 
    onClick={onClick}
    className="group bg-white border-2 border-[#CBD5E1] p-8 rounded-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#1E40AF]"
  >
    <div className="text-[#1E40AF] mb-5 transition-transform duration-300 group-hover:scale-110">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-[#0F172A] mb-2">
      {title}
    </h3>
    <p className="text-sm text-[#475569] mb-5 leading-relaxed">
      {description}
    </p>
    <div className="pt-4 border-t border-[#E5E7EB]">
      <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wide flex items-center gap-1">
        Click to Login
        <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </span>
    </div>
  </div>
);

export default Landing;