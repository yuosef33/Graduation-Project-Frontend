import { VncScreen } from "react-vnc";

const VncTest = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <VncScreen
        url="ws://18.159.196.245:6080"
        scaleViewport
        style={{ width: "100%", height: "100%" }}
        onConnect={() => console.log("✅ VNC Connected!")}
        onDisconnect={() => console.log("❌ VNC Disconnected")}
        credentials={{ password: "88888888" }}
      />
    </div>
  );
};

export default VncTest;