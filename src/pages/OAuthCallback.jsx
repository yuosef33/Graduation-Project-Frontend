import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUserFromToken } = useAuth();

  useEffect(() => {
    // if already logged in → go home
    if (user) {
      navigate("/home");
      return;
    }

    const code = searchParams.get("code");

    if (!code) {
      toast.error("OAuth2 login failed — no code found");
      navigate("/login");
      return;
    }

    // clear code from URL immediately so it can't be reused
    window.history.replaceState({}, "", "/auth/oauth2/callback");

    api.post(`/auth/exchange-code?code=${code}`)
      .then((res) => {
        const { accessToken, refreshToken } = res.data.data;
        // ✅ updates context state + localStorage at once
        setUserFromToken(accessToken, refreshToken);
        toast.success("Logged in with Google!");
        navigate("/home");
      })
      .catch((err) => {
        const message = err.response?.data?.message || "OAuth2 login failed";
        toast.error(message);
        navigate("/login");
      });
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Signing you in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;