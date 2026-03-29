import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/all-labs")
      .then(res => setLabs(res.data.data))
      .catch(() => toast.error("Failed to load labs"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "RUNNING":  return "bg-green-100 text-green-700";
      case "CREATED":  return "bg-yellow-100 text-yellow-700";
      case "FINISHED": return "bg-gray-100 text-gray-500";
      default:         return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Labs</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome, {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>

        {/* labs list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : labs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">No labs available yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {labs.map((lab) => (
              <div key={lab.labTemplateId}
                className="bg-white rounded-2xl border border-gray-100 p-6">

                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">{lab.labName}</h2>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusStyle(lab.labStatus)}`}>
                    {lab.labStatus}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-4">{lab.labDescription}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span>⏱ {lab.labDuration} min</span>
                  <span>🗓 {new Date(lab.labStartTime).toLocaleString()}</span>
                </div>

                {lab.labStatus === "RUNNING" && (
                  <button
                    onClick={() => navigate(`/exam/${lab.labId}`)}
                    className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium
                      rounded-xl hover:bg-gray-800 transition-all duration-200"
                  >
                    Attend Exam
                  </button>
                )}

                {lab.labStatus === "CREATED" && (
                  <div className="w-full py-2.5 bg-gray-50 text-gray-400 text-sm text-center rounded-xl">
                    Starts {new Date(lab.labStartTime).toLocaleString()}
                  </div>
                )}

                {lab.labStatus === "FINISHED" && (
                  <div className="w-full py-2.5 bg-gray-50 text-gray-400 text-sm text-center rounded-xl">
                    Lab ended
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;