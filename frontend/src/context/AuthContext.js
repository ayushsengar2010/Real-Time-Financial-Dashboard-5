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
    const userInfo = localStorage.getItem('userInfo');
    if (token) {
      api.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (userInfo) {
        setUser({ ...JSON.parse(userInfo), token });
      } else {
        setUser({ token });
      }
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
      const { access_token, user: userInfo } = response.data;
      localStorage.setItem('token', access_token);
      
      // Always store username in user object, even if backend doesn't return user info
      const userToStore = userInfo 
        ? { ...userInfo, token: access_token } 
        : { username: formData.username, token: access_token };
        
      localStorage.setItem('userInfo', JSON.stringify(userToStore));
      setUser(userToStore);
      
      api.default.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      navigate('/dashboard');
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
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