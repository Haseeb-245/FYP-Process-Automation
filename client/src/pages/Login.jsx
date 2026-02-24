import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Make sure your backend port is correct (usually 5000)
      const response = await fetch(`https://fyp-process-automation.vercel.app/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userInfo', JSON.stringify(data.user));

        // --- FIX: REDIRECTION LOGIC ---
        if (data.user.role === 'student') {
          navigate('/student/dashboard');
        } else if (data.user.role === 'supervisor') {
          navigate('/supervisor/dashboard');
        } else if (data.user.role === 'coordinator') {
          navigate('/coordinator/dashboard');
        } else if (data.user.role === 'board') {
          navigate('/board/dashboard');
        } else if (data.user.role === 'external') {
          // ✅ This explicitly sends external examiners to their own route
          navigate('/external/dashboard');
        } else {
          alert('Unknown role: ' + data.user.role);
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Server error during login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm">Select Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
            >
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
              <option value="coordinator">Coordinator</option>
              <option value="board">Panel Member</option>
              <option value="external">External Examiner</option> {/* Ensure this exists */}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm">Email / Enrollment</label>
            <input 
              type="text" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;