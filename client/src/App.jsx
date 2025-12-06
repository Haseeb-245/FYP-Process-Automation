import React from 'react';
import { Routes, Route } from 'react-router-dom'; 

import Login from './pages/Login';
import Landing from './pages/Landing';
import StudentDashboard from './pages/student/StudentDashboard';

function App() {
  return (
    <Routes>
      {/* 1. Landing Page (The Home Page) */}
      <Route path="/" element={<Landing />} />

      {/* 2. Login Page (Must be /login) */}
      <Route path="/login" element={<Login />} />

      {/* 3. Student Dashboard (The path you are trying to reach) */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      
      {/* --- Other Roles (Placeholders) --- */}
      <Route path="/board/*" element={<div className="text-white p-10">FYP Board Dashboard (Coming Soon)</div>} />
      <Route path="/coordinator/*" element={<div className="text-white p-10">Coordinator Area</div>} />
      <Route path="/supervisor/*" element={<div className="text-white p-10">Supervisor Area</div>} />

      {/* Optional: Catch-all for 404 Not Found */}
      <Route path="*" element={<div className="text-white p-10">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;