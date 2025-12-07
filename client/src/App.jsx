import React from 'react';
import { Routes, Route } from 'react-router-dom'; 

import Login from './pages/Login';
import Landing from './pages/Landing';
import StudentDashboard from './pages/student/StudentDashboard';
import BoardDashboard from './pages/board/BoardDashboard'; // <--- IMPORT THIS

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      {/* Student Route */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />

      {/* Board Route - FIXED */}
      <Route path="/board/dashboard" element={<BoardDashboard />} />
      
      {/* Other Roles (Placeholders) */}
      <Route path="/coordinator/*" element={<div className="text-white p-10">Coordinator Area</div>} />
      <Route path="/supervisor/*" element={<div className="text-white p-10">Supervisor Area</div>} />

      <Route path="*" element={<div className="text-white p-10">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;