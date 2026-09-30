import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED'];
const STATUS_LABEL = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  GHOSTED: 'No reply',
};

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const emptyForm = () => ({
  companyName: '',
  roleTitle: '',
  resumeId: '',
  appliedDate: today(),
  jobLink: '',
  status: 'APPLIED',
  jobDescription: '',
  notes: '',
  matchScore: null,
});

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Applications({ prefill, onPrefillUsed }) {
  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [a, r] = await Promise.all([api.listApplications(), api.listResumes()]);
      setApps(a);
      setResumes(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // Coming from "Pick Resume" -> open the form with resume + JD already filled
  useEffect(() => {
    if (prefill) {
      setForm({
        ...emptyForm(),
        resumeId: String(prefill.resumeId),
        jobDescription: prefill.jobDescription || '',
        matchScore: prefill.matchScore ?? null,
      });
      setShowForm(true);
      if (onPrefillUsed) onPrefillUsed();
    }
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.resumeId) {
      setError('Please select a resume first. (No resumes yet? Upload one in the "My Resumes" tab.)');
      return;
    }
    setSaving(true);
    try {
      await api.createApplication({
        ...form,
        resumeId: Number(form.resumeId),
        appliedDate: form.appliedDate || null,
        jobLink: form.jobLink || null,
        jobDescription: form.jobDescription || null,
        notes: form.notes || null,
      });
      setForm(emptyForm());
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id, status) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await api.updateApplicationStatus(id, status);
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.deleteApplication(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? apps.filter(
        (a) =>
          a.companyName.toLowerCase().includes(q) ||
          a.roleTitle.toLowerCase().includes(q) ||
          (a.resumeLabel || '').toLowerCase().includes(q)
      )
    : apps;

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: apps.filter((a) => a.status === s).length }), {});

  return (
    <>
      {error && <div className="error card">{error}</div>}

      {apps.length > 0 && (
        <div className="stats-row">
          <div className="stat"><b>{apps.length}</b><span>Total</span></div>
          <div className="stat"><b>{counts.INTERVIEW + counts.SCREENING}</b><span>In process</span></div>
          <div className="stat"><b>{counts.OFFER}</b><span>Offers</span></div>
          <div className="stat"><b>{counts.REJECTED}</b><span>Rejected</span></div>
        </div>
      )}

      <div className="card">
        <div className="toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by company name — see which resume you sent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn-small" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : '+ Log application'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="app-form">
            <label>Resume used</label>
            <select value={form.resumeId} onChange={set('resumeId')} required>
              <option value="">— select resume —</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {resumes.length === 0 && !loading && (
              <div className="hint">No resumes yet — upload one in the "My Resumes" tab first.</div>
            )}

            <label>Company</label>
            <input type="text" value={form.companyName} onChange={set('companyName')} required />

            <label>Role</label>
            <input type="text" value={form.roleTitle} onChange={set('roleTitle')} placeholder="e.g. Java Full Stack Developer" required />

            <div className="two-col">
              <div>
                <label>Applied on</label>
                <input type="date" value={form.appliedDate} onChange={set('appliedDate')} />
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={set('status')}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>

            <label>Job link (optional)</label>
            <input type="text" value={form.jobLink} onChange={set('jobLink')} placeholder="https://…" />

            <label>Job description (optional — save it, useful later)</label>
            <textarea rows={4} value={form.jobDescription} onChange={set('jobDescription')} />

            <label>Notes (optional)</label>
            <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Referral? Recruiter's name?" />

            {form.matchScore != null && (
              <div className="hint">AI match score for this resume: <b>{form.matchScore}/100</b></div>
            )}

            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save application'}</button>
          </form>
        )}
      </div>

      {loading && <div className="card"><p className="sub">Loading…</p></div>}

      {!loading && apps.length === 0 && (
        <div className="card">
          <h2>No applications logged yet</h2>
          <p className="sub">
            Whenever you apply to a company, log it here along with which resume you sent. When a company
            replies, just search and you'll know instantly.
          </p>
        </div>
      )}

      {!loading && apps.length > 0 && filtered.length === 0 && (
        <div className="card"><p className="sub">No applications match "{query}".</p></div>
      )}

      {filtered.map((a) => (
        <div className="card app-card" key={a.id}>
          <div className="app-head">
            <div>
              <div className="company">{a.companyName}</div>
              <div className="role">{a.roleTitle}</div>
            </div>
            <span className={`status-pill s-${a.status.toLowerCase()}`}>{STATUS_LABEL[a.status] || a.status}</span>
          </div>

          <div className="sent-with">
            <span className="sent-label">Sent with</span>
            <span className="resume-chip">{a.resumeLabel}</span>
            {a.matchScore != null && <span className="score-mini">{a.matchScore}/100 match</span>}
          </div>

          <div className="app-meta">
            <span>{fmtDate(a.appliedDate)}</span>
            {a.jobLink && (
              <a href={a.jobLink.startsWith('http') ? a.jobLink : `https://${a.jobLink}`} target="_blank" rel="noreferrer">
                job link ↗
              </a>
            )}
          </div>

          {a.notes && <div className="app-notes">{a.notes}</div>}

          <div className="list-actions">
            <select className="status-select" value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            {a.resumeHasFile && (
              <button className="btn-small" onClick={() => api.downloadResume(a.resumeId, a.resumeFileName).catch((e) => setError(e.message))}>
                Download sent resume
              </button>
            )}
            <button className="btn-small danger" onClick={() => remove(a.id)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}