import React, { useState, useRef } from 'react';
import { api } from '../api.js';
import Applications from './Applications.jsx';
import Resumes from './Resumes.jsx';
import PickResume from './PickResume.jsx';

const TABS = [
  ['apps', 'Applications'],
  ['resumes', 'My Resumes'],
  ['pick', 'Pick Resume'],
  ['scan', 'Scan Report'],
  ['roadmap', 'Skill Gap'],
  ['rewrite', 'Bullet Rewriter'],
];

export default function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('apps');
  const [prefill, setPrefill] = useState(null); // set by "Pick Resume" -> opens the application form

  // ---- scan / roadmap / rewriter state ----
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'upload'
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [originalBullet, setOriginalBullet] = useState('');
  const [rewriteVariants, setRewriteVariants] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function goTab(id) {
    setError('');
    setTab(id);
  }

  function logWithResume(data) {
    setPrefill(data);
    goTab('apps');
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setError('');
    setFileName(file.name);
    setUploading(true);
    try {
      const res = await api.uploadResume(file); // no label -> only used to extract text
      setResumeText(res.extractedText);
    } catch (err) {
      setError(err.message);
      setFileName('');
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError('Please add resume text (paste it or upload a PDF) first.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.analyze(resumeText, jobDescription);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoadmap() {
    if (!result?.missingSkills?.length) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.roadmap(result.missingSkills);
      setRoadmap(res.weeks);
      setTab('roadmap');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRewrite(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRewriteVariants(null);
    try {
      const res = await api.rewriteBullet(originalBullet, jobDescription);
      setRewriteVariants(res.variants);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header>
        <div className="scanline" />
        <div className="header-row">
          <h1>Resume<span>Xray</span></h1>
          <button className="ghost" onClick={onLogout}>Log out</button>
        </div>
        <p className="sub">Track which resume went where</p>
      </header>

      <nav>
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => goTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      <main>
        {error && <div className="error card">{error}</div>}

        {tab === 'apps' && (
          <Applications prefill={prefill} onPrefillUsed={() => setPrefill(null)} />
        )}

        {tab === 'resumes' && <Resumes />}

        {tab === 'pick' && <PickResume onLog={logWithResume} />}

        {tab === 'scan' && (
          <div className="card">
            <h2>Paste your resume and target job description</h2>

            <div className="mode-toggle">
              <button type="button" className={inputMode === 'paste' ? 'active' : ''} onClick={() => setInputMode('paste')}>
                Paste text
              </button>
              <button type="button" className={inputMode === 'upload' ? 'active' : ''} onClick={() => setInputMode('upload')}>
                Upload PDF
              </button>
            </div>

            <form onSubmit={handleAnalyze}>
              {inputMode === 'paste' ? (
                <>
                  <label>Resume text</label>
                  <textarea rows={6} value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
                </>
              ) : (
                <>
                  <label>Resume PDF</label>
                  <div className="file-drop-box" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    {uploading ? 'Extracting text…' : fileName || 'Click to choose a PDF file'}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {resumeText && !uploading && (
                    <div className="extracted-preview">
                      Extracted {resumeText.length} characters — looks good.
                    </div>
                  )}
                </>
              )}

              <label>Job description</label>
              <textarea rows={6} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required />

              <button type="submit" disabled={loading || uploading}>
                {loading ? 'Scanning…' : 'Run scan'}
              </button>
            </form>

            {result && (
              <div className="result">
                <div className="score-row">
                  <span className="num">{result.matchScore}</span>
                  <span className="of">/ 100 match</span>
                </div>
                <div className="bar"><i style={{ width: `${result.matchScore}%` }} /></div>

                <div className="tag-row">
                  {result.matchedSkills.map((s) => <span key={s} className="tag ok">{s}</span>)}
                  {result.missingSkills.map((s) => <span key={s} className="tag gap">{s}</span>)}
                </div>

                <div className="reasoning">{result.reasoning}</div>

                {result.missingSkills.length > 0 && (
                  <button className="ghost" onClick={handleRoadmap} disabled={loading}>
                    Generate skill-gap roadmap →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'roadmap' && (
          <div className="card">
            <h2>Personalized Skill-Gap Roadmap</h2>
            {!roadmap && <p className="sub">Run a scan first, then generate a roadmap from the missing skills.</p>}
            {roadmap && roadmap.map((w, i) => (
              <div className="roadmap-item" key={i}>
                <div className="week">{w.label}</div>
                <div className="body">
                  <b>{w.title}</b>
                  <span>{w.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'rewrite' && (
          <div className="card">
            <h2>AI Bullet Optimizer</h2>
            <form onSubmit={handleRewrite}>
              <label>Your existing bullet</label>
              <textarea rows={3} value={originalBullet} onChange={(e) => setOriginalBullet(e.target.value)} required />

              <label>Target job description</label>
              <textarea rows={5} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required />

              <button type="submit" disabled={loading}>
                {loading ? 'Optimizing…' : 'Generate 3 versions'}
              </button>
            </form>

            {rewriteVariants && (
              <div className="variant-list">
                {rewriteVariants
                  .slice()
                  .sort((a, b) => b.relevanceScore - a.relevanceScore)
                  .map((v, i) => (
                    <div className="variant-card" key={i}>
                      <div className="variant-head">
                        <span className="variant-style">{v.style}</span>
                        <span className="variant-score">{v.relevanceScore}<span className="of-100">/100</span></span>
                      </div>
                      <div className="variant-bar"><i style={{ width: `${v.relevanceScore}%` }} /></div>
                      <p className="variant-text">{v.text}</p>
                      {v.keywordsUsed?.length > 0 && (
                        <div className="tag-row">
                          {v.keywordsUsed.map((k) => <span key={k} className="tag ok">{k}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
