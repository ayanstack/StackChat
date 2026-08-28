import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, setAuthToken, getAuthToken } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.warn("Auth restoration failed:", err);
        setAuthToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      const { user: userData, accessToken } = res.data;
      setAuthToken(accessToken);
      setUser(userData);
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
      const { user: userData, accessToken } = res.data;
      setAuthToken(accessToken);
      setUser(userData);
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
      setAuthToken("");
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
