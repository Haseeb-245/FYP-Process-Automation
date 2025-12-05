import React from 'react'; // <--- THIS WAS MISSING
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

// Placeholder components
const StudentDashboard = () => <h1 className="text-2xl p-10">Student Dashboard - Welcome!</h1>;
const BoardDashboard = () => <h1 className="text-2xl p-10">FYP Board Dashboard - Welcome!</h1>;
const SupervisorDashboard = () => <h1 className="text-2xl p-10">Supervisor Dashboard - Welcome!</h1>;
const CoordinatorDashboard = () => <h1 className="text-2xl p-10">Coordinator Dashboard - Welcome!</h1>;

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/board/dashboard" element={<BoardDashboard />} />
        <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;