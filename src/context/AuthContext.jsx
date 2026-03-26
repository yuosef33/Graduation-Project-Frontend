import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
        // ✅ check if token is expired before restoring user
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const isExpired = payload.exp * 1000 < Date.now();
            if (isExpired) {
                localStorage.clear();
            } else {
                setUser(JSON.parse(savedUser));
            }
        } catch {
            localStorage.clear();
        }
    }
    setLoading(false);
}, []);

const getRoleFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roles = payload.roles;
    console.log("roles from token:", roles); // ← add this to debug
    if (!roles || roles.length === 0) return "USER";
    const role = roles[0]?.authority || roles[0];
    return role.replace("ROLE_", "");
  } catch {
    return "USER";
  }
};
const login = async (email, password) => {
    const res = await api.post("/auth/Login", { email, password });
    const { accessToken, refreshToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    const role = getRoleFromToken(accessToken);
    const userData = { email: payload.sub, role }; // ✅ save role
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return { ...res.data, role }; // ✅ return role so Login.jsx can redirect
};

  const signup = async (name, email, password, phoneNumber) => {
    const res = await api.post("/auth/createUser", {
      name,
      email,
      password,
      phoneNumber,
    });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/business/logout");
    } catch {
      // ignore errors on logout
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);