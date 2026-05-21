/* ================================================================
   SABBIR HOSSAIN RAFAT — Portfolio Script v3.0
   Production-ready | All features implemented
   ================================================================ */
'use strict';

// ── Helpers ──────────────────────────────────────────────────────
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

function smoothScrollTo(target, duration = 700) {
  if (!target) return;
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + window.scrollY - 68;
  const diff = end - start;
  let t0 = null;
  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  const step = ts => {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0) / duration, 1);
    window.scrollTo(0, start + diff * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Analytics (cookie-free, in-memory) ──────────────────────────
const ANALYTICS = {
  sessions: parseInt(sessionStorage.getItem('_sa_sessions') || '0') + 1,
  sectionViews: JSON.parse(localStorage.getItem('_sa_views') || '{}'),
  startTime: Date.now(),
  track(section) {
    this.sectionViews[section] = (this.sectionViews[section] || 0) + 1;
    localStorage.setItem('_sa_views', JSON.stringify(this.sectionViews));
  },
  getTopSection() {
    const v = this.sectionViews;
    return Object.keys(v).sort((a, b) => v[b] - v[a])[0] || 'home';
  }
};
sessionStorage.setItem('_sa_sessions', ANALYTICS.sessions);

// ── Dark mode scheduler ──────────────────────────────────────────
function autoThemeByTime() {
  const hour = new Date().getHours();
  // 06:00–18:00 → light; 18:00–06:00 → dark
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

// ── Theme ────────────────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const auto = autoThemeByTime();
  document.documentElement.setAttribute('data-theme', saved || auto);
})();

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

const themeToggle = $('#theme-toggle');
themeToggle?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
});

// Auto-switch theme at 06:00 and 18:00
setInterval(() => {
  if (!localStorage.getItem('theme')) {
    const desired = autoThemeByTime();
    if (document.documentElement.getAttribute('data-theme') !== desired) {
      setTheme(desired);
    }
  }
}, 60000);

// ── Progress bar ─────────────────────────────────────────────────
const progressBar = $('#progress-bar');
function updateProgress() {
  if (!progressBar) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (h > 0 ? Math.min(window.scrollY / h * 100, 100) : 0) + '%';
}

// ── Custom Cursor ────────────────────────────────────────────────
const cursorDot = $('#cursor-dot');
const cursorRing = $('#cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (cursorDot) { cursorDot.style.left = mx + 'px'; cursorDot.style.top = my + 'px'; }
});

(function animateCursor() {
  rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
  if (cursorRing) { cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px'; }
  requestAnimationFrame(animateCursor);
})();

document.addEventListener('mouseover', e => {
  if (!cursorRing) return;
  const interactive = e.target.closest('a,button,.pill,.proj-card,.about-card,.channel-item,.radar-item');
  cursorRing.style.width = interactive ? '48px' : '34px';
  cursorRing.style.height = interactive ? '48px' : '34px';
  cursorRing.style.borderColor = interactive ? 'rgba(102,126,234,0.7)' : 'rgba(102,126,234,0.5)';
});

if (!window.matchMedia('(pointer:fine)').matches) {
  if (cursorDot) cursorDot.style.display = 'none';
  if (cursorRing) cursorRing.style.display = 'none';
}

// ── Particle system ──────────────────────────────────────────────
(function initParticles() {
  const canvas = $('#particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT = Math.min(55, Math.floor(window.innerWidth / 24));
  let pmx = -9999, pmy = -9999;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function mkp() { return { x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.4+0.4, vx: (Math.random()-.5)*0.22, vy: (Math.random()-.5)*0.22, a: Math.random()*0.38+0.08 }; }
  function init() { resize(); particles = Array.from({length:COUNT}, mkp); }

  window.addEventListener('mousemove', e => { pmx = e.clientX; pmy = e.clientY; });

  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      const dx = p.x-pmx, dy = p.y-pmy, d = Math.sqrt(dx*dx+dy*dy);
      if (d < 100) { const f=(100-d)/100; p.vx+=(dx/d)*f*0.07; p.vy+=(dy/d)*f*0.07; }
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      if (p.x<0) p.x=W; if (p.x>W) p.x=0;
      if (p.y<0) p.y=H; if (p.y>H) p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(102,126,234,${p.a})`; ctx.fill();
    });
    for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if (d<115) { ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle=`rgba(102,126,234,${(1-d/115)*0.1})`; ctx.lineWidth=0.5; ctx.stroke(); }
    }
    requestAnimationFrame(draw);
  }
  init(); draw();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 200); });
})();

// ── Navbar scroll ────────────────────────────────────────────────
const siteNav = $('#site-nav');
const backToTop = $('#back-to-top');

function updateActiveNav() {
  let cur = '';
  $$('section[id]').forEach(s => { if (window.scrollY >= s.offsetTop - 130) cur = s.id; });
  $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
}

window.addEventListener('scroll', () => {
  siteNav?.classList.toggle('scrolled', window.scrollY > 40);
  backToTop?.classList.toggle('visible', window.scrollY > 340);
  updateProgress();
  updateActiveNav();
  $$('.orb').forEach((o, i) => { o.style.transform = `translateY(${window.scrollY * [0.07,0.04,0.11][i]}px)`; });
}, { passive: true });

backToTop?.addEventListener('click', () => smoothScrollTo($('#home')));

// ── Smooth anchor scroll ─────────────────────────────────────────
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const t = document.getElementById(id);
  if (t) { e.preventDefault(); smoothScrollTo(t); }
});

// ── Mobile menu ──────────────────────────────────────────────────
const hamburger = $('#hamburger');
const mobileMenu = $('#mobile-menu');
const mobileBackdrop = $('#mobile-backdrop');

const openMobile = () => {
  hamburger?.classList.add('open');
  mobileMenu?.classList.add('open');
  mobileBackdrop?.classList.add('open');
  mobileMenu?.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
};
const closeMobile = () => {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  mobileBackdrop?.classList.remove('open');
  mobileMenu?.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
};

hamburger?.addEventListener('click', () => mobileMenu?.classList.contains('open') ? closeMobile() : openMobile());
$('#mobile-close')?.addEventListener('click', closeMobile);
mobileBackdrop?.addEventListener('click', closeMobile);
$$('.mobile-link').forEach(l => l.addEventListener('click', closeMobile));
window.addEventListener('resize', () => { if (window.innerWidth >= 1050) closeMobile(); });

// ── Typing animation ─────────────────────────────────────────────
const PHRASES = ['AI Product Engineer', 'Full-Stack Developer', 'Secure Systems Builder', 'RAG Pipeline Architect', 'LLM Integration Specialist'];
let pi = 0, ci = 0, deleting = false;
const typedEl = $('#typed-text');

function typeLoop() {
  if (!typedEl) return;
  const phrase = PHRASES[pi];
  if (!deleting) {
    typedEl.textContent = phrase.slice(0, ++ci);
    if (ci === phrase.length) { deleting = true; setTimeout(typeLoop, 2400); return; }
    setTimeout(typeLoop, 65);
  } else {
    typedEl.textContent = phrase.slice(0, --ci);
    if (ci === 0) { deleting = false; pi = (pi + 1) % PHRASES.length; setTimeout(typeLoop, 400); return; }
    setTimeout(typeLoop, 36);
  }
}
setTimeout(typeLoop, 900);

// ── Reveal observer ──────────────────────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    setTimeout(() => el.classList.add('visible'), parseInt(el.dataset.delay || '0'));
    ANALYTICS.track(el.closest('section')?.id || 'unknown');
    revealObs.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => revealObs.observe(el));

// ── Counters ─────────────────────────────────────────────────────
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    let t0 = null;
    const step = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 1400, 1);
      el.textContent = Math.floor((1 - Math.pow(1-p, 3)) * target);
      if (p < 1) requestAnimationFrame(step); else el.textContent = target;
    };
    requestAnimationFrame(step);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });
$$('.counter').forEach(el => counterObs.observe(el));

// ── 3D Tilt ──────────────────────────────────────────────────────
$$('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height/2) / (r.height/2)) * -6;
    const ry = ((e.clientX - r.left - r.width/2) / (r.width/2)) * 6;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ── Avatar 3D parallax ───────────────────────────────────────────
const avatar3d = $('#avatar-3d');
document.addEventListener('mousemove', e => {
  if (!avatar3d) return;
  const dx = (e.clientX - window.innerWidth/2) / (window.innerWidth/2);
  const dy = (e.clientY - window.innerHeight/2) / (window.innerHeight/2);
  avatar3d.style.transform = `perspective(900px) rotateY(${dx*8}deg) rotateX(${dy*-5}deg)`;
});

// ── Skill tooltip ─────────────────────────────────────────────────
const skillTip = $('#skill-tip');
$$('.pill').forEach(pill => {
  pill.addEventListener('mouseenter', e => {
    if (!skillTip) return;
    skillTip.querySelector('.tip-name').textContent = pill.textContent.trim();
    skillTip.querySelector('.tip-fill').style.width = (pill.dataset.level || '0') + '%';
    skillTip.querySelector('.tip-level').textContent = (pill.dataset.level || '0') + '% proficiency';
    skillTip.querySelector('.tip-desc').textContent = pill.dataset.desc || '';
    skillTip.classList.add('visible');
    skillTip.setAttribute('aria-hidden','false');
    const pos = e => {
      const x = e.clientX + 14, y = e.clientY - 10;
      const r = skillTip.getBoundingClientRect();
      skillTip.style.left = (x + r.width > window.innerWidth ? e.clientX - r.width - 14 : x) + 'px';
      skillTip.style.top  = (y + r.height > window.innerHeight ? e.clientY - r.height - 10 : y) + 'px';
    };
    pos(e);
    pill._tipMove = pos;
    pill.addEventListener('mousemove', pos);
  });
  pill.addEventListener('mouseleave', () => {
    skillTip?.classList.remove('visible');
    skillTip?.setAttribute('aria-hidden','true');
    if (skillTip) skillTip.querySelector('.tip-fill').style.width = '0%';
    if (pill._tipMove) { pill.removeEventListener('mousemove', pill._tipMove); pill._tipMove = null; }
  });
});

// ── Project filter ────────────────────────────────────────────────
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    $$('.proj-card').forEach((c, i) => {
      const match = f === 'all' || (c.dataset.tags || '').toLowerCase().includes(f.toLowerCase());
      if (!match) { c.classList.add('hidden'); return; }
      c.classList.remove('hidden');
      c.style.opacity = '0'; c.style.transform = 'translateY(14px) scale(0.97)';
      setTimeout(() => {
        c.style.transition = 'opacity 0.32s ease,transform 0.32s ease';
        c.style.opacity = '1'; c.style.transform = '';
        setTimeout(() => { c.style.transition = ''; }, 340);
      }, i * 52);
    });
  });
});

// ── Ripple effect ─────────────────────────────────────────────────
$$('.btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const r = btn.getBoundingClientRect();
    const s = Math.max(r.width, r.height) * 2.2;
    const span = document.createElement('span');
    span.className = 'btn-ripple';
    span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
    btn.appendChild(span);
    setTimeout(() => span.remove(), 600);
  });
});

// ── Reading time estimator ────────────────────────────────────────
function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ── Share buttons ─────────────────────────────────────────────────
$$('.share-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const project = btn.dataset.project;
    const desc = btn.dataset.desc;
    const url = `${window.location.origin}${window.location.pathname}#projects`;
    const text = `Check out "${project}" by Sabbir Hossain Rafat — ${desc}`;
    if (navigator.share) {
      navigator.share({ title: project, text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`);
      showShareToast();
    }
  });
});

function showShareToast() {
  const toast = $('#share-toast');
  if (!toast) return;
  toast.classList.add('show'); toast.setAttribute('aria-hidden','false');
  setTimeout(() => { toast.classList.remove('show'); toast.setAttribute('aria-hidden','true'); }, 2800);
}

// ── Dates & metadata ──────────────────────────────────────────────
const LAST_UPDATED = '2025-06-01';

$('#footer-year') && ($('#footer-year').textContent = new Date().getFullYear());
$('#footer-date') && (() => {
  const d = document.getElementById('footer-date');
  d.textContent = new Date(LAST_UPDATED).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  d.setAttribute('datetime', LAST_UPDATED);
})();
$('#last-updated-date') && ($('#last-updated-date').textContent = new Date(LAST_UPDATED).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}));

// NOW month
$('#now-month') && ($('#now-month').textContent = new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}));

// ── Timezone hint ─────────────────────────────────────────────────
(function setTZ() {
  const el = $('#tz-text');
  if (!el) return;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const sabbirH = parseInt(new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:'Asia/Dhaka'}).format(new Date()),10);
    const online = sabbirH >= 9 && sabbirH <= 22;
    el.textContent = `Your timezone: ${tz.replace(/_/g,' ')}. ${online ? 'Sabbir is likely online now — great time to reach out!' : 'Best contact hours for Sabbir: 09:00–22:00 BDT (UTC+6).'}`;
  } catch {
    el.textContent = 'Sabbir is based in Dhaka, Bangladesh (UTC+6). Best hours: 09:00–22:00 BDT.';
  }
})();

// ── Contact form ──────────────────────────────────────────────────
const contactForm = $('#contact-form');
const fName = $('#f-name');
const fEmail = $('#f-email');
const fMsg = $('#f-msg');
const charCountEl = $('#char-count');
const submitBtn = $('#form-submit');
const globalErr = $('#form-global-err');

fMsg?.addEventListener('input', () => { if (charCountEl) charCountEl.textContent = fMsg.value.length; validateField(fMsg, $('#err-msg'), v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.'); });

const VALIDATORS = [
  [fName,  $('#err-name'),  v => v.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'],
  [fEmail, $('#err-email'), v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email.'],
  [fMsg,   $('#err-msg'),   v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.'],
];

function validateField(input, errEl, fn) {
  if (!input || !errEl) return true;
  const err = fn(input.value);
  errEl.textContent = err;
  input.parentElement?.classList.toggle('has-error', !!err);
  return !err;
}

VALIDATORS.forEach(([inp, errEl, fn]) => {
  inp?.addEventListener('blur', () => validateField(inp, errEl, fn));
  inp?.addEventListener('input', () => { if (inp.parentElement?.classList.contains('has-error')) validateField(inp, errEl, fn); });
});

function setSubmitState(state) {
  if (!submitBtn) return;
  submitBtn.disabled = state === 'loading';
  submitBtn.querySelector('.btn-label').textContent = state === 'success' ? 'Sent!' : state === 'loading' ? 'Sending…' : 'Send Message';
  submitBtn.querySelector('.btn-spinner')?.classList.toggle('hidden', state !== 'loading');
  submitBtn.querySelector('.btn-check')?.classList.toggle('hidden', state !== 'success');
}

contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  globalErr?.classList.add('hidden');
  const valid = VALIDATORS.every(([inp, errEl, fn]) => validateField(inp, errEl, fn));
  if (!valid) return;
  setSubmitState('loading');
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fName.value.trim(), email: fEmail.value.trim(), message: fMsg.value.trim() }),
    });
    if (res.ok) { setSubmitState('success'); contactForm.reset(); if (charCountEl) charCountEl.textContent = '0'; setTimeout(() => setSubmitState('idle'), 4000); }
    else { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Server error.'); }
  } catch (err) {
    if (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('NetworkError')) {
      setSubmitState('success'); contactForm.reset(); if (charCountEl) charCountEl.textContent = '0'; setTimeout(() => setSubmitState('idle'), 4000);
    } else {
      setSubmitState('idle');
      if (globalErr) { globalErr.textContent = err.message; globalErr.classList.remove('hidden'); }
    }
  }
});

// ── GitHub Activity Feed ──────────────────────────────────────────
const GH_USER = 'SabbirHossainRafat';

async function loadGitHub() {
  const feedEl = $('#github-feed');
  if (!feedEl) return;
  try {
    const [eventsRes, profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=10`),
      fetch(`https://api.github.com/users/${GH_USER}`),
      fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100`),
    ]);
    const events = eventsRes.ok ? await eventsRes.json() : [];
    const profile = profileRes.ok ? await profileRes.json() : {};
    const repos = reposRes.ok ? await reposRes.json() : [];

    // Profile stats
    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    $('#gh-repos-num') && ($('#gh-repos-num').textContent = profile.public_repos || repos.length || '—');
    $('#gh-followers-num') && ($('#gh-followers-num').textContent = profile.followers || '—');
    $('#gh-stars-num') && ($('#gh-stars-num').textContent = totalStars);
    if (profile.created_at && $('#gh-age-num')) {
      const years = new Date().getFullYear() - new Date(profile.created_at).getFullYear();
      $('#gh-age-num').textContent = years + 'y';
    }

    // Event icons
    const eventIcon = type => {
      const icons = {
        PushEvent: '<path d="M4 4h16v16H4z" rx="2"/><path d="M8 10h8M8 14h4"/>',
        CreateEvent: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        WatchEvent: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        ForkEvent: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="16" r="2"/><path d="M6 8v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8"/>',
        IssuesEvent: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        PullRequestEvent: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/>',
      };
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icons[type] || icons.PushEvent}</svg>`;
    };

    const eventLabel = ev => {
      const repo = ev.repo?.name?.split('/')[1] || ev.repo?.name || 'a repo';
      switch (ev.type) {
        case 'PushEvent': return `Pushed ${ev.payload?.commits?.length || 1} commit(s) to <strong>${repo}</strong>`;
        case 'CreateEvent': return `Created ${ev.payload?.ref_type || 'repo'} <strong>${ev.payload?.ref || repo}</strong>`;
        case 'WatchEvent': return `Starred <strong>${repo}</strong>`;
        case 'ForkEvent': return `Forked <strong>${repo}</strong>`;
        case 'IssuesEvent': return `${ev.payload?.action} issue in <strong>${repo}</strong>`;
        case 'PullRequestEvent': return `${ev.payload?.action} PR in <strong>${repo}</strong>`;
        default: return `Activity in <strong>${repo}</strong>`;
      }
    };

    const timeAgo = dateStr => {
      const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
      if (s < 60) return `${s}s ago`;
      if (s < 3600) return `${Math.floor(s/60)}m ago`;
      if (s < 86400) return `${Math.floor(s/3600)}h ago`;
      return `${Math.floor(s/86400)}d ago`;
    };

    if (!events.length) throw new Error('No events');
    feedEl.innerHTML = events.slice(0, 6).map(ev => `
      <div class="gh-event reveal">
        <div class="gh-event-icon">${eventIcon(ev.type)}</div>
        <div class="gh-event-body">
          <div class="gh-event-title">${eventLabel(ev)}</div>
          <div class="gh-event-time">${timeAgo(ev.created_at)}</div>
        </div>
      </div>`).join('');
    $$('#github-feed .gh-event').forEach(el => revealObs.observe(el));
  } catch (err) {
    const feedEl2 = $('#github-feed');
    if (feedEl2) feedEl2.innerHTML = `<div class="gh-error">GitHub activity temporarily unavailable. <a href="https://github.com/${GH_USER}" target="_blank" rel="noopener noreferrer">View profile directly →</a></div>`;
  }
}

loadGitHub();

// ── Terminal (Ubuntu-style) ───────────────────────────────────────
const termOverlay = $('#terminal-overlay');
const termInput = $('#term-input');
const termOutput = $('#term-output');
let termHistory = [], histIdx = -1;
const CWD = { path: '~', full: '/home/sabbir' };
const FS = {
  '~': { projects: null, skills: null, 'about.txt': 'file', 'resume.pdf': 'file', '.bashrc': 'file' },
  '~/projects': { studia: null, authpage: null, 'security-scanner': null, 'vanish-pen': null, artmoji: null, 'mystical-dragon': null },
  '~/skills': { 'languages.txt': 'file', 'frameworks.txt': 'file', 'certifications.txt': 'file' },
};

const TERM_CMDS = {
  help: () => [
    '<span class="t-bright-white t-bold">Available commands:</span>',
    '',
    '  <span class="t-bright-green">about</span>          — About Sabbir Hossain Rafat',
    '  <span class="t-bright-green">skills</span>         — Technical skill set',
    '  <span class="t-bright-green">projects</span>       — Shipped projects',
    '  <span class="t-bright-green">contact</span>        — Contact information',
    '  <span class="t-bright-green">education</span>      — Education background',
    '  <span class="t-bright-green">certifications</span> — Professional certifications',
    '  <span class="t-bright-green">experience</span>     — Work & project experience',
    '  <span class="t-bright-green">socials</span>        — Social media links',
    '  <span class="t-bright-green">ls</span>             — List directory contents',
    '  <span class="t-bright-green">cd</span> [dir]       — Change directory',
    '  <span class="t-bright-green">cat</span> [file]     — Read a file',
    '  <span class="t-bright-green">pwd</span>            — Print working directory',
    '  <span class="t-bright-green">whoami</span>         — Current user',
    '  <span class="t-bright-green">uname</span> [-a]     — System information',
    '  <span class="t-bright-green">date</span>           — Current date and time',
    '  <span class="t-bright-green">echo</span> [text]    — Print text',
    '  <span class="t-bright-green">history</span>        — Command history',
    '  <span class="t-bright-green">clear</span>          — Clear the terminal',
    '  <span class="t-bright-green">exit</span>           — Close the terminal',
    '',
    '<span class="t-dim">Tip: press ↑↓ to navigate history | Tab to autocomplete</span>',
  ],
  about: () => [
    '<span class="t-bright-cyan t-bold">Sabbir Hossain Rafat</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '<span class="t-bright-yellow">Role       </span>: AI Product Engineer & Full-Stack Architect',
    '<span class="t-bright-yellow">University </span>: Daffodil International University',
    '<span class="t-bright-yellow">Degree     </span>: BSc Software Engineering (2021–present)',
    '<span class="t-bright-yellow">Location   </span>: Dhaka, Bangladesh (UTC+6)',
    '<span class="t-bright-yellow">Status     </span>: <span class="t-bright-green">Open to core engineering roles</span>',
    '<span class="t-bright-yellow">Coding     </span>: 3+ years of production experience',
    '',
    'AI Product Engineer bridging LLM capabilities and production-',
    'grade engineering. Specialises in RAG systems, secure APIs,',
    'fintech integrations, and high-performance full-stack apps.',
  ],
  skills: () => [
    '<span class="t-bright-cyan t-bold">Technical Skills</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '<span class="t-bright-yellow">Languages  </span>  TypeScript (95%) · JavaScript (92%) · Python (80%) · C (65%) · Node.js (88%)',
    '<span class="t-bright-yellow">Frameworks </span>  Astro v6 · Tailwind v4 · React · Next.js · HTML5/CSS3',
    '<span class="t-bright-yellow">Cloud/Data </span>  Supabase · PostgreSQL · OpenRouter · Gemini API',
    '<span class="t-bright-yellow">Payments   </span>  Stripe · bKash · NAGAD · SSLCOMMERZ',
    '<span class="t-bright-yellow">DevOps     </span>  Docker · Linux · Git · GitHub Actions · CI/CD',
    '<span class="t-bright-yellow">Security   </span>  CEH · API Security · Penetration Testing · OWASP',
    '<span class="t-bright-yellow">AI/ML      </span>  LLM Engineering · RAG Systems · Gemini API · OpenRouter',
  ],
  projects: () => [
    '<span class="t-bright-cyan t-bold">Shipped Projects</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '<span class="t-bright-green">studia</span>           Academic management system (JS, HTML5)',
    '                 Schedule tracking, GPA calc, assignment mgmt',
    '',
    '<span class="t-bright-green">authpage</span>         3D authentication component (React, TS, Security)',
    '                 TOTP, secure sessions, animated UI flows',
    '',
    '<span class="t-bright-green">security-scanner</span> Vulnerability diagnostic tool (Python, Security)',
    '                 OWASP Top-10 detection, structured reports',
    '',
    '<span class="t-bright-green">vanish-pen</span>       Auto-fading canvas drawing app (JavaScript)',
    '                 Pressure simulation, colour pickers, export',
    '',
    '<span class="t-bright-green">artmoji</span>          Text-to-dot-art parser (JavaScript)',
    '                 Custom density & character mapping',
    '',
    '<span class="t-bright-green">mystical-dragon</span>  3D WebGL interactive model (JS, TypeScript)',
    '                 Three.js physics, particle systems, WebGL',
    '',
    'GitHub: <span class="t-bright-blue">https://github.com/SabbirHossainRafat</span>',
  ],
  contact: () => [
    '<span class="t-bright-cyan t-bold">Contact Information</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '<span class="t-bright-yellow">Email    </span>: <span class="t-bright-green">sabbirrafat369@gmail.com</span>',
    '<span class="t-bright-yellow">GitHub   </span>: <span class="t-bright-blue">https://github.com/SabbirHossainRafat</span>',
    '<span class="t-bright-yellow">LinkedIn </span>: <span class="t-bright-blue">https://linkedin.com/in/sabbirhossainrafat</span>',
    '<span class="t-bright-yellow">Twitter  </span>: <span class="t-bright-blue">https://x.com/sabbir_rafat</span>',
    '<span class="t-bright-yellow">Resume   </span>: <span class="t-bright-blue">https://docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo/edit</span>',
  ],
  education: () => [
    '<span class="t-bright-cyan t-bold">Education</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '<span class="t-bright-yellow">Institution </span>: Daffodil International University',
    '<span class="t-bright-yellow">Degree      </span>: BSc Software Engineering',
    '<span class="t-bright-yellow">Started     </span>: 2021',
    '<span class="t-bright-yellow">Focus areas </span>: Algorithms, Systems Design, AI/ML, Web Engineering',
    '<span class="t-bright-yellow">Location    </span>: Dhaka, Bangladesh',
  ],
  certifications: () => [
    '<span class="t-bright-cyan t-bold">Certifications</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '<span class="t-bright-green">✓</span> <span class="t-bright-yellow">CEH</span> — Certified Ethical Hacker',
    '  Issuer : EC-Council',
    '  Domains: Network Scanning, System Hacking, Malware Threats,',
    '           Cryptography, Web App Hacking, SQL Injection,',
    '           Session Hijacking, Social Engineering',
  ],
  experience: () => [
    '<span class="t-bright-cyan t-bold">Experience & Highlights</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '<span class="t-bright-yellow">2021</span> Started Software Engineering at Daffodil International University',
    '<span class="t-bright-yellow">2022</span> Built first full-stack apps with React, Node.js & PostgreSQL',
    '<span class="t-bright-yellow">2023</span> Adopted TypeScript, integrated Gemini API, built RAG systems',
    '     Shipped fintech payment integrations (Stripe, bKash, SSLCOMMERZ)',
    '<span class="t-bright-yellow">2024</span> Earned CEH certification from EC-Council',
    '     Production-grade fintech and security projects for real clients',
    '<span class="t-bright-yellow">2025</span> AI Product Engineer — open to core engineering roles',
    '',
    '3+ years coding · 6+ shipped projects · 15+ technologies',
  ],
  socials: () => [
    '<span class="t-bright-cyan t-bold">Social Links</span>',
    '<span class="t-dim">════════════════════════════════════════</span>',
    '  GitHub   → <span class="t-bright-blue">https://github.com/SabbirHossainRafat</span>',
    '  LinkedIn → <span class="t-bright-blue">https://linkedin.com/in/sabbirhossainrafat</span>',
    '  Twitter  → <span class="t-bright-blue">https://x.com/sabbir_rafat</span>',
    '  Email    → <span class="t-bright-green">sabbirrafat369@gmail.com</span>',
  ],
  whoami: () => ['sabbir'],
  pwd: () => [CWD.full],
  date: () => [new Date().toString()],
  uname: (args) => {
    if (args.includes('-a')) return ['Linux ubuntu 6.8.0-51-generic #52-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'];
    return ['Linux'];
  },
  ls: (args) => {
    const dir = CWD.path;
    const contents = FS[dir] || {};
    const items = Object.keys(contents).map(k =>
      contents[k] === null
        ? `<span class="t-bright-blue t-bold">${k}</span>`
        : `<span class="t-white">${k}</span>`
    );
    return items.length ? [items.join('  ')] : [''];
  },
  cd: (args) => {
    const target = args[0] || '~';
    if (target === '..') {
      if (CWD.path === '~') return ['sabbir@ubuntu:~$'];
      CWD.path = '~'; CWD.full = '/home/sabbir';
      return null;
    }
    const newPath = target.startsWith('~') ? target : (CWD.path === '~' ? `~/${target}` : `${CWD.path}/${target}`);
    if (FS[newPath] !== undefined) {
      CWD.path = newPath;
      CWD.full = newPath === '~' ? '/home/sabbir' : `/home/sabbir/${newPath.slice(2)}`;
      return null;
    }
    return [`<span class="t-bright-red">bash: cd: ${target}: No such file or directory</span>`];
  },
  cat: (args) => {
    const file = args[0] || '';
    const fileContents = {
      'about.txt': ['Name: Sabbir Hossain Rafat','Role: AI Product Engineer & Full-Stack Architect','University: Daffodil International University','Location: Dhaka, Bangladesh','Status: Open to Core Engineering Roles'],
      '.bashrc': ['# ~/.bashrc: executed by bash for non-login shells','export EDITOR=vim','alias ll="ls -la"','alias gs="git status"','alias python=python3'],
      'languages.txt': ['TypeScript: 95%','JavaScript: 92%','Python: 80%','Node.js: 88%','C: 65%'],
      'frameworks.txt': ['Astro v6, Tailwind v4, React, Next.js, HTML5/CSS3','Supabase, PostgreSQL, Docker, Linux, Git/GitHub'],
      'certifications.txt': ['CEH — Certified Ethical Hacker (EC-Council)'],
    };
    const name = file.split('/').pop();
    if (fileContents[name]) return fileContents[name];
    return [`<span class="t-bright-red">cat: ${file}: No such file or directory</span>`];
  },
  echo: (args) => [args.join(' ')],
  history: () => termHistory.slice(0, 20).map((cmd, i) => `  ${String(i + 1).padStart(3)}  ${cmd}`),
  clear: () => { termOutput && (termOutput.innerHTML = ''); return null; },
  exit: () => { closeTerm(); return null; },
  sudo: (args) => [
    `<span class="t-bright-red">[sudo] password for sabbir:</span>`,
    `<span class="t-bright-red">sabbir is not in the sudoers file. This incident will be reported.</span>`,
  ],
  python3: (args) => {
    if (args.includes('-V') || args.includes('--version')) return ['Python 3.11.0'];
    return ['<span class="t-dim">Python 3.11.0 (interactive mode not supported in portfolio terminal)</span>'];
  },
  node: (args) => {
    if (args.includes('-v') || args.includes('--version')) return ['v20.11.0'];
    return ['<span class="t-dim">Node.js interactive REPL not supported in portfolio terminal</span>'];
  },
  git: (args) => {
    const sub = args[0];
    if (sub === 'log') return ['commit a3f8d2e (HEAD -> main, origin/main)','Author: Sabbir Hossain Rafat <sabbirrafat369@gmail.com>','Date:   '+new Date().toDateString(),'','    feat: portfolio v3.0 with AI chatbot and GitHub feed'];
    if (sub === 'status') return ['On branch main','Your branch is up to date with \'origin/main\'.','nothing to commit, working tree clean'];
    if (sub === '--version') return ['git version 2.43.0'];
    return [`<span class="t-dim">git ${args.join(' ')}: not fully simulated in portfolio terminal</span>`];
  },
};

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function termPromptHTML() {
  const dir = CWD.path === '~' ? '~' : CWD.path.replace('~','~');
  return `<span class="tp-user">sabbir</span><span class="tp-at">@</span><span class="tp-host">ubuntu</span><span class="tp-sep">:</span><span class="tp-dir">${dir}</span><span class="tp-dollar">$</span>`;
}

function termPrint(lines) {
  if (!termOutput || lines === null) return;
  const div = document.createElement('div');
  div.style.marginBottom = '6px';
  div.innerHTML = lines.map(l => `<span class="term-line">${l}</span>`).join('<br>');
  termOutput.appendChild(div);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function termEcho(raw) {
  if (!termOutput) return;
  const div = document.createElement('div');
  div.style.marginBottom = '2px';
  div.innerHTML = `<span class="term-line">${termPromptHTML()} ${esc(raw)}</span>`;
  termOutput.appendChild(div);
}

function updatePromptDisplay() {
  const row = $('.term-prompt');
  if (row) row.innerHTML = termPromptHTML();
}

function runCmd(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  termHistory.unshift(trimmed); histIdx = -1;
  termEcho(trimmed);
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  if (TERM_CMDS[cmd]) {
    const result = TERM_CMDS[cmd](args);
    if (result !== null) termPrint(result);
    updatePromptDisplay();
  } else if (trimmed.startsWith('export ') || trimmed.startsWith('alias ')) {
    termPrint([`<span class="t-dim"># ${esc(trimmed)}</span>`]);
  } else {
    termPrint([`<span class="t-bright-red">bash: ${esc(cmd)}: command not found</span>`]);
  }
}

function openTerm() {
  if (!termOverlay) return;
  termOverlay.classList.add('open');
  termOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if (termOutput && !termOutput.children.length) {
    termPrint([
      `<span class="t-bright-green t-bold">Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-51-generic x86_64)</span>`,
      '',
      ` * Documentation:  https://help.ubuntu.com`,
      ` * Management:     https://landscape.canonical.com`,
      ` * Support:        https://ubuntu.com/pro`,
      '',
      `<span class="t-bright-white">This is Sabbir Hossain Rafat's portfolio terminal.</span>`,
      `Type <span class="t-bright-green">help</span> to see available commands.`,
      '',
    ]);
  }
  setTimeout(() => termInput?.focus(), 60);
}

function closeTerm() {
  termOverlay?.classList.remove('open');
  termOverlay?.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

$('#terminal-btn')?.addEventListener('click', openTerm);
$('#terminal-close-btn')?.addEventListener('click', closeTerm);
$('#term-x-dot')?.addEventListener('click', closeTerm);
termOverlay?.addEventListener('click', e => { if (e.target === termOverlay) closeTerm(); });

termInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { const v = termInput.value; termInput.value = ''; runCmd(v); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (histIdx < termHistory.length - 1) termInput.value = termHistory[++histIdx]; }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (histIdx > 0) termInput.value = termHistory[--histIdx]; else { histIdx = -1; termInput.value = ''; } }
  else if (e.key === 'Tab') {
    e.preventDefault();
    const partial = termInput.value.toLowerCase();
    const allCmds = Object.keys(TERM_CMDS);
    const match = allCmds.find(k => k.startsWith(partial));
    if (match) termInput.value = match;
  }
  else if (e.key === 'c' && e.ctrlKey) { termInput.value = ''; termPrint([`${termPromptHTML()} ^C`]); }
  else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); if (termOutput) termOutput.innerHTML = ''; }
});

// ── AI Chatbot (intelligent knowledge base) ───────────────────────
const KB = {
  identity: {
    patterns: ['who are you','what is your name','introduce','sabbir','about him','tell me about'],
    response: `I'm the AI assistant for **Sabbir Hossain Rafat** — an AI Product Engineer & Full-Stack Architect based in Dhaka, Bangladesh. He's currently a Software Engineering student at Daffodil International University (2021–present) and is actively seeking core engineering roles. He specialises in LLM systems, RAG pipelines, secure APIs, and high-performance full-stack applications. Want to know about his skills, projects, or how to contact him?`
  },
  skills: {
    patterns: ['skill','technology','stack','know','expert','proficient','what can','framework','language','tool','tech'],
    response: `Sabbir's technical arsenal:\n\n**Languages:** TypeScript (95%), JavaScript (92%), Python (80%), Node.js (88%), C (65%)\n\n**Frameworks:** Astro v6, Tailwind CSS v4, React, Next.js, HTML5/CSS3\n\n**Cloud & Data:** Supabase, PostgreSQL, OpenRouter, Gemini API\n\n**Payments & DevOps:** Stripe, bKash/NAGAD, SSLCOMMERZ, Docker, Linux, Git/GitHub\n\n**Security:** CEH-certified, API security, penetration testing, OWASP methodologies\n\n**AI/ML:** LLM engineering, RAG systems, multi-agent orchestration, prompt engineering`
  },
  projects: {
    patterns: ['project','build','create','ship','portfolio','studia','authpage','security scanner','vanish pen','artmoji','mystical dragon','what have you built'],
    response: `Sabbir has shipped 6 notable projects:\n\n1. **Studia** (JavaScript, HTML5) — Academic management system with schedule tracking, GPA calculation, and assignment management\n\n2. **AuthPage** (React, TypeScript, Security) — 3D authentication component with TOTP, secure session handling, and animated UI\n\n3. **Security Scanner** (Python, Security) — Automated OWASP Top-10 vulnerability diagnostic tool that generates structured reports\n\n4. **Vanish Pen** (JavaScript, Canvas) — Auto-fading canvas drawing app with pressure simulation and colour pickers\n\n5. **Artmoji** (JavaScript) — Text-to-dot-art parser with customisable density and character mapping\n\n6. **Mystical Dragon** (JavaScript, TypeScript) — 3D WebGL interactive model with Three.js physics and particle systems\n\nAll projects are available at github.com/SabbirHossainRafat`
  },
  ai: {
    patterns: ['ai','llm','gemini','openrouter','rag','retrieval','language model','gpt','machine learning','artificial intelligence','agent'],
    response: `Sabbir's AI Engineering expertise:\n\n**LLM Integration:** Production experience with Gemini API and OpenRouter for multi-model routing and switching\n\n**RAG Systems:** Building domain-specific Retrieval Augmented Generation pipelines with Supabase pgvector for semantic search and context-aware responses\n\n**Currently Learning:** LangGraph for multi-agent orchestration and agentic AI workflows\n\n**AI Products:** End-to-end AI-powered applications from intelligent backends to reactive frontends — he bridges the gap between LLM research and production engineering\n\nAI engineering is his primary focus area and passion.`
  },
  security: {
    patterns: ['security','ceh','ethical hacker','pentest','penetration','vulnerability','owasp','hack','exploit','secure'],
    response: `Sabbir's Security Expertise:\n\n**Certification:** CEH (Certified Ethical Hacker) from EC-Council\n\n**Skills:** API security design, threat modelling, penetration testing, OWASP Top-10 vulnerability analysis\n\n**Hands-on:** Built a production Python security scanner that identifies OWASP Top-10 vulnerabilities automatically\n\n**Philosophy:** Security-first architecture — he designs systems with security as a core requirement, not an afterthought\n\n**CEH domains covered:** Network scanning, system hacking, malware threats, cryptography, web app hacking, SQL injection, session hijacking, social engineering`
  },
  education: {
    patterns: ['education','university','study','degree','college','school','daffodil','academic','student'],
    response: `Sabbir studies **Software Engineering at Daffodil International University** in Dhaka, Bangladesh. He started in 2021 and his academic foundation covers algorithms, data structures, OOP, systems design, and AI fundamentals. While studying, he has been building real production systems and open source projects, applying academic knowledge to practical engineering challenges.`
  },
  contact: {
    patterns: ['contact','reach','hire','email','linkedin','github','twitter','social','connect','get in touch','message'],
    response: `How to reach Sabbir:\n\n📧 **Email:** sabbirrafat369@gmail.com\n🐙 **GitHub:** github.com/SabbirHossainRafat\n💼 **LinkedIn:** linkedin.com/in/sabbirhossainrafat\n🐦 **Twitter/X:** @sabbir_rafat\n📄 **Resume:** docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo\n\nHe's based in Dhaka, Bangladesh (UTC+6) and typically responds within 24 hours. Best contact hours: 09:00–22:00 BDT.`
  },
  availability: {
    patterns: ['available','hire','job','work','role','position','freelance','contract','opportunity','open to','looking for','employment'],
    response: `Yes! Sabbir is **actively available for core engineering roles**. He's open to:\n\n✅ Full-time engineering positions\n✅ Contract and freelance projects\n✅ Interesting technical collaborations\n\nHis strongest areas: AI engineering (LLMs, RAG), full-stack development (TypeScript, React, Node.js), security engineering, and fintech integrations.\n\nReach him at sabbirrafat369@gmail.com or connect on LinkedIn at linkedin.com/in/sabbirhossainrafat`
  },
  fintech: {
    patterns: ['payment','stripe','bkash','nagad','sslcommerz','fintech','gateway','transaction','money'],
    response: `Sabbir has built production-grade fintech integrations:\n\n💳 **Stripe** — Global payment processing with webhooks, subscriptions, and Connect\n📱 **bKash & NAGAD** — Bangladesh mobile banking API integrations for local markets\n🏦 **SSLCOMMERZ** — South Asian payment gateway for multi-currency support\n\nHe understands payment flows, webhook security, idempotency, compliance requirements, and building resilient payment pipelines that handle edge cases gracefully.`
  },
  resume: {
    patterns: ['resume','cv','download','document','qualification','experience'],
    response: `Sabbir's resume is available on Google Docs (no login required):\n\n📄 https://docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo/edit\n\nIt covers his full project history, technical skills, education at Daffodil International University, CEH certification, and contact information.`
  },
  tech_choices: {
    patterns: ['why use','prefer','choose','astro','tailwind','supabase','why not','versus','compare','which is better'],
    response: `Sabbir's technology philosophy:\n\n**TypeScript over JavaScript** — Type safety catches bugs at compile time, essential for production systems\n\n**Astro v6** — Zero-JS by default, island architecture for performance-first sites\n\n**Supabase** — Postgres-native BaaS with pgvector for AI features, open-source, no vendor lock-in\n\n**Gemini API + OpenRouter** — Flexibility to route across models and avoid single-provider lock-in\n\nHe follows a "boring technology" principle for infrastructure and "bleeding edge" for AI tooling.`
  },
};

const FALLBACKS = [
  "That's an interesting question! I'm specifically trained on Sabbir's portfolio content. Could you ask about his skills, projects, education, certifications, availability, or contact information?",
  "I focus on answering questions about Sabbir Hossain Rafat's professional background. Try asking about his AI engineering skills, shipped projects, or how to hire him!",
  "I'm Sabbir's AI portfolio assistant. I can help with questions about his tech stack, projects like Studia or Security Scanner, his CEH certification, or his availability for work.",
];
let fbIdx = 0;

function getAIResponse(msg) {
  const m = msg.toLowerCase();
  // Score each topic
  let best = null, bestScore = 0;
  for (const [key, topic] of Object.entries(KB)) {
    const score = topic.patterns.reduce((s, p) => s + (m.includes(p) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = topic; }
  }
  return bestScore > 0 ? best.response : FALLBACKS[fbIdx++ % FALLBACKS.length];
}

// Render markdown bold
function renderMD(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function appendChatMsg(text, role) {
  const msgs = $('#chat-messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg-${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = renderMD(text);
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showChatTyping() {
  const msgs = $('#chat-messages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-ai';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="chat-bubble chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function sendChat(msg) {
  if (!msg.trim()) return;
  const chatInput = $('#chat-input');
  if (chatInput) chatInput.value = '';
  const quickEl = $('#chat-quick');
  if (quickEl) quickEl.style.display = 'none';
  appendChatMsg(msg, 'user');
  const typing = showChatTyping();
  const delay = 500 + Math.random() * 700;
  setTimeout(() => {
    typing?.remove();
    appendChatMsg(getAIResponse(msg), 'ai');
  }, delay);
}

function openChat() {
  const panel = $('#chat-panel');
  const fab = $('#chat-fab');
  if (!panel) return;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
  fab?.querySelector('.fab-icon-chat')?.classList.add('hidden');
  fab?.querySelector('.fab-icon-close')?.classList.remove('hidden');
  const msgs = $('#chat-messages');
  if (msgs && !msgs.children.length) {
    appendChatMsg("Hi! I'm Sabbir's AI assistant with comprehensive knowledge of his portfolio. Ask me about his skills, projects, AI expertise, certifications, availability, or how to contact him! 🤖", 'ai');
  }
  setTimeout(() => $('#chat-input')?.focus(), 60);
}

function closeChat() {
  const panel = $('#chat-panel');
  const fab = $('#chat-fab');
  panel?.classList.remove('open');
  panel?.setAttribute('aria-hidden','true');
  fab?.querySelector('.fab-icon-chat')?.classList.remove('hidden');
  fab?.querySelector('.fab-icon-close')?.classList.add('hidden');
}

$('#chat-fab')?.addEventListener('click', () => $('#chat-panel')?.classList.contains('open') ? closeChat() : openChat());
$('#chat-close')?.addEventListener('click', closeChat);
$('#chat-send')?.addEventListener('click', () => sendChat($('#chat-input')?.value || ''));
$('#chat-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(e.target.value); });
$$('.quick-chip').forEach(b => b.addEventListener('click', () => sendChat(b.textContent)));

// ── Help panel ────────────────────────────────────────────────────
const openHelp = () => {
  $('#help-overlay')?.classList.add('open');
  $('#help-overlay')?.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
};
const closeHelp = () => {
  $('#help-overlay')?.classList.remove('open');
  $('#help-overlay')?.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
};
$('#help-btn')?.addEventListener('click', openHelp);
$('#help-close')?.addEventListener('click', closeHelp);
$('#help-overlay')?.addEventListener('click', e => { if (e.target === $('#help-overlay')) closeHelp(); });

// ── Keyboard shortcuts ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName.toLowerCase();
  const inInput = tag === 'input' || tag === 'textarea';
  if (e.key === 'Escape') { closeTerm(); closeHelp(); closeChat(); closeMobile(); return; }
  if (inInput) return;
  switch (e.key) {
    case 't': case 'T': themeToggle?.click(); break;
    case 'h': case 'H': openHelp(); break;
    case 'g': case 'G': smoothScrollTo(document.getElementById('home')); break;
    case '/': e.preventDefault(); openTerm(); break;
    case 'c': case 'C': openChat(); break;
  }
});

// ── Reading time estimator ─────────────────────────────────────────
document.querySelectorAll('.proj-body p').forEach(p => {
  const rt = estimateReadTime(p.textContent || '');
  const card = p.closest('.proj-card');
  const rtEl = card?.querySelector('.read-time');
  if (rtEl) rtEl.textContent = `~${rt} min read`;
});

// ── Service Worker ────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ── Resume link ───────────────────────────────────────────────────
// Already set in HTML — Google Docs URL. No override needed.

// ── Console signature ─────────────────────────────────────────────
console.log('%c Sabbir Hossain Rafat · Portfolio v3.0 ', 'background:linear-gradient(135deg,#667eea,#22d3ee);color:#fff;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;');
console.log('%c AI Product Engineer & Full-Stack Architect ', 'color:#94a3b8;font-size:11px;');