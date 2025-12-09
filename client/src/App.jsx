import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Landing from './pages/Landing';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
// --- RE-ADDED IMPORT ---
import BoardDashboard from './pages/board/BoardDashboard'; 

import FypCoordinator, { 
  Dashboard, 
  AllProjects, 
  ScheduleDefense,
   InitialDefenseEvaluation,
   SrsSdsCoordinator, 
} from "./pages/coordinator/FypCoordinator";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* 2. Login Page */}
        <Route path="/login" element={<Login />} />

        {/* 3. Student Dashboard */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        
        {/* 4. Coordinator Dashboard */}
        <Route path="/coordinator" element={<FypCoordinator />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
    
          <Route path="all-projects" element={<AllProjects />} />
      
          <Route path="schedule-defense" element={<ScheduleDefense />} />
        <Route path="initial-defense-evaluation" element={<InitialDefenseEvaluation />} />
         <Route path="srs-sds-evaluation" element={<SrsSdsCoordinator />} />
</Route>

        

        {/* 5. Supervisor Dashboard */}
        <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        
        {/* 6. Board Dashboard (Panel Member) - RE-ADDED ROUTE */}
        <Route path="/board/dashboard" element={<BoardDashboard />} />
        
        {/* 7. 404 Page */}
        <Route path="*" element={<div className="text-white p-10">404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;