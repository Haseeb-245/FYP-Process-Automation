// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Add BrowserRouter
import Login from './pages/Login';
import Landing from './pages/Landing';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import FypCoordinator, { 
  Dashboard, 
  PendingProposals, 
  AllProjects, 
  AssignGroups, 
  ScheduleDefense, 
  ManagePanels 
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
          <Route path="proposals" element={<PendingProposals />} />
          <Route path="all-projects" element={<AllProjects />} />
          <Route path="assign-groups" element={<AssignGroups />} />
          <Route path="schedule-defense" element={<ScheduleDefense />} />
          <Route path="panels" element={<ManagePanels />} />
        </Route>

        {/* 5. Supervisor Dashboard */}
        <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        
        {/* 6. Board Dashboard */}
        <Route path="/board/dashboard" element={<div className="text-white p-10">FYP Board Dashboard (Coming Soon)</div>} />
        
        {/* 7. 404 Page */}
        <Route path="*" element={<div className="text-white p-10">404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;