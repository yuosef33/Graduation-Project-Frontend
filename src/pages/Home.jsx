import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-8 h-8 bg-gray-900 rounded-lg" />
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900
              transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>

        {/* welcome */}
        <div className="py-6">
          <p className="text-sm text-gray-400 mb-1">Logged in as</p>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">
            Welcome back 👋
          </h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>

        {/* divider */}
        <div className="h-px bg-gray-100 my-6" />

        {/* status */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-sm text-gray-500">Session active</span>
        </div>
      </div>
    </div>
  );
};

export default Home;