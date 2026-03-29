import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import AdminHome from "./pages/AdminHome";
import CreateTemplate from "./pages/CreateTemplate";
import CreateLab from "./pages/CreateLab";
import VncTest from "./pages/VncTest";
import LabExam from "./pages/LabExam";
import "./index.css";



const App = () => {
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/vnc-test" element={<VncTest />} />
          <Route path="/home" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <RoleRoute role="ADMIN"><AdminHome /></RoleRoute>
          } />
          <Route path="/admin/create-template" element={
            <RoleRoute role="ADMIN"><CreateTemplate /></RoleRoute>
          } />
          <Route path="/admin/create-lab" element={
            <RoleRoute role="ADMIN"><CreateLab /></RoleRoute>
          } />
          <Route path="/exam/:labId" element={
            <ProtectedRoute>
              <LabExam />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
