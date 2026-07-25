const API = '/api';

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadProfile() {
  try {
    const res = await fetch(`${API}/profile`);
    const p = await res.json();

    document.getElementById('side-name').textContent = p.name;
    document.getElementById('side-role').textContent = p.role;
    document.getElementById('side-tagline').textContent = p.tagline;
    document.getElementById('mobile-name').textContent = p.name;
    document.getElementById('mobile-name2').textContent = p.name;
    document.getElementById('mobile-role').textContent = p.role;
    document.getElementById('mobile-tagline').textContent = p.tagline;
    document.title = `${p.name} — ${p.role}`;

    document.getElementById('side-github').href = p.github || '#';
    document.getElementById('side-linkedin').href = p.linkedin || '#';
    document.getElementById('side-email').href = p.email ? `mailto:${p.email}` : '#';
    document.getElementById('resume-link').href = p.resumeUrl || '#';

    const aboutEl = document.getElementById('about-content');
    aboutEl.innerHTML = (p.about || [])
      .map((para) => `<p>${escapeHtml(para)}</p>`)
      .join('');
  } catch (err) {
    console.error('Failed to load profile', err);
  }
}

async function loadExperience() {
  try {
    const res = await fetch(`${API}/experience`);
    const list = await res.json();
    const el = document.getElementById('experience-list');

    if (!list.length) {
      el.innerHTML = '<p class="empty-note">No experience listed yet.</p>';
      return;
    }

    el.innerHTML = list
      .map(
        (job) => `
      <div class="job">
        <div class="job-date">${escapeHtml(job.dateRange)}</div>
        <div>
          <div class="job-title">${escapeHtml(job.title)} ${job.company ? `<span>· ${escapeHtml(job.company)}</span>` : ''}</div>
          <div class="job-desc">${escapeHtml(job.description)}</div>
          ${
            job.tags && job.tags.length
              ? `<div class="pill-row">${job.tags.map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join('')}</div>`
              : ''
          }
        </div>
      </div>`
      )
      .join('');
  } catch (err) {
    console.error('Failed to load experience', err);
  }
}

async function loadProjects() {
  try {
    const res = await fetch(`${API}/projects`);
    const list = await res.json();
    const el = document.getElementById('projects-list');

    if (!list.length) {
      el.innerHTML = '<p class="empty-note">No projects listed yet.</p>';
      return;
    }

    el.innerHTML = list
      .map(
        (proj) => `
      <a href="${proj.url || '#'}" class="project" target="_blank" rel="noopener">
        <div class="project-head">
          <div class="project-title">${escapeHtml(proj.title)} <span class="project-arrow">↗</span></div>
        </div>
        <div class="project-desc">${escapeHtml(proj.description)}</div>
        ${
          proj.tags && proj.tags.length
            ? `<div class="pill-row">${proj.tags.map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join('')}</div>`
            : ''
        }
      </a>`
      )
      .join('');
  } catch (err) {
    console.error('Failed to load projects', err);
  }
}

function setupContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const btn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'form-status';
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      status.textContent = "Message sent — I'll get back to you soon.";
      status.classList.add('success');
      form.reset();
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send message ↗';
    }
  });
}

function setupScrollSpy() {
  const links = document.querySelectorAll('[data-nav]');
  const sections = ['about', 'experience', 'projects', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('active'));
          const active = document.querySelector(`[data-nav][href="#${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((s) => io.observe(s));
}

loadProfile();
loadExperience();
loadProjects();
setupContactForm();
setupScrollSpy();
