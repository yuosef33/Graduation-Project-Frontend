import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AdminHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Create Template */}
          <div
            onClick={() => navigate("/admin/create-template")}
            className="cursor-pointer rounded-2xl p-6 border-2 border-blue-200 
                       bg-gradient-to-br from-blue-50 to-blue-100
                       hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 
                       transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 flex items-center justify-center bg-white border border-blue-200 rounded-xl">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6v6l4 2" />
                </svg>
              </div>

              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full border border-blue-300">
                TEMPLATE
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Create Lab Template
            </h2>

            <p className="text-sm text-gray-700">
              Start a VM and save it as reusable template
            </p>
          </div>

          {/* Create Lab */}
          <div
            onClick={() => navigate("/admin/create-lab")}
            className="cursor-pointer rounded-2xl p-6 border-2 border-green-200 
                       bg-gradient-to-br from-green-50 to-green-100
                       hover:border-green-400 hover:shadow-lg hover:-translate-y-1 
                       transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 flex items-center justify-center bg-white border border-green-200 rounded-xl">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v16m8-8H4" />
                </svg>
              </div>

              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full border border-green-300">
                LAB
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Create Lab
            </h2>

            <p className="text-sm text-gray-700">
              Configure and schedule a new lab exam
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          Session active
        </div>

      </div>
    </div>
  );
};

export default AdminHome;