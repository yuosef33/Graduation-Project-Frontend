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

  const handleAttendExam = (lab) => {
    const confirmed = window.confirm(
      `Attend "${lab.labName}" now? Your exam VM will start and the timer will continue.`
    );

    if (confirmed) {
      navigate(`/exam/${lab.labId}`);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "RUNNING":
        return "bg-green-50/70 border-green-200";
      case "CREATED":
        return "bg-yellow-50/70 border-yellow-200";
      case "FINISHED":
        return "bg-gray-100 border-gray-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "RUNNING":
        return "bg-green-100 text-green-700";
      case "CREATED":
        return "bg-yellow-100 text-yellow-700";
      case "FINISHED":
        return "bg-gray-200 text-gray-600";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "RUNNING": return "🟢";
      case "CREATED": return "🟡";
      case "FINISHED": return "⚫";
      default: return "⚫";
    }
  };

  const getProgress = (lab) => {
    if (!lab.labStartTime || !lab.labEndTime) return 0;

    const start = new Date(lab.labStartTime).getTime();
    const end = new Date(lab.labEndTime).getTime();
    const now = new Date().getTime();

    if (isNaN(start) || isNaN(end)) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;

    return Math.floor(((now - start) / (end - start)) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Labs</h1>
            <p className="text-gray-600 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>

        {/* Skeleton */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-200 animate-pulse bg-gray-100">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-300 rounded w-full mb-2" />
                <div className="h-3 bg-gray-300 rounded w-2/3 mb-4" />
                <div className="h-8 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            No labs available
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <div
                key={lab.labTemplateId}
                className={`rounded-2xl p-6 border transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${getStatusStyle(lab.labStatus)}`}
              >
                {/* title */}
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">

                    {/* clean icon */}
                    <span className="w-8 h-8 flex items-center justify-center bg-transparent">
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 7l9-4 9 4-9 4-9-4zm0 7l9 4 9-4M3 7v7m18-7v7" />
                      </svg>
                    </span>

                    {lab.labName}
                  </h2>

                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusBadge(lab.labStatus)}`}>
                    {getStatusIcon(lab.labStatus)} {lab.labStatus}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-5">
                  {lab.labDescription}
                </p>

                {/* duration + time */}
                <div className="flex justify-between items-center mb-4">
                  <div className="bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 border">
                    ⏱ {lab.labDuration} min
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    {new Date(lab.labStartTime).toLocaleString()}
                  </div>
                </div>

                {/* progress */}
                <div className="mb-5">
                  <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${getProgress(lab)}%` }}
                    />
                  </div>
                </div>

                {/* actions */}
                {lab.labStatus === "RUNNING" && (
                  <button
                    onClick={() => handleAttendExam(lab)}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
                  >
                    Attend Exam
                  </button>
                )}

                {lab.labStatus === "CREATED" && (
                  <div className="text-center text-gray-500 text-sm py-2">
                    Starts soon
                  </div>
                )}

                {lab.labStatus === "FINISHED" && (
                  <div className="text-center text-gray-500 text-sm py-2">
                    Finished
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
