import { VncScreen } from "react-vnc";

const VncTest = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <VncScreen
        url="ws://3.68.219.164:6080"
        scaleViewport
        resizeSession
        onClipboard={Clipboard}
        style={{ width: "100%", height: "100%" }}
        onConnect={() => console.log("✅ VNC Connected!")}
        onDisconnect={() => console.log("❌ VNC Disconnected")}
      />
    </div>
  );
};

export default VncTest;