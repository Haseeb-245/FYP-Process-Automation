import React, { useState, useEffect } from 'react';

const StudentDashboard = () => {
  const [file, setFile] = useState(null);
  const [pptFile, setPptFile] = useState(null);
  const [status, setStatus] = useState("Idle"); 
  const [user, setUser] = useState(null);
  const [projectData, setProjectData] = useState(null); // Stores the DB record

  // --- 1. Load User & Project Data ---
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      fetchProjectStatus(parsedUser._id);
    } else {
      alert("You need to login first.");
      window.location.href = '/login'; 
    }
  }, []);

  const fetchProjectStatus = async (studentId) => {
    try {
        const res = await fetch(`http://localhost:5000/api/projects/my-project/${studentId}`);
        const data = await res.json();
        if (data) setProjectData(data);
    } catch (error) {
        console.error("Error fetching project:", error);
    }
  };

  // --- 2. Handlers ---
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handlePptChange = (e) => setPptFile(e.target.files[0]);

  // Phase 1 Submit
  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    await uploadFile(file, 'http://localhost:5000/api/projects/upload');
  };

  // Phase 2 Submit
  const handlePptSubmit = async (e) => {
    e.preventDefault();
    await uploadFile(pptFile, 'http://localhost:5000/api/projects/upload-ppt');
  };

  // Generic Upload Function
  const uploadFile = async (fileToUpload, url) => {
    if (!fileToUpload) return alert("Please select a file!");
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('studentId', user._id);

    try {
        setStatus("Uploading");
        const response = await fetch(url, { method: 'POST', body: formData });
        
        if (response.ok) {
            setStatus("Success");
            alert("Submitted Successfully!");
            fetchProjectStatus(user._id); // Refresh view
        } else {
            alert("Upload failed.");
        }
        setStatus("Idle");
    } catch (error) {
        console.error(error);
        setStatus("Error");
    }
  };

  // --- 3. Render Logic ---
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-8">
      
      {/* HEADER INFO */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            Student Portal
        </h1>
        <p className="text-gray-400">Welcome, {user?.name}</p>
        {projectData && (
            <div className="mt-2 inline-block px-4 py-1 rounded-full bg-gray-800 border border-gray-600 text-sm">
                Current Status: <span className="text-yellow-400 font-bold">{projectData.status}</span>
            </div>
        )}
      </div>

      {/* === PHASE 1 CARD === */}
      <div className={`bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border ${projectData?.status === 'Approved' || projectData?.status === 'Scheduled for Defense' ? 'border-green-500/50 opacity-75' : 'border-gray-700'}`}>
        <h2 className="text-2xl font-bold mb-4 text-purple-400 flex items-center justify-between">
            Phase 1: Proposal
            {projectData?.status === 'Approved' && <span className="text-green-400 text-sm">✔ Completed</span>}
        </h2>

        {/* If not approved yet, show upload form */}
        {projectData?.status !== 'Approved' && !projectData?.defenseDate ? (
            <div className="space-y-4">
                 <div className="p-4 bg-gray-700/30 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">Activity 1.1: Download Template</p>
                    <a href="/proposal_template.docx" download className="text-blue-400 hover:underline text-sm">Download .DOCX</a>
                </div>

                <form onSubmit={handleProposalSubmit} className="space-y-4">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer">
                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"/>
                    </div>
                    <button type="submit" disabled={status === "Uploading"} className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 font-bold transition">
                        {status === "Uploading" ? "Uploading..." : "Submit Proposal"}
                    </button>
                </form>
            </div>
        ) : (
            <p className="text-gray-400 italic">Phase 1 is complete. Proposal Approved.</p>
        )}
      </div>

      {/* === PHASE 2 CARD (Only shows if Phase 1 Approved) === */}
      {(projectData?.status === 'Approved' || projectData?.defenseDate) && (
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-blue-500/50 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>

            <h2 className="text-2xl font-bold mb-4 text-blue-400">Phase 2: Proposal Defense</h2>

            {/* Activity 2.1: Check Date */}
            <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <h3 className="font-semibold text-gray-200">Activity 2.1: Defense Schedule</h3>
                {projectData.defenseDate ? (
                    <p className="text-xl text-green-400 font-bold mt-1">
                        📅 {new Date(projectData.defenseDate).toDateString()}
                    </p>
                ) : (
                    <p className="text-yellow-500 animate-pulse mt-1">⏳ Waiting for Coordinator to assign date...</p>
                )}
            </div>

            {/* Activity 2.2: Upload Presentation */}
            {projectData.defenseDate && (
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-200 mb-2">Activity 2.2: Submit Presentation (PPT)</h3>
                    <form onSubmit={handlePptSubmit} className="space-y-3">
                        <input type="file" onChange={handlePptChange} accept=".ppt,.pptx,.pdf" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                        <button type="submit" className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold transition">
                            Submit Presentation
                        </button>
                    </form>
                </div>
            )}

            {/* Activity 2.3/2.4: Panel Feedback */}
            {projectData.defenseFeedback && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <h3 className="text-red-400 font-bold">Panel Feedback (Activity 2.3)</h3>
                    <p className="text-gray-300 mt-1">{projectData.defenseFeedback}</p>
                    {projectData.status === 'Defense Changes Required' && (
                        <p className="text-sm text-gray-400 mt-2">Please fix the issues and re-upload your presentation above.</p>
                    )}
                </div>
            )}
          </div>
      )}

    </div>
  );
};

export default StudentDashboard;