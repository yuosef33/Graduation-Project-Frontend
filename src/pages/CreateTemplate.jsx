import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { VncScreen } from "react-vnc";
import api from "../api/axios";
import toast from "react-hot-toast";

const CreateTemplate = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState("idle");
    const [vmData, setVmData] = useState(null);
    const [amiName, setAmiName] = useState("");
    const [vncKey, setVncKey] = useState(0);
    const [connecting, setConnecting] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [destroying, setDestroying] = useState(false);
    const retryRef = useRef(null);
    const cancellingRef = useRef(false);
    const vncContainerRef = useRef(null);

    // restore vm from localStorage on refresh
    useEffect(() => {
        const saved = localStorage.getItem("activeTemplateVm");
        if (saved) {
            setVmData(JSON.parse(saved));
            setStep("vnc");
        }
    }, []);

    // auto retry VNC every 5 seconds
    useEffect(() => {
        if (step === "vnc") {
            setConnecting(true);
            retryRef.current = setInterval(() => {
                setVncKey(prev => prev + 1);
            }, 5000);
        }
        return () => clearInterval(retryRef.current);
    }, [step]);

    // listen for fullscreen exit via ESC key
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const handleStartVM = async () => {
        setStep("loading");
        try {
            const res = await api.post("/lab/Start/Base-template");
            const { publicIp, instanceId } = res.data;
            const vm = { ip: publicIp, instanceId: instanceId };
            localStorage.setItem("activeTemplateVm", JSON.stringify(vm));
            setVmData(vm);
            setStep("vnc");
            toast.success("VM started!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to start VM");
            setStep("idle");
        }
    };

    const handleSaveAmi = async () => {
        if (!amiName.trim()) {
            toast.error("Please enter a template name");
            return;
        }
        setStep("saving");
        try {
            await api.post("/lab/CreateAmi", {
                amiName: amiName.trim(),
                VmId: vmData.instanceId,
            });
            toast.success("Template creation started! This may take a few minutes.");
            localStorage.removeItem("activeTemplateVm");
            navigate("/admin");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create AMI");
            setStep("vnc");
        }
    };

    const handleCancel = async () => {
        if (cancellingRef.current) return;
        cancellingRef.current = true;

        if (!vmData) {
            navigate("/admin");
            return;
        }

        // show destroying screen
        setDestroying(true);

        try {
            await api.delete(`/lab/destroy-machine?id=${vmData.instanceId}`);
            localStorage.removeItem("activeTemplateVm");
            toast.success("VM destroyed");
        } catch {
            toast.error("Failed to destroy VM — please destroy manually");
        } finally {
            cancellingRef.current = false;
            setDestroying(false);
            navigate("/admin");
        }
    };

    const handleVncConnect = () => {
        clearInterval(retryRef.current);
        setConnecting(false);
        toast.success("VNC Connected!");
    };

    const handleVncDisconnect = () => {
        if (!connecting) {
            setConnecting(true);
        }
    };

    // toggle fullscreen
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

    // destroying screen
    if (destroying) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full">
                    <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Destroying VM</h2>
                    <p className="text-sm text-gray-500">Please wait while we terminate the machine...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">

                {/* header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Create Lab Template</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Start a VM, install your software, then save as a template
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        disabled={cancellingRef.current}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                        ← Back
                    </button>
                </div>

                {/* steps indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {["Start VM", "Install Software", "Save Template"].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                ${step === "idle" && i === 0 ? "bg-gray-900 text-white" :
                                    step === "loading" && i === 0 ? "bg-gray-900 text-white" :
                                    step === "vnc" && i === 1 ? "bg-gray-900 text-white" :
                                    step === "saving" && i === 2 ? "bg-gray-900 text-white" :
                                    i < (step === "vnc" ? 1 : step === "saving" ? 2 : 0) ? "bg-green-500 text-white" :
                                    "bg-gray-200 text-gray-500"}`}>
                                {i + 1}
                            </div>
                            <span className="text-sm text-gray-600">{s}</span>
                            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
                        </div>
                    ))}
                </div>

                {/* idle */}
                {step === "idle" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-medium text-gray-900 mb-2">Start Base VM</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            This will launch a Windows VM with VNC. You can then install any software needed for your lab.
                        </p>
                        <button
                            onClick={handleStartVM}
                            className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200"
                        >
                            Start VM
                        </button>
                    </div>
                )}

                {/* loading */}
                {step === "loading" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-gray-500">Starting VM... this may take a minute</p>
                    </div>
                )}

                {/* VNC */}
                {(step === "vnc" || step === "saving") && vmData && (
                    <div className="flex flex-col gap-4">

                        {/* status bar */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-sm text-gray-500">
                                    VM Running — install your software below
                                </span>
                            </div>
                        </div>

                        {/* VNC screen */}
                        <div
                            ref={vncContainerRef}
                            className="bg-black rounded-2xl overflow-hidden relative"
                            style={{ height: "500px" }}
                        >
                            {/* connecting overlay */}
                            {connecting && (
                                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 z-10">
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white text-sm">Connecting to VM... retrying every 5 seconds</p>
                                </div>
                            )}

                            {/* fullscreen button */}
                            {!connecting && (
                                <button
                                    onClick={toggleFullscreen}
                                    className="absolute bottom-3 right-3 z-20 bg-black/60 hover:bg-black/80
                                        text-white p-2 rounded-lg transition-all"
                                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? (
                                        // exit fullscreen icon
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M9 9L4 4m0 0v4m0-4h4M15 9l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4M15 15l5 5m0 0v-4m0 4h-4" />
                                        </svg>
                                    ) : (
                                        // enter fullscreen icon
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            <VncScreen
                                key={vncKey}
                                url={`ws://${vmData.ip}:6080`}
                                scaleViewport
                                style={{ width: "100%", height: "100%" }}
                                onConnect={handleVncConnect}
                                onDisconnect={handleVncDisconnect}
                            />
                        </div>

                        {/* Save AMI form */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">
                                When done installing software, save as template:
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Template name (e.g. Python Lab Template)"
                                    value={amiName}
                                    onChange={(e) => setAmiName(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
                                        text-sm outline-none focus:border-gray-900 focus:bg-white transition-all"
                                />
                                <button
                                    onClick={handleSaveAmi}
                                    disabled={step === "saving"}
                                    className="px-6 py-3 bg-gray-900 text-white text-sm font-medium
                                        rounded-xl hover:bg-gray-800 transition-all duration-200
                                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {step === "saving" ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : "Save Template"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateTemplate;