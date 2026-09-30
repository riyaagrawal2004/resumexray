import React, { useState } from 'react';
import { api } from '../api.js';

export default function Signup({ onAuth, switchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.signup({ fullName, email, password });
      onAuth(res.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="scanline" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Resume<span>Xray</span></h1>
        <p className="sub">Create your account</p>

        <label>Full name</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>

        <p className="switch">
          Already have an account? <a onClick={switchToLogin}>Sign in</a>
        </p>
      </form>
    </div>
  );
}
