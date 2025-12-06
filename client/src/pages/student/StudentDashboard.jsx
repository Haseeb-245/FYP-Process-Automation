import React, { useState, useEffect } from 'react';
// We don't strictly need axios if we use fetch, but you can keep it if you prefer

const StudentDashboard = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("Idle"); // Idle, Uploading, Success, Error
  const [user, setUser] = useState(null);

  // --- 1. Get Logged-In User Info on Page Load ---
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    } else {
      // If no user is found in storage, force them to login
      alert("You need to login first.");
      window.location.href = '/login'; 
    }
  }, []);

  // --- Handle File Selection ---
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first!");
    if (!user) return alert("User not identified. Please login again.");

    const formData = new FormData();
    formData.append('file', file);
    
    // FIX: Send the REAL ID from the database (user._id)
    // This solves the issue where the DB rejected the fake ID
    formData.append('studentId', user._id); 

    try {
      setStatus("Uploading");
      
      // Replace with your actual API URL
      const response = await fetch('http://localhost:5000/api/projects/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("Success");
        alert("Success! Your Proposal has been sent to the Coordinator.");
      } else {
        setStatus("Error");
        console.error("Server Error:", data);
        alert("Upload failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Network Error:", error);
      setStatus("Error");
      alert("Network Error. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      
      {/* --- Main Card --- */}
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700">
        
        {/* Updated Title for Phase 1 */}
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Phase 1: Project Initialization
        </h1>
        <p className="text-gray-400 mb-8">
          Complete the activities below to register your group.
        </p>

        {/* --- Activity 1.1: Download --- */}
        <div className="mb-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h2 className="text-lg font-semibold text-purple-300 mb-2">
            Activity 1.1: Download Proposal Form
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Get the official FYP proposal format, fill it with your group details and idea.
          </p>
          
          <a 
            href="/proposal_template.docx" 
            download
            className="inline-block w-full py-2 text-center bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition duration-200 font-medium"
          >
            Download .DOCX File
          </a>
        </div>

        {/* --- Activity 1.3: Submit --- */}
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h2 className="text-lg font-semibold text-purple-300 mb-2">
            Activity 1.3: Submit Idea to Coordinator
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer relative">
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-gray-400">
                {file ? (
                  <span className="text-green-400 font-semibold">{file.name}</span>
                ) : (
                  <span>Click to browse or drag filled proposal here</span>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status === "Uploading"}
              className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg transition duration-200 ${
                status === "Uploading" 
                  ? "bg-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              }`}
            >
              {status === "Uploading" ? "Sending to Coordinator..." : "Submit to Coordinator"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;