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

    // --- 4. BOARD LOGIN (Still Dummy) ---
    if (selectedRole === 'board') {
      console.log(`Logging in as ${selectedRole} ${boardSubRole ? `(${boardSubRole})` : ''}`, credentials);
      navigate('/board/dashboard');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="z-10 w-full max-w-6xl text-center">
        <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
          FYP Management System
        </h1>
        <p className="text-slate-400 mb-12 text-lg">Select your portal to continue</p>

        {/* THE 4 MAIN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Student */}
          <RoleCard 
            title="Student" 
            icon="🎓" 
            color="group-hover:text-blue-400"
            border="hover:border-blue-500/50"
            onClick={() => handleRoleSelect('student')}
          />

          {/* Card 2: FYP Board */}
          <RoleCard 
            title="FYP Board" 
            icon="⚖️" 
            color="group-hover:text-red-400"
            border="hover:border-red-500/50"
            onClick={() => handleRoleSelect('board')}
          />

          {/* Card 3: Coordinator */}
          <RoleCard 
            title="Coordinator" 
            icon="👔" 
            color="group-hover:text-emerald-400"
            border="hover:border-emerald-500/50"
            onClick={() => handleRoleSelect('coordinator')}
          />

          {/* Card 4: Supervisor */}
          <RoleCard 
            title="Supervisor" 
            icon="👓" 
            color="group-hover:text-amber-400"
            border="hover:border-amber-500/50"
            onClick={() => handleRoleSelect('supervisor')}
          />
        </div>
      </div>

      {/* LOGIN MODAL OVERLAY */}
      {selectedRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative transform transition-all scale-100">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6 capitalize text-white flex items-center gap-2">
              {selectedRole === 'board' && !boardSubRole ? 'Select Board Role' : `${selectedRole} Login`}
            </h2>

            {/* LOGIC: FYP BOARD SUB-SELECTION */}
            {selectedRole === 'board' && !boardSubRole ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setBoardSubRole('panel')}
                  className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-left flex items-center gap-4 transition-all border border-transparent hover:border-red-400/50"
                >
                  <span className="text-2xl">📋</span>
                  <div>
                    <div className="font-bold text-white">Panel Member</div>
                    <div className="text-xs text-slate-400">Internal evaluation and grading</div>
                  </div>
                </button>
                <button 
                  onClick={() => setBoardSubRole('external')}
                  className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-left flex items-center gap-4 transition-all border border-transparent hover:border-red-400/50"
                >
                  <span className="text-2xl">🌍</span>
                  <div>
                    <div className="font-bold text-white">External Examiner</div>
                    <div className="text-xs text-slate-400">Final year project defense</div>
                  </div>
                </button>
              </div>
            ) : (
              /* ACTUAL LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Dynamic Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {selectedRole === 'student' ? 'Enrollment No.' : 'User ID / Email'}
                  </label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder={selectedRole === 'student' ? 'e.g. 01-134192-023' : 'Enter ID'}
                    value={credentials.id}
                    onChange={(e) => setCredentials({...credentials, id: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  />
                </div>

                {selectedRole === 'board' && (
                  <div className="text-xs text-slate-500 text-center">
                    Logging in as: <span className="text-red-300 font-semibold capitalize">{boardSubRole}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Verifying...' : 'Access Portal'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Card Component
const RoleCard = ({ title, icon, color, border, onClick }) => (
  <div 
    onClick={onClick}
    className={`group bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${border}`}
  >
    <div className={`text-6xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
      {icon}
    </div>
    <h3 className={`text-xl font-bold text-slate-200 transition-colors ${color}`}>
      {title}
    </h3>
    <p className="text-sm text-slate-500 mt-2">Click to login</p>
  </div>
);

export default Landing;