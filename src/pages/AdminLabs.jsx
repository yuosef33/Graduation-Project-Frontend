import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const COLLECTION_PROCESSING_DELAY_MS = 45000;

const AdminLabs = () => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectingLabId, setCollectingLabId] = useState(null);
  const [loadingFilesLabId, setLoadingFilesLabId] = useState(null);
  const [openFilesLabId, setOpenFilesLabId] = useState(null);
  const [filesByLabId, setFilesByLabId] = useState({});
  const [downloadingStudentKey, setDownloadingStudentKey] = useState(null);
  const collectingRef = useRef(false);

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

  const formatFileSize = (size) => {
    if (size === null || size === undefined) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileGroups = (labId) => Object.entries(filesByLabId[labId] || {});

  const getFileCount = (labId) =>
    getFileGroups(labId).reduce(
      (total, [, files]) => total + (Array.isArray(files) ? files.length : 0),
      0
    );

  const waitForCollectionProcessing = () =>
    new Promise((resolve) => {
      setTimeout(resolve, COLLECTION_PROCESSING_DELAY_MS);
    });

  const fetchLabFiles = async (labId) => {
    setLoadingFilesLabId(labId);

    try {
      const res = await api.get(`/lab/labs/${labId}/files`);
      const fileGroups = res.data?.data && typeof res.data.data === "object"
        ? res.data.data
        : {};

      setFilesByLabId((currentFiles) => ({
        ...currentFiles,
        [labId]: fileGroups,
      }));
      setOpenFilesLabId(labId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load lab files");
    } finally {
      setLoadingFilesLabId(null);
    }
  };

  const handleToggleFiles = async (labId) => {
    if (openFilesLabId === labId) {
      setOpenFilesLabId(null);
      return;
    }

  if (filesByLabId[labId]) {
      setOpenFilesLabId(labId);
      return;
    }

    await fetchLabFiles(labId);
  };
  const handleCollectFiles = async (labId) => {
    if (collectingRef.current) return; // prevent double trigger
    collectingRef.current = true;
    setCollectingLabId(labId);

    try {
      await api.post(`/lab/collectAll/${labId}`);
      toast.success("File collection started. Preparing files...");
      await waitForCollectionProcessing();
      setLabs((currentLabs) =>
        currentLabs.map((lab) =>
          lab.labId === labId ? { ...lab, collected: true } : lab
        )
      );
      toast.success("Files are ready");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to collect files");
    } finally {
      setCollectingLabId(null);
      collectingRef.current = false;
    }
  };

  const getDownloadFileName = (contentDisposition, labId, studentId) => {
    const match = contentDisposition?.match(/filename="?([^"]+)"?/);
    return match?.[1] || `student-${studentId}-lab-${labId}.zip`;
  };

  const handleDownloadStudentFiles = async (labId, studentId) => {
    const downloadKey = `${labId}-${studentId}`;
    setDownloadingStudentKey(downloadKey);

    try {
      const res = await api.get(`/lab/labs/${labId}/files/${studentId}/download`, {
        responseType: "blob",
      });
      const fileName = getDownloadFileName(
        res.headers["content-disposition"],
        labId,
        studentId
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download files");
    } finally {
      setDownloadingStudentKey(null);
    }
  };

  const selectedLab = labs.find((lab) => lab.labId === openFilesLabId);
  const selectedFileGroups = selectedLab ? getFileGroups(selectedLab.labId) : [];
  const selectedFileCount = selectedLab ? getFileCount(selectedLab.labId) : 0;

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
                    <div className="mt-5 flex flex-col gap-3">
                      <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium text-center">
                        Collected
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFiles(lab.labId)}
                        disabled={loadingFilesLabId === lab.labId}
                        className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {loadingFilesLabId === lab.labId
                          ? "Loading Files..."
                          : openFilesLabId === lab.labId
                            ? "Files Open"
                            : "View Files"}
                      </button>
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

      {selectedLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 px-4 py-6">
          <div className="w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-xs font-medium text-gray-500">Collected Files</p>
                <h2 className="text-lg font-semibold text-gray-900 mt-1">
                  {selectedLab.labName}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFileCount} file{selectedFileCount === 1 ? "" : "s"} across{" "}
                  {selectedFileGroups.length} user
                  {selectedFileGroups.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenFilesLabId(null)}
                className="h-9 w-9 shrink-0 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                aria-label="Close files"
              >
                X
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
              {selectedFileGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-500">No files found for this lab.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {selectedFileGroups.map(([userId, files]) => {
                    const userFiles = Array.isArray(files) ? files : [];

                    return (
                      <section key={userId} className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              User #{userId}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {userFiles.length} file{userFiles.length === 1 ? "" : "s"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadStudentFiles(selectedLab.labId, userId)}
                            disabled={
                              userFiles.length === 0 ||
                              downloadingStudentKey === `${selectedLab.labId}-${userId}`
                            }
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {downloadingStudentKey === `${selectedLab.labId}-${userId}`
                              ? "Downloading..."
                              : "Download All"}
                          </button>
                        </div>

                        {userFiles.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-gray-500">
                            No files for this user.
                          </p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {userFiles.map((file, index) => (
                              <div
                                key={`${userId}-${file.fileName}-${index}`}
                                className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {file.downloadUrl}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600 md:text-right">
                                  {formatFileSize(file.size)}
                                </p>
                                <a
                                  href={file.downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                >
                                  Download
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLabs;
