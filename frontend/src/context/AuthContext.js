import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (formData) => {
    try {
      const params = new URLSearchParams();
      params.append('username', formData.username);
      params.append('password', formData.password);
      const response = await api.login(params);
      if (!response || !response.data) {
        throw new Error('No response from server');
      }
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      api.default.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser({ token: access_token });
      navigate('/dashboard');
    } catch (err) {
      // Propagate error up so Login.js can display it
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.default.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 