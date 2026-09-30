import React, { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onAuth, switchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email, password });
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
        <p className="sub">See beneath the keywords</p>

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="switch">
          New here? <a onClick={switchToSignup}>Create an account</a>
        </p>
      </form>
    </div>
  );
}
