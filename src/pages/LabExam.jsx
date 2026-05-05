import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VncScreen } from "react-vnc";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function LabExam() {
  const { labId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState("loading");
  const [vmData, setVmData] = useState(null);
  const [lab, setLab] = useState(null);
  const [vncKey, setVncKey] = useState(0);
  const [connecting, setConnecting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [labFinished, setLabFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Starting your VM...");

  const retryRef = useRef(null);
  const vncContainerRef = useRef(null);
  const startingRef = useRef(false);
  const countdownRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (step !== "vnc") return;

    const messages = [
      { time: 0, msg: "Starting your VM..." },
      { time: 20000, msg: "OS is booting..." },
      { time: 50000, msg: "Starting VNC server..." },
      { time: 90000, msg: "Almost ready, connecting..." },
    ];

    const timers = messages.map(({ time, msg }) =>
      setTimeout(() => setLoadingMessage(msg), time)
    );

    return () => timers.forEach(clearTimeout);
  }, [step]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const initExam = async () => {
      if (startingRef.current) return;
      startingRef.current = true;

      try {
        const labsRes = await api.get("/student/all-labs");
        const allLabs = labsRes.data.data;
        const currentLab = allLabs.find((item) => item.labId === parseInt(labId));

        if (!currentLab) {
          toast.error("Lab not found");
          navigate("/home");
          return;
        }

        if (currentLab.labStatus === "FINISHED") {
          setLabFinished(true);
          return;
        }

        if (currentLab.labStatus !== "RUNNING") {
          toast.error("This lab is not active");
          navigate("/home");
          return;
        }

        setLab(currentLab);

        const endTime = new Date(currentLab.labEndTime);
        const now = new Date();
        const secondsLeft = Math.floor((endTime - now) / 1000);

        if (secondsLeft <= 0) {
          setLabFinished(true);
          return;
        }

        setTimeLeft(secondsLeft);

        const vmRes = await api.get(`/student/my-vm?labId=${labId}`);
        if (vmRes.data.data) {
          setConnecting(true);
          setVmData(vmRes.data.data);
          setStep("vnc");
        } else {
          setStep("starting");
          const startRes = await api.post(`/student/start-labTest?labId=${labId}`);
          setConnecting(true);
          setVmData(startRes.data.data);
          setStep("vnc");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to start exam");
        navigate("/home");
      }
    };

    initExam();
  }, [labId, navigate]);

  useEffect(() => {
    if (step !== "vnc" || !lab?.labEndTime) return;

    const syncTimeLeft = () => {
      const endTime = new Date(lab.labEndTime).getTime();
      const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

      setTimeLeft(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(countdownRef.current);
        setLabFinished(true);
      }
    };

    syncTimeLeft();
    countdownRef.current = setInterval(syncTimeLeft, 1000);

    document.addEventListener("visibilitychange", syncTimeLeft);
    window.addEventListener("focus", syncTimeLeft);

    return () => {
      clearInterval(countdownRef.current);
      document.removeEventListener("visibilitychange", syncTimeLeft);
      window.removeEventListener("focus", syncTimeLeft);
    };
  }, [step, lab?.labEndTime]);

  useEffect(() => {
    if (step !== "vnc") return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get("/student/all-labs");
        const currentLab = res.data.data.find((item) => item.labId === parseInt(labId));

        if (currentLab?.labStatus === "FINISHED") {
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          setLabFinished(true);
        }
      } catch {
        // Ignore transient polling failures and try again on the next interval.
      }
    }, 30000);

    return () => clearInterval(pollingRef.current);
  }, [step, labId]);

  useEffect(() => {
    if (step !== "vnc") return;

    const firstRetry = setTimeout(() => {
      setVncKey((prev) => prev + 1);
    }, 0);

    retryRef.current = setInterval(() => {
      setVncKey((prev) => prev + 1);
    }, 10000);

    return () => {
      clearTimeout(firstRetry);
      clearInterval(retryRef.current);
    };
  }, [step]);

  const handleVncConnect = () => {
    clearInterval(retryRef.current);
    setConnecting(false);
    toast.success("Connected to VM");
  };

  const handleVncDisconnect = () => {
    if (!connecting) setConnecting(true);
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await vncContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Fullscreen is not available");
    }
  };

  const handleExitExam = () => {
    const confirmed = window.confirm(
      "Exit the exam page? Your VM may keep running until the lab ends."
    );

    if (confirmed) {
      navigate("/home");
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--:--";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
  };

  const formatDateTime = (value) => {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString();
  };

  const vncHost = vmData?.publicIp || vmData?.ip;

  if (labFinished) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center w-[350px]">
          <h2 className="text-2xl font-bold mb-4">Exam Finished</h2>
          <p className="text-gray-500 mb-6">Your work has been submitted.</p>
          <button
            onClick={() => navigate("/home")}
            className="bg-black text-white px-6 py-3 rounded-xl w-full"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (step === "loading" || step === "starting") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white p-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center max-w-md w-full">
          <div className="animate-spin w-10 h-10 border-2 border-white border-t-transparent rounded-full mx-auto mb-5" />
          <p className="text-lg font-medium">{loadingMessage}</p>
          <p className="text-sm text-gray-400 mt-3">
            Keep this page open while your exam machine is prepared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                  {lab?.labStatus || "RUNNING"}
                </span>
                <span className="text-xs text-gray-500">Lab #{lab?.labId}</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">{lab?.labName}</h1>
              <p className="text-sm text-gray-600 mt-2 max-w-3xl">
                {lab?.labDescription || "No description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Time Left</p>
                <p className="font-mono text-lg font-semibold text-gray-900">
                  {formatTime(timeLeft)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-sm font-semibold text-gray-900">
                  {lab?.labDuration ?? "-"} min
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 mt-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">Start Time</p>
              <p className="text-sm text-gray-800">{formatDateTime(lab?.labStartTime)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">End Time</p>
              <p className="text-sm text-gray-800">{formatDateTime(lab?.labEndTime)}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="rounded-xl border border-gray-200 bg-white p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <p className="text-xs text-gray-500 mb-1">Instructions</p>
              <p className="text-sm font-semibold text-gray-900">
                {showInstructions ? "Hide details" : "Show details"}
              </p>
            </button>
            <button
              type="button"
              onClick={handleExitExam}
              className="rounded-xl border border-red-100 bg-red-50 p-3 text-left text-red-700 hover:bg-red-100 transition-colors"
            >
              <p className="text-xs text-red-500 mb-1">Leave Page</p>
              <p className="text-sm font-semibold">Exit Exam</p>
            </button>
          </div>
        </div>

        {showInstructions && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-amber-900 mb-2">Lab Instructions</h2>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">
              {lab?.labInstructions || "No instructions provided."}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connecting ? "bg-yellow-400" : "bg-green-500"}`} />
              <span className="text-sm font-medium text-gray-700">
                {connecting ? "Connecting to exam machine" : "Exam machine connected"}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>

          <div
            ref={vncContainerRef}
            className="bg-black rounded-2xl overflow-hidden relative"
            style={{ height: "min(72vh, 760px)", minHeight: "420px" }}
          >
            {connecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mb-3" />
                <p className="text-white text-sm font-medium">{loadingMessage}</p>
                <p className="text-gray-500 text-xs mt-2">please wait...</p>
              </div>
            )}

            {vncHost && (
              <VncScreen
                key={vncKey}
                url={`ws://${vncHost}:6080`}
                scaleViewport
                resizeSession
                style={{ width: "100%", height: "100%" }}
                onConnect={handleVncConnect}
                onDisconnect={handleVncDisconnect}
              />
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="absolute bottom-3 right-3 z-20 bg-white/90 hover:bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
