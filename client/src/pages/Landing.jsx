import React from 'react'; 
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const roles = [
    { title: "Student", desc: "Submit Proposal & Logs", color: "bg-blue-600" },
    { title: "Supervisor", desc: "Evaluate Students", color: "bg-green-600" },
    { title: "Coordinator", desc: "Manage Schedules", color: "bg-purple-600" },
    { title: "Board", desc: "External Evaluation", color: "bg-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">FYP Management System</h1>
      <p className="mb-12 text-gray-600">Select your role to login</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {roles.map((role) => (
          <div 
            key={role.title}
            onClick={() => navigate("/login", { state: { role: role.title.toLowerCase() } })}
            className={`${role.color} text-white p-8 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center h-48`}
          >
            <h2 className="text-2xl font-bold">{role.title}</h2>
            <p className="mt-2 opacity-90">{role.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;