import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Landing from './pages/Landing';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import BoardDashboard from './pages/board/BoardDashboard';

// ✅ FIX: Using the misspelled filename as you requested
import ExternalExaminerDashboard from './pages/external/ExternalExaminerDashbaord'; 

import FypCoordinator, { 
  Dashboard, 
  AllProjects, 
  ScheduleDefense,
  InitialDefenseEvaluation,
  SrsSdsCoordinator, 
  FinalDefenseCoordinator 
} from "./pages/coordinator/FypCoordinator";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        
        {/* Coordinator Routes */}
        <Route path="/coordinator" element={<FypCoordinator />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="all-projects" element={<AllProjects />} />
          <Route path="schedule-defense" element={<ScheduleDefense />} />
          <Route path="initial-defense-evaluation" element={<InitialDefenseEvaluation />} />
          <Route path="srs-sds-evaluation" element={<SrsSdsCoordinator />} />
          <Route path="final-defense" element={<FinalDefenseCoordinator />} />
        </Route>

        <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        
        {/* Panel Member Route */}
        <Route path="/board/dashboard" element={<BoardDashboard />} />
        
        {/* ✅ External Examiner Route */}
        <Route path="/external/dashboard" element={<ExternalExaminerDashboard />} />
        
        <Route path="*" element={<div className="text-white p-10">404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;