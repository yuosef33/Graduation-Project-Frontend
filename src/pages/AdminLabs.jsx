import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const AdminLabs = () => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectingLabId, setCollectingLabId] = useState(null);

  useEffect(() => {
    api.get("/lab/getMyLabs")
      .then((res) => {
        const payload = res.data;
        const myLabs = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        setLabs(myLabs);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load your labs");
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "RUNNING":
        return "bg-green-100 text-green-700 border-green-200";
      case "CREATED":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "FINISHED":
        return "bg-gray-200 text-gray-700 border-gray-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString();
  };

  const handleCollectFiles = async (labId) => {
    setCollectingLabId(labId);

    try {
      await api.post(`/lab/collectAll/${labId}`);
      setLabs((currentLabs) =>
        currentLabs.map((lab) =>
          lab.labId === labId ? { ...lab, collected: true } : lab
        )
      );
      toast.success("Files collected successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to collect files");
    } finally {
      setCollectingLabId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Created Labs</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              View labs you created and track their status
            </p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            &lt;- Back
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-white p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-4/5 mb-6" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No labs created yet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Created labs will appear here with their current status.
            </p>
            <button
              onClick={() => navigate("/admin/create-lab")}
              className="px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200"
            >
              Create Lab
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <div
                key={lab.labId}
                className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">{lab.labName}</h2>
                    <p className="text-xs text-gray-500 mt-1">Lab #{lab.labId}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusBadge(lab.labStatus)}`}
                  >
                    {lab.labStatus || "UNKNOWN"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 min-h-10 mb-5">
                  {lab.labDescription || "No description provided."}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lab.labDuration ?? "-"} min
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs text-gray-500 mb-1">Template</p>
                    <p className="text-sm font-medium text-gray-900">
                      #{lab.labTemplateId ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Start Time</p>
                    <p className="text-gray-800">{formatDateTime(lab.labStartTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">End Time</p>
                    <p className="text-gray-800">{formatDateTime(lab.labEndTime)}</p>
                  </div>
                </div>

                {lab.labStatus === "FINISHED" && (
                  lab.collected ? (
                    <div className="mt-5 w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium text-center">
                      Collected
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCollectFiles(lab.labId)}
                      disabled={collectingLabId === lab.labId}
                      className="mt-5 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {collectingLabId === lab.labId ? "Collecting..." : "Collect Files"}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLabs;
