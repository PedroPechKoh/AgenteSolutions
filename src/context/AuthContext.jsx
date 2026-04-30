import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedSession = localStorage.getItem('agente_session');
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      
      if (new Date().getTime() > sessionData.expirationTime) {
        localStorage.removeItem('agente_session');
        return null;
      }

      // Configurar token inicial
      const token = localStorage.getItem("agente_token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      return sessionData.userData; 
    }
    return null;
  });

  const loginGlobal = (userData) => {
    const TIEMPO_EXPIRACION = 2 * 60 * 60 * 1000; 
    const expirationTime = new Date().getTime() + TIEMPO_EXPIRACION;

    const sessionData = {
      userData: userData,
      expirationTime: expirationTime
    };

    const token = localStorage.getItem("agente_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    setUser(userData);
    localStorage.setItem('agente_session', JSON.stringify(sessionData));
  };


  const logoutGlobal = () => {
    setUser(null);
    localStorage.removeItem('agente_session');
  };

  useEffect(() => {
    let intervalo;
    if (user) {
      intervalo = setInterval(() => {
        const savedSession = localStorage.getItem('agente_session');
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          if (new Date().getTime() > sessionData.expirationTime) {
            logoutGlobal();
            alert('Tu sesión ha expirado por seguridad. Por favor, vuelve a iniciar sesión.');
            window.location.href = '/'; 
          }
        }
      }, 60000); 
    }
    return () => clearInterval(intervalo); 
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loginGlobal, logoutGlobal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);