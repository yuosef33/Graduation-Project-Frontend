import { VncScreen } from "react-vnc";

const VncTest = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <VncScreen
        url="ws://3.71.3.160:6080"
        scaleViewport
        resizeSession
        onClipboard={(e) => console.log("Clipboard event:", e.detail.text)}
        style={{ width: "100%", height: "100%" }}
        onConnect={() => console.log("✅ VNC Connected!")}
        onDisconnect={() => console.log("❌ VNC Disconnected")}
      />
    </div>
  );
};

export default VncTest;