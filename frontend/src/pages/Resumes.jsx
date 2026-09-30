import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const SUGGESTIONS = [
  'Java Developer',
  'Software Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
];

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function load() {
    try {
      setResumes(await api.listResumes());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function onPick(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }
    setError('');
    setFile(f);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!label.trim()) return setError('Please give your resume a name (e.g. "Java Developer").');
    if (!file) return setError('Please choose a PDF file first.');
    setError('');
    setSaving(true);
    try {
      await api.uploadResume(file, label.trim());
      setLabel('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      {error && <div className="error card">{error}</div>}

      <div className="card">
        <h2>Add a resume version</h2>
        <p className="sub">Name each version — this name will show up in your applications later.</p>

        <div className="chip-row">
          {SUGGESTIONS.map((s) => (
            <button type="button" key={s} className={`chip ${label === s ? 'active' : ''}`} onClick={() => setLabel(s)}>
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          <label>Resume name</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Java Developer" />

          <label>PDF file</label>
          <div className="file-drop-box" onClick={() => fileRef.current && fileRef.current.click()}>
            {file ? file.name : 'Click to choose a PDF file'}
          </div>
          <input type="file" accept="application/pdf" ref={fileRef} onChange={onPick} style={{ display: 'none' }} />

          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save resume'}</button>
        </form>
      </div>

      <div className="card">
        <h2>My resumes ({resumes.length})</h2>
        {loading && <p className="sub">Loading…</p>}
        {!loading && resumes.length === 0 && (
          <p className="sub">You haven't saved any resumes yet. Add your first resume above.</p>
        )}
        {resumes.map((r) => (
          <div className="list-row" key={r.id}>
            <div className="list-main">
              <span className="resume-chip">{r.label}</span>
              <span className="list-sub">{r.fileName || 'resume.pdf'} · {fmtDate(r.uploadedAt)}</span>
            </div>
            <div className="list-actions">
              {r.hasFile && (
                <button className="btn-small" onClick={() => api.downloadResume(r.id, r.fileName).catch((e) => setError(e.message))}>
                  Download
                </button>
              )}
              <button className="btn-small danger" onClick={() => handleDelete(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
