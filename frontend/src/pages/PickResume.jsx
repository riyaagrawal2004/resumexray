import React, { useState } from 'react';
import { api } from '../api.js';

export default function PickResume({ onLog }) {
  const [jd, setJd] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRun(e) {
    e.preventDefault();
    setError('');
    setResults(null);
    setLoading(true);
    try {
      setResults(await api.recommendResume(jd));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && <div className="error card">{error}</div>}

      <div className="card">
        <h2>Which resume should I send?</h2>
        <p className="sub">Paste a job description — the AI will compare all your saved resumes and tell you the best fit.</p>
        <form onSubmit={handleRun}>
          <label>Job description</label>
          <textarea rows={8} value={jd} onChange={(e) => setJd(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Comparing your resumes…' : 'Find best resume'}</button>
        </form>
      </div>

      {results && results.length > 0 && (
        <div className="card">
          <h2>Ranking</h2>
          <div className="variant-list">
            {results.map((r, i) => (
              <div className={`variant-card ${i === 0 ? 'best' : ''}`} key={r.resumeId}>
                <div className="variant-head">
                  <span className="variant-style">
                    {r.label} {i === 0 && <span className="badge">Best fit</span>}
                  </span>
                  <span className="variant-score">{r.score}<span className="of-100">/100</span></span>
                </div>
                <div className="variant-bar"><i style={{ width: `${r.score}%` }} /></div>
                <p className="variant-text">{r.reason}</p>
                <button
                  className="btn-small"
                  onClick={() => onLog({ resumeId: r.resumeId, jobDescription: jd, matchScore: r.score })}
                >
                  Apply with this resume →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
