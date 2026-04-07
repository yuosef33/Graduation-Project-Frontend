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

  // ================= FIXED EFFECT =================
  useEffect(() => {
    if (step !== "vnc") return;

    const messages = [
      { time: 0, msg: "Starting your VM..." },
      { time: 30000, msg: "Windows is booting..." },
      { time: 60000, msg: "Starting VNC server..." },
      { time: 90000, msg: "Almost ready, connecting..." },
    ];

    const timers = messages.map(({ time, msg }) =>
      setTimeout(() => setLoadingMessage(msg), time)
    );

    return () => timers.forEach(clearTimeout);
  }, [step]);

  useEffect(() => {
    if (!connecting) {
      setLoadingMessage("Starting your VM...");
    }
  }, [connecting]);

  // ================= INIT =================
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

  // ================= TIMER =================
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
  }, [step]);

  // ================= POLLING =================
  useEffect(() => {
    if (step !== "vnc") return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get("/student/all-labs");
        const currentLab = res.data.data.find(l => l.labId === parseInt(labId));

        if (currentLab?.labStatus === "FINISHED") {
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          setLabFinished(true);
        }
      } catch {}
    }, 30000);

    return () => clearInterval(pollingRef.current);
  }, [step, labId]);

  // ================= VNC RETRY =================
  useEffect(() => {
    if (step !== "vnc") return;

    setConnecting(true);

    const initialDelay = setTimeout(() => {
      retryRef.current = setInterval(() => {
        setVncKey(prev => prev + 1);
      }, 15000);
    }, 60000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(retryRef.current);
    };
  }, [step]);

  // ================= HANDLERS =================
  const handleVncConnect = () => {
    clearInterval(retryRef.current);
    setConnecting(false);
    toast.success("Connected to VM");
  };

  const handleVncDisconnect = () => {
    if (!connecting) setConnecting(true);
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await vncContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = s => {
    if (s === null) return "--:--:--";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, "0")).join(":");
  };

  // ================= UI =================
  if (labFinished) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center w-[350px]">
          <h2 className="text-2xl font-bold mb-4">Exam Finished</h2>
          <p className="text-gray-500 mb-6">Your work has been submitted.</p>
          <button onClick={() => navigate("/home")} className="bg-black text-white px-6 py-3 rounded-xl w-full">Go Home</button>
        </div>
      </div>
    );
  }

  if (step === "loading" || step === "starting") {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white">

      {/* TOP BAR */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/80 backdrop-blur border-b border-gray-800">
        <div>
          <h1 className="font-bold">{lab?.labName}</h1>
          <p className="text-xs text-gray-400">{lab?.labDescription}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-mono">⏱ {formatTime(timeLeft)}</div>
          <button onClick={() => setShowInstructions(!showInstructions)} className="text-sm">Instructions</button>
          <button onClick={() => navigate("/home")} className="text-red-400">Exit</button>
        </div>
      </div>

      {showInstructions && (
        <div className="bg-yellow-900/30 p-4 text-sm">{lab?.labInstructions}</div>
      )}

      {/* VNC */}
      <div className="flex-1 p-2">
        <div ref={vncContainerRef} className="h-full rounded-xl overflow-hidden relative">

          {connecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mb-3" />
              <p>{loadingMessage}</p>
            </div>
          )}

          <VncScreen
            key={vncKey}
            url={`ws://${vmData.publicIp}:6080`}
            scaleViewport
            style={{ width: "100%", height: "100%" }}
            onConnect={handleVncConnect}
            onDisconnect={handleVncDisconnect}
          />

          <button onClick={toggleFullscreen} className="absolute bottom-3 right-3 bg-white text-black px-3 py-1 rounded">
            {isFullscreen ? "Exit" : "Full"}
          </button>
        </div>
      </div>
    </div>
  );
}