import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('role') || 'citizen');
  const [userName, setUserName] = useState(() => localStorage.getItem('name') || 'Citizen');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('email') || null);
  const [userZone, setUserZone] = useState(() => localStorage.getItem('zone') || 'Mumbai East - Station & Ramnagar');
  const [loading, setLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('zone');
    setToken(null);
    setUserRole(null);
    setUserName(null);
    setUserEmail(null);
    setUserZone(null);
  };

  useEffect(() => {
    // Sync auth state if token is in local storage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setUserRole(localStorage.getItem('role') || 'citizen');
      setUserName(localStorage.getItem('name') || 'Citizen');
      setUserEmail(localStorage.getItem('email') || null);
      setUserZone(localStorage.getItem('zone') || 'Mumbai East - Station & Ramnagar');
    }
  }, []);

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (!response.ok) {
      let errDetail = 'Invalid email address or password';
      try {
        const resJson = await response.json();
        if (resJson && resJson.detail) {
          errDetail = typeof resJson.detail === 'string' ? resJson.detail : JSON.stringify(resJson.detail);
        }
      } catch (e) {}
      throw new Error(errDetail);
    }

    const data = await response.json();

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role || 'citizen');
    localStorage.setItem('name', data.name || 'User');
    localStorage.setItem('email', data.email || email);
    localStorage.setItem('zone', data.zone || 'Mumbai East - Station & Ramnagar');

    setToken(data.access_token);
    setUserRole(data.role || 'citizen');
    setUserName(data.name || 'User');
    setUserEmail(data.email || email);
    setUserZone(data.zone || 'Mumbai East - Station & Ramnagar');

    return data;
  };

  const register = async (email, password, fullName, phoneNumber, role = 'citizen', customZone = 'Mumbai East - Station & Ramnagar') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        full_name: fullName,
        phone_number: phoneNumber,
        role,
      }),
    });

    if (!response.ok) {
      let errDetail = 'Registration failed';
      try {
        const resJson = await response.json();
        if (resJson && resJson.detail) {
          errDetail = typeof resJson.detail === 'string' ? resJson.detail : JSON.stringify(resJson.detail);
        }
      } catch (e) {}
      throw new Error(errDetail);
    }

    const data = await response.json();
    const userAssignedZone = customZone || data.zone || 'Mumbai East - Station & Ramnagar';

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role || role);
    localStorage.setItem('name', data.name || fullName);
    localStorage.setItem('email', data.email || email);
    localStorage.setItem('zone', userAssignedZone);

    setToken(data.access_token);
    setUserRole(data.role || role);
    setUserName(data.name || fullName);
    setUserEmail(data.email || email);
    setUserZone(userAssignedZone);

    return data;
  };

  return (
    <AuthContext.Provider value={{ token, userRole, userName, userEmail, userZone, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
