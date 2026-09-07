import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, setAuthToken, getAuthToken, pingServer } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Immediately ping backend /health on app launch to wake up Render container from cold sleep
    pingServer();

    // Keepalive ping every 4 minutes while app is open so server doesn't go to sleep
    const keepAliveTimer = setInterval(() => {
      pingServer();
    }, 4 * 60 * 1000);

    const initAuth = async () => {
      // Restore cached user immediately for instant UI
      const cachedUserStr = localStorage.getItem("stackchat_user");
      if (cachedUserStr) {
        try {
          setUser(JSON.parse(cachedUserStr));
        } catch (e) {}
      }

      const token = localStorage.getItem("stackchat_token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Validate session with server in background
      try {
        const res = await authApi.getMe();
        const verifiedUser = res.data?.user || res.data;
        if (verifiedUser) {
          setUser(verifiedUser);
          localStorage.setItem("stackchat_user", JSON.stringify(verifiedUser));
        }
      } catch (err) {
        if (err.statusCode === 401) {
          console.warn("Session expired or token invalid:", err.message);
          setAuthToken("", "");
          localStorage.removeItem("stackchat_user");
          setUser(null);
        } else {
          console.warn("Backend warming up or network delay, preserving cached session:", err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Cross-tab login/logout synchronization
    const handleStorageChange = (e) => {
      if (e.key === "stackchat_user") {
        if (!e.newValue) {
          setUser(null);
        } else {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (err) {}
        }
      } else if (e.key === "stackchat_token" && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(keepAliveTimer);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      const userData = res.data?.user || res.data;
      const accessToken = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken;
      setAuthToken(accessToken, refreshToken);
      if (userData) {
        localStorage.setItem("stackchat_user", JSON.stringify(userData));
        setUser(userData);
      }
      return userData;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await authApi.register({ name, email, password });
      const userData = res.data?.user || res.data;
      const accessToken = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken;
      setAuthToken(accessToken, refreshToken);
      if (userData) {
        localStorage.setItem("stackchat_user", JSON.stringify(userData));
        setUser(userData);
      }
      return userData;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setAuthToken("", "");
      localStorage.removeItem("stackchat_user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
