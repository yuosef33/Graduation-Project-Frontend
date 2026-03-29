import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VncScreen } from "react-vnc";
import api from "../api/axios";
import toast from "react-hot-toast";

const LabExam = () => {
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
  const [timeLeft, setTimeLeft] = useState(null); // seconds remaining
  const retryRef = useRef(null);
  const vncContainerRef = useRef(null);
  const startingRef = useRef(false);
  const countdownRef = useRef(null);
  const pollingRef = useRef(null);

  // on load — check VM and load lab
  useEffect(() => {
    const initExam = async () => {
      if (startingRef.current) return;
      startingRef.current = true;

      try {
        const labsRes = await api.get("/student/all-labs");
        const allLabs = labsRes.data.data;
        const currentLab = allLabs.find(l => l.labId === parseInt(labId));

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

        // calculate initial time left
        const endTime = new Date(currentLab.labEndTime);
        const now = new Date();
        const secondsLeft = Math.floor((endTime - now) / 1000);

        if (secondsLeft <= 0) {
          setLabFinished(true);
          return;
        }

        setTimeLeft(secondsLeft);

        // check if VM already exists
        const vmRes = await api.get(`/student/my-vm?labId=${labId}`);
        if (vmRes.data.data) {
          setVmData(vmRes.data.data);
          setStep("vnc");
        } else {
          setStep("starting");
          const startRes = await api.post(`/student/start-labTest?labId=${labId}`);
          setVmData(startRes.data.data);
          setStep("vnc");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to start exam");
        navigate("/home");
      }
    };

    initExam();
  }, [labId]);

  // countdown timer — runs every second
  useEffect(() => {
    if (step !== "vnc" || timeLeft === null) return;

    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setLabFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [step, timeLeft]);

  // polling every 30 seconds — safety net for early finish
  useEffect(() => {
    if (step !== "vnc") return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get("/student/all-labs");
        const allLabs = res.data.data;
        const currentLab = allLabs.find(l => l.labId === parseInt(labId));

        if (currentLab?.labStatus === "FINISHED") {
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          setLabFinished(true);
        }
      } catch {
        // ignore polling errors
      }
    }, 30000);

    return () => clearInterval(pollingRef.current);
  }, [step, labId]);

  // VNC auto retry
  useEffect(() => {
    if (step === "vnc") {
      setConnecting(true);
      retryRef.current = setInterval(() => {
        setVncKey(prev => prev + 1);
      }, 5000);
    }
    return () => clearInterval(retryRef.current);
  }, [step]);

  // fullscreen exit via ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleVncConnect = () => {
    clearInterval(retryRef.current);
    setConnecting(false);
    toast.success("Connected to exam VM!");
  };

  const handleVncDisconnect = () => {
    if (!connecting) setConnecting(true);
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        await vncContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        toast.error("Fullscreen not supported");
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // format seconds → HH:MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
  };

  // color changes as time runs out
  const getTimerColor = () => {
    if (timeLeft === null) return "text-gray-400";
    if (timeLeft < 300) return "text-red-500";   // last 5 min → red
    if (timeLeft < 600) return "text-orange-500"; // last 10 min → orange
    return "text-gray-700";
  };

  // exam finished screen
  if (labFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-green-50 rounded-2xl mx-auto mb-5 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Exam Finished</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your exam time has ended. Your work has been saved.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="w-full py-3 bg-gray-900 text-white text-sm font-medium
              rounded-xl hover:bg-gray-800 transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // loading screen
  if (step === "loading" || step === "starting") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full">
          <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {step === "starting" ? "Starting your VM..." : "Loading exam..."}
          </h2>
          <p className="text-sm text-gray-500">
            {step === "starting"
              ? "This may take a minute. Please wait."
              : "Checking your session..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* top bar */}
      {lab && (
        <div className="bg-white border-b border-gray-100 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">

            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-sm font-semibold text-gray-900">{lab.labName}</h1>
                <p className="text-xs text-gray-500">{lab.labDescription}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-4">

              {/* countdown timer */}
              <div className={`font-mono text-sm font-semibold ${getTimerColor()}`}>
                ⏱ {formatTime(timeLeft)}
              </div>

              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg
                  hover:bg-gray-50 transition-all text-gray-600"
              >
                {showInstructions ? "Hide Instructions" : "Show Instructions"}
              </button>

              <button
                onClick={() => navigate("/home")}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                ← Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* instructions panel */}
      {showInstructions && lab && (
        <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Instructions</h3>
            <p className="text-sm text-yellow-700">{lab.labInstructions}</p>
          </div>
        </div>
      )}

      {/* VNC */}
      {step === "vnc" && vmData && (
        <div className="flex-1 p-4">
          <div
            ref={vncContainerRef}
            className="bg-black rounded-2xl overflow-hidden relative w-full"
            style={{ height: "calc(100vh - 120px)" }}
          >
            {connecting && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm">Connecting to your VM... retrying every 5 seconds</p>
              </div>
            )}

            {!connecting && (
              <button
                onClick={toggleFullscreen}
                className="absolute bottom-3 right-3 z-20 bg-black/60 hover:bg-black/80
                  text-white p-2 rounded-lg transition-all"
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 9L4 4m0 0v4m0-4h4M15 9l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4M15 15l5 5m0 0v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                )}
              </button>
            )}

            <VncScreen
              key={vncKey}
              url={`ws://${vmData.publicIp}:6080`}
              scaleViewport
              style={{ width: "100%", height: "100%" }}
              onConnect={handleVncConnect}
              onDisconnect={handleVncDisconnect}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LabExam;