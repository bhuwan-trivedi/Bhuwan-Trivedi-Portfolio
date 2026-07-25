const API = '/api';
let TOKEN = localStorage.getItem('adminToken') || '';

function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-token': TOKEN };
}

function showDashboard() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'block';
  loadExperience();
  loadProjects();
  loadMessages();
}

function showLogin() {
  document.getElementById('login-view').style.display = 'block';
  document.getElementById('dashboard-view').style.display = 'none';
}

// ---------- auth ----------
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const status = document.getElementById('login-status');
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    TOKEN = data.token;
    localStorage.setItem('adminToken', TOKEN);
    showDashboard();
  } catch (err) {
    status.textContent = err.message;
    status.className = 'form-status error';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  TOKEN = '';
  localStorage.removeItem('adminToken');
  showLogin();
});

// ---------- experience ----------
async function loadExperience() {
  const res = await fetch(`${API}/experience`);
  const list = await res.json();
  const el = document.getElementById('experience-admin-list');
  el.innerHTML = list.length
    ? list
        .map(
          (job) => `
      <div class="admin-card">
        <div class="admin-card-head">
          <strong>${escapeHtml(job.title)} ${job.company ? `· ${escapeHtml(job.company)}` : ''}</strong>
          <div class="admin-card-actions">
            <button data-delete-exp="${job.id}">Delete</button>
          </div>
        </div>
        <p>${escapeHtml(job.dateRange)} — ${escapeHtml(job.description)}</p>
      </div>`
        )
        .join('')
    : '<p class="empty-note">No experience entries yet.</p>';

  el.querySelectorAll('[data-delete-exp]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this experience entry?')) return;
      await fetch(`${API}/experience/${btn.dataset.deleteExp}`, { method: 'DELETE', headers: authHeaders() });
      loadExperience();
    });
  });
}

document.getElementById('show-experience-form').addEventListener('click', () => {
  const form = document.getElementById('experience-form');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('experience-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const payload = {
    dateRange: f.dateRange.value,
    title: f.title.value,
    company: f.company.value,
    description: f.description.value,
    tags: f.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
  };
  await fetch(`${API}/experience`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  f.reset();
  f.style.display = 'none';
  loadExperience();
});

// ---------- projects ----------
async function loadProjects() {
  const res = await fetch(`${API}/projects`);
  const list = await res.json();
  const el = document.getElementById('projects-admin-list');
  el.innerHTML = list.length
    ? list
        .map(
          (proj) => `
      <div class="admin-card">
        <div class="admin-card-head">
          <strong>${escapeHtml(proj.title)}</strong>
          <div class="admin-card-actions">
            <button data-delete-proj="${proj.id}">Delete</button>
          </div>
        </div>
        <p>${escapeHtml(proj.description)}</p>
      </div>`
        )
        .join('')
    : '<p class="empty-note">No projects yet.</p>';

  el.querySelectorAll('[data-delete-proj]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this project?')) return;
      await fetch(`${API}/projects/${btn.dataset.deleteProj}`, { method: 'DELETE', headers: authHeaders() });
      loadProjects();
    });
  });
}

document.getElementById('show-project-form').addEventListener('click', () => {
  const form = document.getElementById('project-form');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const payload = {
    title: f.title.value,
    description: f.description.value,
    tags: f.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
    url: f.url.value || '#',
  };
  await fetch(`${API}/projects`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  f.reset();
  f.style.display = 'none';
  loadProjects();
});

// ---------- messages ----------
async function loadMessages() {
  const res = await fetch(`${API}/messages`, { headers: authHeaders() });
  if (res.status === 401) {
    TOKEN = '';
    localStorage.removeItem('adminToken');
    showLogin();
    return;
  }
  const list = await res.json();
  const el = document.getElementById('messages-admin-list');
  el.innerHTML = list.length
    ? list
        .map(
          (m) => `
      <div class="admin-card">
        <div class="admin-card-head">
          <strong>${escapeHtml(m.name)} — ${escapeHtml(m.email)}</strong>
          <div class="admin-card-actions">
            <button data-delete-msg="${m.id}">Delete</button>
          </div>
        </div>
        <p>${escapeHtml(m.message)}</p>
        <p style="margin-top:6px; font-family:var(--mono); font-size:11px;">${new Date(m.receivedAt).toLocaleString()}</p>
      </div>`
        )
        .join('')
    : '<p class="empty-note">No messages yet.</p>';

  el.querySelectorAll('[data-delete-msg]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this message?')) return;
      await fetch(`${API}/messages/${btn.dataset.deleteMsg}`, { method: 'DELETE', headers: authHeaders() });
      loadMessages();
    });
  });
}

// ---------- init ----------
if (TOKEN) {
  showDashboard();
} else {
  showLogin();
}
