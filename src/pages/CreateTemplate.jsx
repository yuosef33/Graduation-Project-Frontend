import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { VncScreen } from "react-vnc";
import api from "../api/axios";
import toast from "react-hot-toast";

const osOptions = [
    {
        value: "WINDOWS",
        label: "Windows",
        description: "Best for desktop tools, GUI apps, and Windows-only software.",
        accent: "blue",
    },
    {
        value: "LINUX",
        label: "Linux",
        description: "Best for command line tools, servers, scripting, and lightweight labs.",
        accent: "green",
    },
];

const CreateTemplate = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState("idle");
    const [vmData, setVmData] = useState(null);
    const [amiName, setAmiName] = useState("");
    const [selectedOs, setSelectedOs] = useState("WINDOWS");
    const [vncKey, setVncKey] = useState(0);
    const [connecting, setConnecting] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [destroying, setDestroying] = useState(false);
    const retryRef = useRef(null);
    const cancellingRef = useRef(false);
    const vncContainerRef = useRef(null);
    const [loadingMessage, setLoadingMessage] = useState("Starting your VM...");

    // restore vm from localStorage on refresh
    useEffect(() => {
        const saved = localStorage.getItem("activeTemplateVm");
        if (saved) {
            const savedVm = JSON.parse(saved);
            setVmData(savedVm);
            setSelectedOs(savedVm.osType || "WINDOWS");
            setStep("vnc");
        }
    }, []);

        useEffect(() => {
            if (step !== "vnc") return;

            setConnecting(true);

            // try immediately
            setVncKey(prev => prev + 1);

            // then retry every 10 seconds
            retryRef.current = setInterval(() => {
                setVncKey(prev => prev + 1);
            }, 10000);

            return () => clearInterval(retryRef.current);
        }, [step]);
            useEffect(() => {
                if (step !== "vnc") return;

                const messages = [
                    { time: 0,     msg: `Starting your ${selectedOs.toLowerCase()} VM...` },
                    { time: 20000, msg: `${selectedOs === "WINDOWS" ? "Windows" : "Linux"} is booting...` },
                    { time: 50000, msg: "Starting VNC server..." },
                    { time: 90000, msg: "Almost ready, connecting..." },
                ];

                const timers = messages.map(({ time, msg }) =>
                    setTimeout(() => setLoadingMessage(msg), time)
                );

                return () => timers.forEach(clearTimeout);
            }, [step, selectedOs]);
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
            const res = await api.post(`/lab/Start/Base-template/${selectedOs}`);
            const { publicIp, instanceId } = res.data;
            const vm = { ip: publicIp, instanceId: instanceId, osType: selectedOs };
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
                osType: vmData.osType || selectedOs,
            });
            toast.success("Template creation started! This may take a few minutes.");
            localStorage.removeItem("activeTemplateVm");
            navigate("/admin");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create AMI");
            setStep("vnc");
        }
    };

    const selectedOsLabel = osOptions.find((option) => option.value === selectedOs)?.label || "Windows";
    const runningOsLabel = osOptions.find((option) => option.value === (vmData?.osType || selectedOs))?.label || selectedOsLabel;

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
                    {["Choose OS", "Install Software", "Save Template"].map((s, i) => (
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
                    <div className="bg-white rounded-2xl border border-gray-100 p-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h2 className="text-lg font-medium text-gray-900 mb-2">Choose Base Operating System</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Pick the OS you want to configure, then start the base VM and save it as a reusable template.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {osOptions.map((option) => {
                                const selected = selectedOs === option.value;
                                const selectedClasses = option.accent === "blue"
                                    ? "border-blue-500 bg-blue-50 ring-blue-500/10"
                                    : "border-green-500 bg-green-50 ring-green-500/10";
                                const iconClasses = option.accent === "blue"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-green-100 text-green-700 border-green-200";

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setSelectedOs(option.value)}
                                        className={`text-left rounded-2xl border p-5 transition-all duration-200 ring-2
                                            ${selected
                                                ? selectedClasses
                                                : "border-gray-200 bg-gray-50 ring-transparent hover:border-gray-300 hover:bg-white"}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${iconClasses}`}>
                                                {option.value === "WINDOWS" ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                            d="M4 5.5l7-1.2v7.2H4V5.5zm9-1.5l7-1.2v8.7h-7V4zM4 13h7v7.2l-7-1.2V13zm9 0h7v8.7l-7-1.2V13z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                            d="M4 17l4-4-4-4m6 8h10M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                                                    {selected && (
                                                        <span className="text-xs font-medium text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">{option.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-xs text-gray-500 text-center mb-4">
                            Starting a {selectedOsLabel} VM. You can install software, configure files, then save the AMI.
                        </p>
                        <button
                            onClick={handleStartVM}
                            className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200"
                        >
                            Start {selectedOsLabel} VM
                        </button>
                    </div>
                )}

                {/* loading */}
                {step === "loading" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-gray-500">Starting {selectedOsLabel} VM... this may take a minute</p>
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
                                    {runningOsLabel} VM running - install your software below
                                </span>
                            </div>
                        </div>

                        {/* VNC screen */}
                        <div
                            ref={vncContainerRef}
                            className="bg-black rounded-2xl overflow-hidden relative"
                            style={{ height: "70vh" }}
                        >
                            {/* connecting overlay */}
                            {connecting && (
                                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 z-10">
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white text-sm">{loadingMessage}</p>
                                    <p className="text-gray-500 text-xs">please wait...</p>
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
                                resizeSession
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
