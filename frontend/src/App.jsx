import React, { useState } from 'react';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('resumexray_token'));
  const [view, setView] = useState('login'); // login | signup

  function handleAuth(newToken) {
    localStorage.setItem('resumexray_token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem('resumexray_token');
    setToken(null);
  }

  if (token) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return view === 'login' ? (
    <Login onAuth={handleAuth} switchToSignup={() => setView('signup')} />
  ) : (
    <Signup onAuth={handleAuth} switchToLogin={() => setView('login')} />
  );
}
