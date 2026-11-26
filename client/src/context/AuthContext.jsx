import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getAuthToken, setAuthToken } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest('/auth/me');
        if (data && data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const sendOtp = async (email) => {
    return await apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  const register = async (email, password, otp, ref) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, otp, ref })
    });
    if (data.token) {
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
    }
    return data;
  };

  const refreshUser = async () => {
    try {
      const data = await apiRequest('/auth/me');
      if (data && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e.message);
    }
  };

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
    }
    return data;
  };

  const forgotPasswordSendOtp = async (email) => {
    return await apiRequest('/auth/forgot-password-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  const resetPassword = async (email, otp, newPassword) => {
    const data = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });
    if (data.token) {
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        login,
        register,
        refreshUser,
        sendOtp,
        forgotPasswordSendOtp,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
