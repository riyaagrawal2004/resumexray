const BASE_URL = import.meta.env.VITE_API_URL || '/api';
function authHeaders() {
  const token = localStorage.getItem('resumexray_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    // Expired/invalid token on a logged-in session -> send the user back to login
    if (res.status === 403 && localStorage.getItem('resumexray_token')) {
      localStorage.removeItem('resumexray_token');
      window.location.reload();
      throw new Error('Session expired - please log in again.');
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

const get = (url) =>
  fetch(`${BASE_URL}${url}`, { headers: authHeaders() }).then(handle);

const send = (method, url, data) =>
  fetch(`${BASE_URL}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: data === undefined ? undefined : JSON.stringify(data),
  }).then(handle);

export const api = {
  // ---- auth ----
  signup: (data) =>
    fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  login: (data) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  // ---- resume library ----
  uploadResume: (file, label) => {
    const formData = new FormData();
    formData.append('file', file);
    if (label) formData.append('label', label);
    return fetch(`${BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: authHeaders(), // do NOT set Content-Type manually for FormData
      body: formData,
    }).then(handle);
  },

  listResumes: () => get('/resume'),

  deleteResume: (id) => send('DELETE', `/resume/${id}`),

  downloadResume: async (id, fileName) => {
    const res = await fetch(`${BASE_URL}/resume/${id}/download`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Could not download this file.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  recommendResume: (jobDescription) => send('POST', '/resume/recommend', { jobDescription }),

  // ---- application tracker ----
  listApplications: () => get('/applications'),
  createApplication: (data) => send('POST', '/applications', data),
  updateApplicationStatus: (id, status) => send('PUT', `/applications/${id}/status`, { status }),
  deleteApplication: (id) => send('DELETE', `/applications/${id}`),

  // ---- AI tools ----
  analyze: (resumeText, jobDescription) =>
    send('POST', '/match/analyze', { resumeText, jobDescription }),

  roadmap: (missingSkills) => send('POST', '/roadmap/generate', { missingSkills }),

  rewriteBullet: (originalBullet, jobDescription) =>
    send('POST', '/bullet/rewrite', { originalBullet, jobDescription }),
};
