/* ============================================================
   SABBIR HOSSAIN RAFAT — Portfolio Script v3.1
   All fixes: Gemini circuit breaker, terminal bugs fixed,
   analytics backend, form security, touch cursor, ESC matrix
   ============================================================ */
'use strict';

/* ── Build-time injected constants ── */
const API_BASE = 'https://sabbir-rafat-portfolio.onrender.com';

const BUILD_DATE = (typeof __BUILD_DATE__ !== 'undefined' && __BUILD_DATE__)
  ? __BUILD_DATE__
  : null;

/* ── Helpers ── */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

function apiUrl(path) {
  return API_BASE ? `${API_BASE.replace(/\/$/, '')}${path}` : path;
}

function smoothScrollTo(target, duration = 720) {
  if (!target) return;
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + window.scrollY - 68;
  const diff = end - start;
  let t0 = null;
  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  const step = ts => {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0)/duration, 1);
    window.scrollTo(0, start + diff * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ════════════════ ANALYTICS (session + backend) ════════════════ */
const Analytics = (() => {
  const KEY = 'sabbir_analytics';
  let data = null;
  function load() {
    try { data = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { data = null; }
    if (!data) data = { visits: 0, sections: {}, totalTime: 0, startTime: Date.now() };
    data.visits++;
    data.startTime = Date.now();
    save();
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch {} }
  function trackSection(id) {
    if (!data) return;
    data.sections[id] = (data.sections[id] || 0) + 1;
    save();
    // Send to backend (fire and forget)
    try {
      navigator.sendBeacon(apiUrl('/analytics'), JSON.stringify({ event: 'section_view', section: id, ts: Date.now() }));
    } catch {}
  }
  function updateTime() {
    if (!data) return;
    data.totalTime = Date.now() - data.startTime;
    save();
    try {
      fetch(apiUrl('/analytics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'session_end', totalTime: data.totalTime, sections: data.sections }),
        keepalive: true
      }).catch(() => {});
    } catch {}
  }
  load();
  window.addEventListener('beforeunload', updateTime);
  window.addEventListener('visibilitychange', () => { if (document.hidden) updateTime(); });
  return { trackSection, get: () => data };
})();

/* ════════════════ DARK MODE SCHEDULER ════════════════ */
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) { document.documentElement.setAttribute('data-theme', saved); return; }
  const h = new Date().getHours();
  const autoDark = h >= 19 || h < 7;
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', (autoDark || preferred) ? 'dark' : 'light');
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

setInterval(() => {
  if (!localStorage.getItem('theme')) {
    const h = new Date().getHours();
    document.documentElement.setAttribute('data-theme', (h >= 19 || h < 7) ? 'dark' : 'light');
  }
}, 600000);

/* ════════════════ PROGRESS BAR ════════════════ */
const progressBar = $('#progress-bar');
function updateProgress() {
  if (!progressBar) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (h > 0 ? Math.min(window.scrollY / h * 100, 100) : 0) + '%';
}

/* ════════════════ CUSTOM CURSOR (touch device detection) ════════════════ */
const cursorDot  = $('#cursor-dot');
const cursorRing = $('#cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

// Only activate on pointer:fine devices (not touch screens)
const hasFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
if (hasFinePointer && cursorDot && cursorRing) {
  cursorDot.style.display = 'block';
  cursorRing.style.display = 'block';
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursorDot.style.left = mx + 'px';
    cursorDot.style.top  = my + 'px';
  });
  (function animRing() {
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();
  document.addEventListener('mouseover', e => {
    const int = e.target.closest('a,button,.pill,.proj-card,.about-card,.channel-item');
    cursorRing.style.width  = int ? '50px' : '34px';
    cursorRing.style.height = int ? '50px' : '34px';
    cursorRing.style.borderColor = int ? 'rgba(102,126,234,0.7)' : 'rgba(102,126,234,0.5)';
  });
}

/* ════════════════ PARTICLES ════════════════ */
(function initParticles() {
  const canvas = $('#particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT = Math.min(55, Math.floor(window.innerWidth / 24));
  let pmx = -9999, pmy = -9999;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function mkP() { return { x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.4+0.3, vx: (Math.random()-.5)*.22, vy: (Math.random()-.5)*.22, a: Math.random()*.38+0.08 }; }
  function init() { resize(); particles = Array.from({length: COUNT}, mkP); }
  window.addEventListener('mousemove', e => { pmx=e.clientX; pmy=e.clientY; });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      const dx=p.x-pmx, dy=p.y-pmy, d=Math.sqrt(dx*dx+dy*dy);
      if (d<90) { p.vx+=(dx/d)*.07*(90-d)/90; p.vy+=(dy/d)*.07*(90-d)/90; }
      p.vx*=.99; p.vy*=.99; p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(102,126,234,${p.a})`; ctx.fill();
    });
    for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<105){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(102,126,234,${(1-d/105)*.1})`;ctx.lineWidth=.55;ctx.stroke();}
    }
    requestAnimationFrame(draw);
  }
  init(); draw();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt=setTimeout(init,200); });
})();

/* ════════════════ NAVBAR ════════════════ */
const siteNav  = $('#site-nav');
const backToTop = $('#back-to-top');
function updateActiveNav() {
  const secs = $$('section[id]');
  let cur = '';
  secs.forEach(s => { if (window.scrollY >= s.offsetTop - 130) cur = s.id; });
  $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#'+cur));
}
function onScroll() {
  const y = window.scrollY;
  siteNav?.classList.toggle('scrolled', y > 40);
  backToTop?.classList.toggle('visible', y > 350);
  updateProgress(); updateActiveNav();
  $$('.orb').forEach((o,i) => { o.style.transform=`translateY(${y*[0.07,0.04,0.11][i]}px)`; });
}
window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
backToTop?.addEventListener('click', () => smoothScrollTo(document.getElementById('home')));

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const t = document.getElementById(id);
  if (t) { e.preventDefault(); smoothScrollTo(t); }
});

/* ════════════════ MOBILE MENU ════════════════ */
const hamburger  = $('#hamburger');
const mobileMenu = $('#mobile-menu');
const mobileBack = $('#mobile-backdrop');
const mobileX    = $('#mobile-close');
function openMobile() {
  hamburger?.classList.add('open'); mobileMenu?.classList.add('open'); mobileBack?.classList.add('open');
  mobileMenu?.setAttribute('aria-hidden','false'); hamburger?.setAttribute('aria-expanded','true');
  document.body.style.overflow='hidden';
}
function closeMobile() {
  hamburger?.classList.remove('open'); mobileMenu?.classList.remove('open'); mobileBack?.classList.remove('open');
  mobileMenu?.setAttribute('aria-hidden','true'); hamburger?.setAttribute('aria-expanded','false');
  document.body.style.overflow='';
}
hamburger?.addEventListener('click', () => mobileMenu?.classList.contains('open') ? closeMobile() : openMobile());
mobileX?.addEventListener('click', closeMobile);
mobileBack?.addEventListener('click', closeMobile);
$$('.mobile-link').forEach(l => l.addEventListener('click', closeMobile));
window.addEventListener('resize', () => { if (window.innerWidth >= 1050) closeMobile(); });

/* ════════════════ TYPING ANIMATION ════════════════ */
const phrases = ['AI Product Engineer','Full-Stack Developer','Secure AI Systems Builder','RAG Pipeline Architect','CEH-Certified Engineer'];
let pi=0, ci=0, deleting=false;
const typedEl = $('#typed-text');
function typeLoop() {
  if (!typedEl) return;
  const phrase = phrases[pi];
  if (!deleting) {
    typedEl.textContent = phrase.slice(0, ++ci);
    if (ci === phrase.length) { deleting=true; setTimeout(typeLoop,2400); return; }
    setTimeout(typeLoop, 72);
  } else {
    typedEl.textContent = phrase.slice(0, --ci);
    if (ci === 0) { deleting=false; pi=(pi+1)%phrases.length; setTimeout(typeLoop,450); return; }
    setTimeout(typeLoop, 40);
  }
}
setTimeout(typeLoop, 1000);

/* ════════════════ REVEAL OBSERVER ════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseInt(el.dataset.delay || '0', 10);
    setTimeout(() => {
      el.classList.add('visible');
      const sid = el.closest('section')?.id;
      if (sid) Analytics.trackSection(sid);
    }, delay);
    revealObs.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => revealObs.observe(el));

/* ════════════════ COUNTERS ════════════════ */
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    let t0 = null;
    const step = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts-t0)/1500, 1);
      el.textContent = Math.floor((1-Math.pow(1-p,3))*target);
      if (p < 1) requestAnimationFrame(step); else el.textContent = target;
    };
    requestAnimationFrame(step);
    counterObs.unobserve(el);
  });
}, { threshold: 0.6 });
$$('.counter').forEach(el => counterObs.observe(el));

/* ════════════════ 3D TILT ════════════════ */
$$('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY-r.top-r.height/2)/(r.height/2))*-6;
    const ry = ((e.clientX-r.left-r.width/2)/(r.width/2))*6;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

const avatarEl = $('#avatar-3d');
document.addEventListener('mousemove', e => {
  if (!avatarEl) return;
  const dx = (e.clientX-window.innerWidth/2)/(window.innerWidth/2);
  const dy = (e.clientY-window.innerHeight/2)/(window.innerHeight/2);
  avatarEl.style.transform = `perspective(900px) rotateY(${dx*8}deg) rotateX(${dy*-5}deg)`;
});

/* ════════════════ SKILL TOOLTIP ════════════════ */
const skillTip  = $('#skill-tip');
const tipName   = skillTip?.querySelector('.tip-name');
const tipFill   = skillTip?.querySelector('.tip-fill');
const tipLevel  = skillTip?.querySelector('.tip-level');
const tipDesc   = skillTip?.querySelector('.tip-desc');
function posTip(e) {
  if (!skillTip) return;
  const rect = skillTip.getBoundingClientRect();
  const x = e.clientX+14, y = e.clientY-10;
  skillTip.style.left = (x+rect.width>window.innerWidth ? e.clientX-rect.width-14 : x) + 'px';
  skillTip.style.top  = (y+rect.height>window.innerHeight ? e.clientY-rect.height-10 : y) + 'px';
}
$$('.pill').forEach(pill => {
  pill.addEventListener('mouseenter', e => {
    if (!skillTip) return;
    if (tipName)  tipName.textContent  = pill.textContent.trim();
    if (tipFill)  tipFill.style.width  = (pill.dataset.level||0) + '%';
    if (tipLevel) tipLevel.textContent = (pill.dataset.level||0) + '% proficiency';
    if (tipDesc)  tipDesc.textContent  = pill.dataset.desc || '';
    skillTip.classList.add('visible'); skillTip.setAttribute('aria-hidden','false');
    posTip(e);
  });
  pill.addEventListener('mousemove', posTip);
  pill.addEventListener('mouseleave', () => {
    skillTip?.classList.remove('visible'); skillTip?.setAttribute('aria-hidden','true');
    if (tipFill) tipFill.style.width = '0%';
  });
});

/* ════════════════ PROJECT FILTER ════════════════ */
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
    const filter = btn.dataset.filter;
    $$('.proj-card').forEach((card, i) => {
      const match = filter==='all' || (card.dataset.tags||'').toLowerCase().includes(filter.toLowerCase());
      if (!match) { card.classList.add('hidden'); return; }
      card.classList.remove('hidden');
      card.style.opacity='0'; card.style.transform='translateY(14px) scale(0.97)';
      setTimeout(() => {
        card.style.transition='opacity 0.35s ease,transform 0.35s ease';
        card.style.opacity='1'; card.style.transform='';
        setTimeout(() => { card.style.transition=''; }, 370);
      }, i*55);
    });
  });
});

/* ════════════════ RIPPLE ════════════════ */
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const span = document.createElement('span');
  const size = Math.max(rect.width, rect.height)*2.4;
  span.className='btn-ripple';
  span.style.cssText=`width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(span); setTimeout(() => span.remove(), 620);
});

/* ════════════════ DATES ════════════════ */
const LAST_UPDATED = BUILD_DATE || '2025-05-20';
const fyEl = $('#footer-year'); if (fyEl) fyEl.textContent = new Date().getFullYear();
const fdEl = $('#footer-date');
if (fdEl) {
  fdEl.textContent = new Date(LAST_UPDATED).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  fdEl.setAttribute('datetime', LAST_UPDATED);
}
const udEl = $('#last-updated-date');
if (udEl) {
  udEl.textContent = new Date(LAST_UPDATED).toLocaleDateString('en-US',{month:'short',year:'numeric'});
  udEl.setAttribute('datetime', LAST_UPDATED);
}
const nmEl = $('#now-month'); if (nmEl) nmEl.textContent = new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});

/* ════════════════ TIMEZONE HINT ════════════════ */
(function tzHint() {
  const el = $('#tz-text'); if (!el) return;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const sabbir = parseInt(new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:'Asia/Dhaka'}).format(new Date()), 10);
    el.textContent = `Your timezone: ${tz.replace(/_/g,' ')}. ${sabbir>=9&&sabbir<=22 ? 'Sabbir is likely online now — great time to reach out!' : 'Sabbir is in UTC+6 (Bangladesh). Best contact hours: 09:00–22:00 BDT.'}`;
  } catch { el.textContent = 'Sabbir is based in Dhaka, Bangladesh (UTC+6). Best hours: 09:00–22:00 BDT.'; }
})();

/* ════════════════ GITHUB API ════════════════ */
const GH_CACHE_KEY = 'sabbir_gh_cache';
const GH_CACHE_TTL = 300000; // 5 minutes

async function loadGitHub() {
  const feed = $('#github-feed');
  const GH   = 'SabbirHossainRafat';

  function fmt(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + ' min ago';
    if (diff < 86400) return Math.floor(diff/3600) + ' hr ago';
    if (diff < 2592000) return Math.floor(diff/86400) + ' days ago';
    return new Date(dateStr).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  }

  const icons = {
    PushEvent:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    CreateEvent:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    WatchEvent:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    ForkEvent:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
    PullRequestEvent: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>`,
  };
  const defIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  const labels = { PushEvent:'Pushed to', CreateEvent:'Created', WatchEvent:'Starred', ForkEvent:'Forked', PullRequestEvent:'PR on', IssuesEvent:'Issue on' };

  function renderEvents(events, fromCache = false) {
    if (!feed) return;
    if (!events || !events.length) {
      feed.innerHTML = `<div class="gh-error">No recent public activity. <a href="https://github.com/${GH}" target="_blank" rel="noopener noreferrer" class="inline-link">View on GitHub →</a></div>`;
      return;
    }
    const cacheNote = fromCache ? `<div class="gh-cached-note">⚡ Showing cached data</div>` : '';
    feed.innerHTML = cacheNote + events.slice(0,6).map(ev => {
      const icon  = icons[ev.type] || defIcon;
      const label = labels[ev.type] || (ev.type||'').replace('Event','');
      const repo  = (ev.repo?.name||'').replace(`${GH}/`,'') || 'repository';
      const time  = fmt(ev.created_at||'');
      let extra = '';
      if (ev.type==='PushEvent' && ev.payload?.commits?.length) {
        extra = ` — "${(ev.payload.commits[0].message||'').slice(0,60)}"`;
      }
      return `<div class="gh-event"><div class="gh-event-icon">${icon}</div><div class="gh-event-body"><div class="gh-event-title">${label} <strong>${repo}</strong>${extra}</div><div class="gh-event-time">${time}</div></div></div>`;
    }).join('');
  }

  // Try cache first for graceful fallback
  let cached = null;
  try {
    const c = JSON.parse(localStorage.getItem(GH_CACHE_KEY) || 'null');
    if (c && Date.now() - c.ts < GH_CACHE_TTL * 12) cached = c; // keep cache 1 hr for fallback
  } catch {}

  try {
    const [uRes, eRes] = await Promise.all([
      fetch(apiUrl(`/api/github?path=users/${GH}`), { signal: AbortSignal.timeout(8000) }),
      fetch(apiUrl(`/api/github?path=users/${GH}/events/public?per_page=10`), { signal: AbortSignal.timeout(8000) }),
    ]);

    if (uRes.ok) {
      const u = await uRes.json();
      const rn = $('#gh-repos-num');   if (rn) rn.textContent = u.public_repos ?? '—';
      const fn = $('#gh-followers-num'); if (fn) fn.textContent = u.followers ?? '—';
      const an = $('#gh-age-num');
      if (an && u.created_at) {
        const yrs = Math.floor((Date.now() - new Date(u.created_at).getTime()) / 31536e6);
        an.textContent = yrs + (yrs !== 1 ? ' yrs' : ' yr');
      }
      // Update project count from real repo data
      const rc = $('#gh-repo-count'); if (rc) rc.textContent = u.public_repos ?? '6';
    }

    if (eRes.ok) {
      const events = await eRes.json();
      try {
        const rr = await fetch(apiUrl(`/api/github?path=users/${GH}/repos?per_page=100`), { signal: AbortSignal.timeout(8000) });
        if (rr.ok) {
          const repos = await rr.json();
          const stars = repos.reduce((a, r) => a + (r.stargazers_count||0), 0);
          const sn = $('#gh-stars-num'); if (sn) sn.textContent = stars;
        }
      } catch {}
      // Save to cache
      try { localStorage.setItem(GH_CACHE_KEY, JSON.stringify({ ts: Date.now(), events })); } catch {}
      renderEvents(events, false);
    } else {
      throw new Error('GitHub API error: ' + eRes.status);
    }
  } catch (err) {
    // Graceful fallback to cached data
    if (cached && cached.events) {
      renderEvents(cached.events, true);
    } else {
      if (feed) feed.innerHTML = `<div class="gh-error">GitHub API unavailable. <a href="https://github.com/${GH}" target="_blank" rel="noopener noreferrer" class="inline-link">View profile →</a></div>`;
    }
  }
}
loadGitHub();

/* ════════════════ FORM TOKEN ════════════════ */
let formToken = '';
(async function fetchToken() {
  try {
    const r = await fetch(apiUrl('/form-token'));
    if (r.ok) { const d = await r.json(); formToken = d.token || ''; }
  } catch {}
  const inp = $('#form-token'); if (inp) inp.value = formToken;
})();

/* ════════════════ CONTACT FORM ════════════════ */
const contactForm  = $('#contact-form');
const fName        = $('#f-name');
const fEmail       = $('#f-email');
const fMsg         = $('#f-msg');
const charCount    = $('#char-count');
const submitBtn    = $('#form-submit');
const btnLabel     = submitBtn?.querySelector('.btn-label');
const btnSpinner   = submitBtn?.querySelector('.btn-spinner');
const btnCheck     = submitBtn?.querySelector('.btn-check');
const formGlobalEl = $('#form-global-err');

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const VALIDATORS = [
  [fName,  $('#err-name'),  v => v.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'],
  [fEmail, $('#err-email'), v => EMAIL_RE.test(v.trim()) ? '' : 'Invalid email address. Use format: name@domain.com'],
  [fMsg,   $('#err-msg'),   v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.'],
];

function validateField(input, errEl) {
  if (!input || !errEl) return true;
  const v = VALIDATORS.find(x => x[0] === input);
  if (!v) return true;
  const err = v[2](input.value);
  errEl.textContent = err;
  input.parentElement?.classList.toggle('has-error', !!err);
  return !err;
}

fMsg?.addEventListener('input', () => {
  if (charCount) charCount.textContent = (fMsg?.value||'').length;
  validateField(fMsg, VALIDATORS[2][1]);
});
VALIDATORS.forEach(([inp, err]) => {
  inp?.addEventListener('blur', () => validateField(inp, err));
  inp?.addEventListener('input', () => { if (inp?.parentElement?.classList.contains('has-error')) validateField(inp, err); });
});

function setSubmit(state) {
  if (!submitBtn) return;
  submitBtn.disabled = state === 'loading';
  if (btnLabel) btnLabel.textContent = state === 'success' ? 'Message Sent!' : state === 'loading' ? 'Sending…' : 'Send Message';
  btnSpinner?.classList.toggle('hidden', state !== 'loading');
  btnCheck?.classList.toggle('hidden', state !== 'success');
}

function showFormMsg(msg, isErr = true) {
  if (!formGlobalEl) return;
  formGlobalEl.textContent = msg;
  formGlobalEl.classList.remove('hidden', 'err', 'ok');
  formGlobalEl.classList.add(isErr ? 'err' : 'ok');
}

contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  formGlobalEl?.classList.add('hidden');
  const valid = VALIDATORS.every(([inp, err]) => validateField(inp, err));
  if (!valid) return;
  setSubmit('loading');
  const payload = {
    name:         fName.value.trim(),
    email:        fEmail.value.trim(),
    message:      fMsg.value.trim(),
    _token:       formToken,
    website:      '',
    phone_number: '',
  };
  try {
    const res = await fetch(apiUrl('/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setSubmit('success');
      showFormMsg('Message sent successfully!', false);
      contactForm.reset();
      if (charCount) charCount.textContent = '0';
      // Fix: refresh token so user can send another message without reload
      try {
        const tr = await fetch(apiUrl('/form-token'));
        if (tr.ok) { const d = await tr.json(); formToken = d.token||''; const inp=$('#form-token'); if(inp) inp.value=formToken; }
      } catch {}
      setTimeout(() => { setSubmit('idle'); formGlobalEl?.classList.add('hidden'); }, 4200);
    } else {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Server error. Please try again.');
    }
  } catch (err) {
    setSubmit('idle');
    // Fix: show real error for network failures, do NOT show false success
    const msg = err.message || '';
    if (msg.includes('fetch') || msg.includes('Failed') || msg.includes('NetworkError') || msg.includes('network')) {
      showFormMsg('Network error — message could not be delivered. Please try again or email me directly at sabbirrafat369@gmail.com', true);
    } else {
      showFormMsg(msg, true);
    }
  }
});

/* ════════════════ UBUNTU TERMINAL ════════════════ */
const termOverlay  = $('#terminal-overlay');
const termInput    = $('#term-input');
const termOutput   = $('#term-output');
const termOpenBtn  = $('#terminal-btn');
const termCloseBtn = $('#terminal-close-btn');
const termXDot     = $('#term-x-dot');
const termCwdEl    = $('#term-cwd-display');
const termUserEl   = $('#tp-user');
const termHostEl   = $('#tp-host');
const termTitleEl  = $('#term-title-bar');

const SESS_KEY = 'sabbir_terminal_session';
let termHistory = [], histIdx = -1;
let tabMatches = [], tabIdx = -1;
let termCwd = '~';
let termUser = 'sabbir', termHost = 'ubuntu';
let matrixRunning = false, matrixStop = null;
let sessionId = Math.random().toString(36).slice(2);

// Fix: persist terminal history in localStorage
(function loadTermHistory() {
  try { termHistory = JSON.parse(localStorage.getItem(SESS_KEY) || '[]'); } catch { termHistory = []; }
})();
function saveTermHistory() {
  try { localStorage.setItem(SESS_KEY, JSON.stringify(termHistory.slice(0,100))); } catch {}
}

const ALL_CMDS = ['help','about','skills','projects','contact','education','certifications',
  'experience','whoami','hostname','ls','ls -la','cd','cat','pwd','uname','date','echo',
  'clear','exit','matrix','ai','session','stats','node','python','git'];

function escH(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function makePromptHTML() {
  return `<span class="tp-user">${escH(termUser)}</span><span class="tp-at">@</span><span class="tp-host">${escH(termHost)}</span><span class="tp-sep">:</span><span class="tp-dir">${escH(termCwd)}</span><span class="tp-dollar">$</span>`;
}

function updatePromptDisplay() {
  if (termCwdEl)   termCwdEl.textContent   = termCwd;
  if (termUserEl)  termUserEl.textContent   = termUser;
  if (termHostEl)  termHostEl.textContent   = termHost;
  if (termTitleEl) termTitleEl.textContent  = `${termUser}@${termHost}: ${termCwd}`;
}

function termPrint(lines) {
  if (!termOutput || lines === null) return;
  const div = document.createElement('div');
  div.style.marginBottom = '4px';
  div.innerHTML = lines.map(l => `<span class="term-line">${l}</span>`).join('<br>');
  termOutput.appendChild(div);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function termEcho(cmd) {
  if (!termOutput) return;
  const div = document.createElement('div');
  div.innerHTML = `<span class="term-line">${makePromptHTML()} ${escH(cmd)}</span>`;
  termOutput.appendChild(div);
}

function makeBar(pct, width = 30) {
  const filled = Math.round((pct/100)*width);
  const empty  = width - filled;
  const color  = pct>80?'t-bright-red':pct>60?'t-bright-yellow':'t-bright-green';
  return `<span class="${color}">[${'\u2588'.repeat(filled)}${'\u2591'.repeat(empty)}]</span>`;
}

/* Terminal knowledge base */
const TERM_CMDS = {
  help: () => [
    `<span class="t-bright-cyan t-bold">Available commands</span>`, ``,
    `  <span class="t-bright-green">about</span>           Info about Sabbir`,
    `  <span class="t-bright-green">skills</span>          Technical skills`,
    `  <span class="t-bright-green">projects</span>        All projects`,
    `  <span class="t-bright-green">contact</span>         Contact info`,
    `  <span class="t-bright-green">education</span>       University`,
    `  <span class="t-bright-green">certifications</span>  CEH credentials`,
    `  <span class="t-bright-green">ls</span> / <span class="t-bright-green">ls -la</span>    List directory`,
    `  <span class="t-bright-green">cd</span> [dir]        Change directory`,
    `  <span class="t-bright-green">cat</span> [file]      Read file`,
    `  <span class="t-bright-green">pwd</span>             Working directory`,
    `  <span class="t-bright-green">whoami</span>          Current user`,
    `  <span class="t-bright-green">hostname</span>        System hostname`,
    `  <span class="t-bright-green">uname -a</span>        System info`,
    `  <span class="t-bright-green">date</span>            Current date/time`,
    `  <span class="t-bright-green">node/python/git --version</span>`,
    `  <span class="t-bright-green">stats</span>           CPU/RAM stats`,
    `  <span class="t-bright-green">ai</span> "question"  Ask AI assistant`,
    `  <span class="t-bright-green">matrix</span>          Matrix animation (ESC to stop)`,
    `  <span class="t-bright-green">session save|load|clear</span>`,
    `  <span class="t-bright-green">clear</span>           Clear terminal`,
    `  <span class="t-bright-green">exit</span>            Close terminal`, ``,
    `<span class="t-dim">Tab: complete  Tab×2: cycle  ↑↓: history</span>`,
  ],
  about: () => [
    `<span class="t-bright-cyan t-bold">Sabbir Hossain Rafat</span>`,
    `<span class="t-dim">══════════════════════════════</span>`,
    `Role     : <span class="t-bright-green">AI Product Engineer & Full-Stack Architect</span>`,
    `Location : Dhaka, Bangladesh (UTC+6)`,
    `Uni      : <span class="t-bright-yellow">Daffodil International University</span>`,
    `Degree   : BSc Software Engineering (started 2024)`,
    `Status   : <span class="t-bright-green">Open to core engineering roles</span>`,
  ],
  skills: () => [
    `<span class="t-bright-cyan t-bold">Technical Skills</span>`,
    `<span class="t-dim">══════════════════════════════</span>`,
    `<span class="t-bright-yellow">Languages </span> TypeScript(95%) JS(92%) Python(80%) C(65%) Node.js(88%)`,
    `<span class="t-bright-yellow">Frameworks</span> Astro v6(90%) Tailwind v4(93%) React(86%) Next.js(78%)`,
    `<span class="t-bright-yellow">AI/Cloud  </span> Gemini API(88%) OpenRouter(85%) Supabase(83%)`,
    `<span class="t-bright-yellow">Payments  </span> Stripe(82%) bKash/NAGAD(78%) SSLCOMMERZ(75%)`,
    `<span class="t-bright-yellow">DevOps    </span> Git/GitHub(91%) Linux(86%) Docker(71%)`,
    `<span class="t-bright-yellow">Security  </span> CEH · API Security · OWASP · Pentest`,
  ],
  projects: () => [
    `<span class="t-bright-cyan t-bold">Shipped Projects</span>`,
    `<span class="t-dim">══════════════════════════════</span>`,
    `<span class="t-bright-green">studia</span>           Academic management (JS, HTML5)`,
    `<span class="t-bright-green">authpage</span>         3D React auth with TOTP (React, TS, Security)`,
    `<span class="t-bright-green">security-scanner</span> OWASP vulnerability tool (Python)`,
    `<span class="t-bright-green">vanish-pen</span>       Auto-fading canvas app (JS, Canvas)`,
    `<span class="t-bright-green">artmoji</span>          Text-to-dot-art parser (JS)`,
    `<span class="t-bright-green">mystical-dragon</span>  3D WebGL dragon (JS, TS, Three.js)`, ``,
    `GitHub: <span class="t-bright-cyan">github.com/SabbirHossainRafat</span>`,
  ],
  contact: () => [
    `<span class="t-bright-cyan t-bold">Contact Information</span>`,
    `<span class="t-dim">══════════════════════════════</span>`,
    `Email   : <span class="t-bright-green">sabbirrafat369@gmail.com</span>`,
    `GitHub  : <span class="t-bright-cyan">github.com/SabbirHossainRafat</span>`,
    `LinkedIn: <span class="t-bright-cyan">linkedin.com/in/sabbirhossainrafat</span>`,
    `Twitter : <span class="t-bright-cyan">x.com/sabbir_rafat</span>`,
    `Resume  : <span class="t-bright-cyan">docs.google.com/document/d/1s2c_ilaTXWodISMNfIhg0M_QlBbPbESNaf1xoDqWr64</span>`,
  ],
  education: () => [
    `<span class="t-bright-cyan t-bold">Education</span>`,
    `<span class="t-dim">══════════════════════════════</span>`,
    `Institution: <span class="t-bright-yellow">Daffodil International University</span>`,
    `Degree     : BSc Software Engineering`,
    `Started    : 2024`,
    `Focus      : Algorithms · AI/ML · Web Engineering · Cyber Security`,
  ],
  certifications: () => [
    `<span class="t-bright-cyan t-bold">Certifications</span>`,
    `<span class="t-dim">══════════════════════════════</span>`,
    `<span class="t-bright-green">✓ CEH</span> — Certified Ethical Hacker (Arena Web Security)`, ``,
    `  Domains: Network Scanning · System Hacking · Web App Hacking`,
    `           Cryptography · SQL Injection · Social Engineering`,
  ],
  date:   () => [new Date().toString()],
  clear:  () => { if (termOutput) termOutput.innerHTML = ''; return null; },
  exit:   () => { closeTerm(); return null; },
};

async function runCmd(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  termHistory.unshift(trimmed); histIdx = -1;
  tabMatches = []; tabIdx = -1;
  termEcho(trimmed);
  saveTermHistory();

  const parts = trimmed.split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const args  = parts.slice(1);

  // Built-in knowledge-base commands
  if (TERM_CMDS[cmd]) {
    const r = TERM_CMDS[cmd](args); if (r !== null) termPrint(r); return;
  }

  // whoami — calls backend for real username
  if (cmd === 'whoami') {
    try {
      const r = await fetch(apiUrl('/whoami'));
      const d = await r.json();
      termPrint([d.username || 'sabbir']);
    } catch { termPrint([termUser]); }
    return;
  }

  // hostname
  if (cmd === 'hostname') {
    try {
      const r = await fetch(apiUrl('/hostname'));
      const d = await r.json();
      termPrint([d.hostname || 'ubuntu']);
    } catch { termPrint([termHost]); }
    return;
  }

  // uname
  if (cmd === 'uname') {
    try {
      const r = await fetch(apiUrl('/system-info'));
      const d = await r.json();
      termPrint([d.uname || 'Linux ubuntu 6.8.0 #1 SMP x86_64 GNU/Linux']);
    } catch { termPrint(['Linux ubuntu 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux']); }
    return;
  }

  // pwd — via /exec backend
  if (cmd === 'pwd') {
    try {
      const r = await fetch(apiUrl('/exec'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({command:'pwd', session_id: sessionId}) });
      const d = await r.json();
      if (d.cwd) termCwd = d.cwd.replace('/home/sabbir','~').replace('/home/'+termUser,'~') || termCwd;
      termPrint([d.output || termCwd]);
      updatePromptDisplay();
    } catch { termPrint([termCwd === '~' ? `/home/${termUser}` : termCwd]); }
    return;
  }

  // ls — via /exec backend
  if (cmd === 'ls') {
    const lsCmd = args.includes('-la') || args.includes('-l') ? 'ls -la' : 'ls';
    try {
      const r = await fetch(apiUrl('/exec'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({command: lsCmd + (args.filter(a=>!a.startsWith('-')).length ? ' '+args.filter(a=>!a.startsWith('-')).join(' ') : ''), session_id: sessionId}) });
      const d = await r.json();
      if (d.error) termPrint([`<span class="t-bright-red">${escH(d.output||d.error)}</span>`]);
      else termPrint((d.output||'').split('\n').filter(Boolean).map(l => escH(l)));
    } catch { termPrint([`<span class="t-bright-red">ls: backend unavailable</span>`]); }
    return;
  }

  // cd — validate and update CWD via /exec
  if (cmd === 'cd') {
    // Bug fix: cd with no args goes home silently
    if (!args[0] || args[0] === '~') { termCwd = '~'; updatePromptDisplay(); return; }
    // Bug fix: cd .. navigates to parent properly
    if (args[0] === '..') {
      if (termCwd === '~') return; // already at home
      const parts2 = termCwd.split('/');
      if (parts2.length <= 1 || (parts2.length === 1 && parts2[0] === '~')) { termCwd = '~'; }
      else { parts2.pop(); termCwd = parts2.join('/') || '~'; }
      updatePromptDisplay(); return;
    }
    try {
      const r = await fetch(apiUrl('/exec'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({command: `cd ${args[0]}`, session_id: sessionId}) });
      const d = await r.json();
      if (d.error || (d.output && d.output.includes('No such file'))) {
        termPrint([`<span class="t-bright-red">bash: cd: ${escH(args[0])}: No such file or directory</span>`]);
      } else {
        termCwd = (d.cwd||args[0]).replace('/home/'+termUser,'~').replace('/home/sabbir','~');
        updatePromptDisplay();
      }
    } catch {
      // Graceful fallback: update locally
      if (args[0].startsWith('/') || args[0].startsWith('~')) termCwd = args[0].replace('/home/sabbir','~').replace('/home/'+termUser,'~');
      else termCwd = (termCwd === '~' ? `~/${args[0]}` : `${termCwd}/${args[0]}`);
      updatePromptDisplay();
    }
    return;
  }

  // cat — via /exec
  if (cmd === 'cat') {
    const farg = args[0] || '';
    // Resolve tilde paths
    const resolved = farg.replace(/^~/, `/home/${termUser}`);
    try {
      const r = await fetch(apiUrl('/exec'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({command: `cat ${resolved}`, session_id: sessionId}) });
      const d = await r.json();
      if (d.error || (d.output && d.output.includes('No such file'))) termPrint([`<span class="t-bright-red">cat: ${escH(farg)}: No such file or directory</span>`]);
      else termPrint((d.output||'').split('\n').map(l => escH(l)));
    } catch { termPrint([`<span class="t-bright-red">cat: backend unavailable</span>`]); }
    return;
  }

  // echo
  if (cmd === 'echo') { termPrint([escH(args.join(' '))]); return; }

  // sudo — professional message
  if (cmd === 'sudo') {
    termPrint([
      `<span class="t-bright-red">Administrative commands are disabled in this terminal.</span>`,
      `Type <span class="t-bright-green">help</span> to see available commands.`
    ]); return;
  }

  // node/python/git --version
  if (cmd === 'node' || cmd === 'python' || cmd === 'python3' || cmd === 'git') {
    const vFlag = args[0] === '--version' || args[0] === '-v' || args[0] === 'version';
    const ep = cmd === 'node' ? '/version/node' : (cmd.startsWith('python') ? '/version/python' : '/version/git');
    if (vFlag) {
      try {
        const r = await fetch(apiUrl(ep));
        const d = await r.json();
        termPrint([d.version || `${cmd}: version unavailable`]);
      } catch { termPrint([`${cmd}: could not retrieve version`]); }
    } else if (cmd === 'git' && args[0] === 'log') {
      termPrint([`commit a3f2b91 (HEAD -> main)`,`Author: Sabbir Hossain Rafat <sabbirrafat369@gmail.com>`,`Date: ${new Date().toUTCString()}`,``,`    Portfolio v3.1 — all fixes applied`]);
    } else {
      termPrint([`${cmd}: try ${cmd} --version`]);
    }
    return;
  }

  // stats
  if (cmd === 'stats') {
    termPrint([`<span class="t-bright-cyan">Fetching system stats…</span>`]);
    try {
      const r = await fetch(apiUrl('/stats'));
      const d = await r.json();
      if (d.error) { termPrint([`<span class="t-bright-yellow">Warning: ${escH(d.error)}</span>`]); return; }
      termPrint([
        `<span class="t-bright-cyan t-bold">System Stats</span>`,
        `<span class="t-dim">══════════════════════════════</span>`,
        `CPU : ${makeBar(d.cpu_percent)} ${d.cpu_percent}%`,
        `RAM : ${makeBar(d.memory_percent)} ${d.memory_used_mb}MB / ${d.memory_total_mb}MB (${d.memory_percent}%)`,
        `<span class="t-dim">via psutil — backend system</span>`,
      ]);
    } catch { termPrint([`<span class="t-bright-red">Could not fetch stats. Backend may be offline.</span>`]); }
    return;
  }

  // ai — chat endpoint
  if (cmd === 'ai') {
    const q = args.join(' ').replace(/^["']|["']$/g,'').trim();
    if (!q) { termPrint([`Usage: ai "your question here"`]); return; }
    termPrint([`<span class="t-dim">Thinking…</span>`]);
    try {
      const r = await fetch(apiUrl('/chat'), {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({message: q, session_id: 'terminal_' + sessionId})
      });
      const d = await r.json();
      const resp = (d.response || 'No response.').replace(/\*\*/g,'').replace(/\*/g,'');
      const src  = d.source === 'gemini' ? ' <span class="t-dim">[Gemini]</span>' : ' <span class="t-dim">[local AI]</span>';
      termPrint([`<span class="t-bright-cyan">Sabbir AI${src}:</span>`, ...resp.split('\n').map(l => escH(l))]);
    } catch { termPrint([`<span class="t-bright-red">AI unavailable. Try the chat button on the page.</span>`]); }
    return;
  }

  // matrix — ESC to stop
  if (cmd === 'matrix') { runMatrix(); return; }

  // session
  if (cmd === 'session') {
    const sub = (args[0]||'').toLowerCase();
    if (sub === 'save') {
      saveTermHistory();
      termPrint([`<span class="t-bright-green">Session saved (${termHistory.length} commands).</span>`]);
    } else if (sub === 'load') {
      const loaded = (() => { try { return JSON.parse(localStorage.getItem(SESS_KEY)||'[]'); } catch { return []; } })();
      if (!loaded.length) { termPrint([`<span class="t-dim">No saved session.</span>`]); return; }
      termHistory = loaded;
      termPrint([`<span class="t-bright-cyan">Loaded ${loaded.length} commands.</span>`, ...loaded.slice(0,5).map(c => `  <span class="t-dim">${escH(c)}</span>`)]);
    } else if (sub === 'clear') {
      localStorage.removeItem(SESS_KEY); termHistory = [];
      termPrint([`<span class="t-bright-green">Session cleared.</span>`]);
    } else {
      termPrint([`Usage: session <span class="t-bright-green">save</span> | <span class="t-bright-green">load</span> | <span class="t-bright-green">clear</span>`]);
    }
    return;
  }

  termPrint([`<span class="t-bright-white">bash:</span> ${escH(cmd)}: command not found`, `Type <span class="t-bright-green">help</span> to see available commands.`]);
}

/* Matrix animation — ESC stops it */
function runMatrix() {
  if (matrixRunning) return;
  matrixRunning = true;
  const chars = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rows = 12, cols = 40;
  const matrix = Array.from({length:rows}, () => Array.from({length:cols}, () => ''));
  let raf, startTime = null, stopped = false;
  const container = document.createElement('div');
  container.style.cssText = 'font-family:Ubuntu Mono,monospace;color:#4e9a06;background:#000;padding:8px;border-radius:6px;margin-bottom:8px;line-height:1.5;overflow:hidden;';
  termOutput.appendChild(container);
  termOutput.scrollTop = termOutput.scrollHeight;

  const rand = arr => arr[Math.floor(Math.random()*arr.length)];

  function stop() {
    if (stopped) return;
    stopped = true; matrixRunning = false;
    if (raf) cancelAnimationFrame(raf);
    container.innerHTML = '<div style="color:#8ae234">Wake up, Sabbir… The Matrix has you.</div>';
    termOutput.scrollTop = termOutput.scrollHeight;
    document.removeEventListener('keydown', onKey);
    matrixStop = null;
  }

  function onKey(e) { if (e.key === 'Escape' || e.key === ' ') stop(); }
  document.addEventListener('keydown', onKey);
  matrixStop = stop;

  function frame(ts) {
    if (stopped) return;
    if (!startTime) startTime = ts;
    if (ts - startTime > 8000) { stop(); return; }
    for (let i=0; i<20; i++) { matrix[Math.floor(Math.random()*rows)][Math.floor(Math.random()*cols)] = rand(chars); }
    container.innerHTML = matrix.map(row =>
      '<div>' + row.map(ch => `<span style="color:${Math.random()<0.1?'#8ae234':'#4e9a06'}">${ch||' '}</span>`).join('') + '</div>'
    ).join('');
    termOutput.scrollTop = termOutput.scrollHeight;
    raf = requestAnimationFrame(frame);
  }
  termPrint([`<span class="t-dim">Press ESC or SPACE to stop…</span>`]);
  raf = requestAnimationFrame(frame);
}

/* Terminal open/close */
function openTerm() {
  if (!termOverlay) return;
  termOverlay.classList.add('open'); termOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if (termOutput) termOutput.style.maxHeight = Math.floor(window.innerHeight*0.58)+'px';
  // Fetch real whoami and hostname on first open
  if (!termOutput || termOutput.children.length === 0) {
    Promise.all([
      fetch(apiUrl('/whoami')).then(r=>r.json()).catch(()=>({username:'sabbir'})),
      fetch(apiUrl('/hostname')).then(r=>r.json()).catch(()=>({hostname:'ubuntu'})),
    ]).then(([w,h]) => {
      termUser = w.username || 'sabbir';
      termHost = h.hostname || 'ubuntu';
      updatePromptDisplay();
    });
    termPrint([
      `<span class="t-bright-white">Ubuntu 24.04.1 LTS</span>`, ``,
      `Welcome to <span class="t-bright-cyan">Sabbir's Portfolio Terminal</span>`,
      `System: ${new Date().toDateString()} | Special: <span class="t-bright-green">stats</span> <span class="t-bright-green">ai</span> <span class="t-bright-green">matrix</span>`, ``,
      `Type <span class="t-bright-green">help</span> for available commands.`, ``,
    ]);
  }
  updatePromptDisplay();
  setTimeout(() => termInput?.focus(), 80);
}
function closeTerm() {
  termOverlay?.classList.remove('open'); termOverlay?.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  if (matrixStop) matrixStop();
}

termOpenBtn?.addEventListener('click', openTerm);
termCloseBtn?.addEventListener('click', closeTerm);
termXDot?.addEventListener('click', closeTerm);
termOverlay?.addEventListener('click', e => { if (e.target === termOverlay) closeTerm(); });

window.addEventListener('resize', () => {
  if (termOverlay?.classList.contains('open') && termOutput) {
    termOutput.style.maxHeight = Math.floor(window.innerHeight*0.58)+'px';
    termOutput.scrollTop = termOutput.scrollHeight;
  }
});

/* Tab completion — Bug 3 fix: cycle through multiple matches */
termInput?.addEventListener('keydown', async e => {
  if (e.key === 'Enter') {
    const v = termInput.value; termInput.value = '';
    tabMatches = []; tabIdx = -1;
    await runCmd(v);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx < termHistory.length-1) termInput.value = termHistory[++histIdx];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx > 0) termInput.value = termHistory[--histIdx]; else { histIdx=-1; termInput.value=''; }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const cur = termInput.value;
    if (!cur) return;
    // If already cycling, move to next match
    if (tabMatches.length > 1 && cur === tabMatches[tabIdx]) {
      tabIdx = (tabIdx+1) % tabMatches.length;
      termInput.value = tabMatches[tabIdx]; return;
    }
    const partial = cur.toLowerCase();
    tabMatches = ALL_CMDS.filter(k => k.startsWith(partial));
    if (tabMatches.length === 0) {
      termInput.style.color = '#ef2929';
      setTimeout(() => { termInput.style.color = ''; }, 200);
    } else if (tabMatches.length === 1) {
      termInput.value = tabMatches[0]; tabMatches = []; tabIdx = -1;
    } else {
      // Show all matches, then cycle
      tabIdx = 0;
      const div = document.createElement('div');
      div.className='term-line'; div.style.marginBottom='4px';
      div.innerHTML=`<div class="term-completions">${tabMatches.map(m=>`<span class="term-completion-item">${m}</span>`).join('')}</div>`;
      termOutput?.appendChild(div); termOutput.scrollTop = termOutput.scrollHeight;
      termInput.value = tabMatches[tabIdx];
    }
  } else if (e.key === 'Escape' && matrixStop) {
    matrixStop();
  }
});

/* ════════════════ SABBIR AI CHATBOT ════════════════ */

/* Gemini circuit breaker state */
let geminiFailures = 0;
let geminiDisabledUntil = 0;
const GEMINI_CB_THRESHOLD = 3;
const GEMINI_CB_COOLDOWN  = 60000; // 60s

function isGeminiCircuitOpen() {
  if (geminiFailures >= GEMINI_CB_THRESHOLD) {
    if (Date.now() < geminiDisabledUntil) return true;
    // Reset after cooldown
    geminiFailures = 0; geminiDisabledUntil = 0;
  }
  return false;
}
function recordGeminiFailure() {
  geminiFailures++;
  if (geminiFailures >= GEMINI_CB_THRESHOLD) {
    geminiDisabledUntil = Date.now() + GEMINI_CB_COOLDOWN;
  }
}
function recordGeminiSuccess() { geminiFailures = 0; geminiDisabledUntil = 0; }

/* Local fallback */
function classifyIntent(msg) {
  const m = msg.toLowerCase();
  if (/(who are you|your name|about sabbir|introduce|tell me about yourself)/.test(m)) return 'identity';
  if (/(rag|retrieval augmented|vector|embedding|langchain|langgraph|agent|orchestrat)/.test(m)) return 'ai_advanced';
  if (/\bai\b|llm|language model|gemini|openrouter|machine learning|artificial intel/.test(m)) return 'ai';
  if (/(security scanner|owasp|vulnerability|pentest|ethical hack|ceh|injection|xss|csrf)/.test(m)) return 'security_deep';
  if (/(studia|authpage|vanish pen|artmoji|mystical dragon|projects|shipped|built|made)/.test(m)) return 'projects';
  if (/(typescript|javascript|python|node\.?js|react|next\.?js|astro|tailwind|supabase|postgres|docker|linux|git)/.test(m)) return 'skills_tech';
  if (/(skill|tech|stack|know|proficiency|expertise|good at|use|framework|tool|language)/.test(m)) return 'skills';
  if (/(stripe|bkash|nagad|sslcommerz|payment|fintech|gateway)/.test(m)) return 'fintech';
  if (/(education|university|degree|daffodil|student|study|course|academic)/.test(m)) return 'education';
  if (/(certification|ceh|ec-council|certified|credential|certificate|arena)/.test(m)) return 'certification';
  if (/(available|open to work|hiring|job|role|position|opportunity|freelance|contract|recruit|remote)/.test(m)) return 'availability';
  if (/(contact|email|linkedin|github|twitter|social|reach|find|message|connect)/.test(m)) return 'contact';
  if (/(resume|cv|download|document)/.test(m)) return 'resume';
  if (/(salary|rate|charge|cost|price|budget)/.test(m)) return 'rate';
  if (/(hello|hi\b|hey\b|good morning|good evening|how are you)/.test(m)) return 'greeting';
  if (/(thank|thanks|appreciate|great|nice|awesome|cool|perfect)/.test(m)) return 'gratitude';
  if (/(philosophy|approach|mindset|values|believe|principle)/.test(m)) return 'philosophy';
  if (/(location|where|country|city|timezone|based|live|dhaka|bangladesh)/.test(m)) return 'location';
  if (/[\u0980-\u09FF]/.test(msg)) return 'bengali';
  return 'general';
}
const LOCAL_RESPONSES = {
  identity: () => `I'm **Sabbir Hossain Rafat** — an AI Product Engineer & Full-Stack Architect based in Dhaka, Bangladesh. I study Software Engineering at Daffodil International University (started 2024) and I'm actively seeking core engineering roles.`,
  ai: () => `Sabbir's AI engineering: **Gemini API** and **OpenRouter** for production AI systems — RAG pipelines with Supabase pgvector, LLM orchestration, and full-stack AI products.`,
  ai_advanced: () => `Sabbir uses **Supabase pgvector** for vector storage, **Gemini API** for embeddings, and is exploring **LangGraph** for multi-agent orchestration.`,
  skills: () => `**Top skills:** TypeScript (95%), HTML5/CSS3 (96%), Tailwind v4 (93%), Gemini API (88%), Node.js (88%), React (86%), Astro v6 (90%), Git/GitHub (91%).`,
  skills_tech: msg => {
    const m = msg.toLowerCase();
    if (m.includes('typescript')) return `TypeScript is Sabbir's **primary language at 95%** — used across all production codebases.`;
    if (m.includes('python')) return `Python at **80%** — AI/ML pipelines, automation, Flask APIs. His Security Scanner is built in Python.`;
    if (m.includes('react')) return `React at **86%** — component UIs with hooks, context, concurrent rendering.`;
    return LOCAL_RESPONSES.skills();
  },
  security_deep: () => `Sabbir holds **CEH — Certified Ethical Hacker** from **Arena Web Security**. Covers network scanning, system hacking, web app attacks (SQLi, XSS, CSRF), cryptography, and social engineering.`,
  projects: () => `**6 shipped projects:**\n1. **Studia** — Academic management (JavaScript, HTML5)\n2. **AuthPage** — 3D React auth with TOTP\n3. **Security Scanner** — Python OWASP tool\n4. **Vanish Pen** — Auto-fading canvas\n5. **Artmoji** — Text-to-dot-art\n6. **Mystical Dragon** — 3D WebGL Three.js\n\ngithub.com/SabbirHossainRafat`,
  education: () => `**BSc Software Engineering** at **Daffodil International University**, Dhaka — started 2024. Covers algorithms, AI/ML, web engineering, cyber security.`,
  certification: () => `**CEH — Certified Ethical Hacker** from **Arena Web Security**. Validates expertise in network security, system hacking, web app hacking, and cryptography.`,
  availability: () => `Yes! Sabbir is **actively available** for full-time engineering roles, contract projects, and remote-first teams globally.\n\nContact: **sabbirrafat369@gmail.com**`,
  contact: () => `📧 sabbirrafat369@gmail.com\n🐙 github.com/SabbirHossainRafat\n💼 linkedin.com/in/sabbirhossainrafat\n🐦 @sabbir_rafat`,
  resume: () => `Resume: https://docs.google.com/document/d/1s2c_ilaTXWodISMNfIhg0M_QlBbPbESNaf1xoDqWr64/edit?usp=sharing`,
  fintech: () => `**Stripe** (82%), **bKash/NAGAD** (78%), **SSLCOMMERZ** (75%) — production payment gateway integrations for global and South Asian markets.`,
  philosophy: () => `*"Software is not just code — it's a living system. Great engineering means writing for the machine today and the engineer tomorrow."*`,
  location: () => `**Dhaka, Bangladesh** (UTC+6). Available for remote globally. Best contact: 09:00–22:00 BDT.`,
  rate: () => `Contact **sabbirrafat369@gmail.com** or LinkedIn for compensation discussions.`,
  greeting: () => `Hi! 👋 I'm Sabbir's AI. Ask about his skills, projects, certifications, or how to contact him!`,
  gratitude: () => `You're welcome! Feel free to ask anything else about Sabbir.`,
  bengali: () => `আমি Sabbir Hossain Rafat-এর AI সহকারী। তার দক্ষতা, প্রজেক্ট, শিক্ষা, সার্টিফিকেশন এবং যোগাযোগের তথ্য সম্পর্কে জিজ্ঞেস করুন।`,
  general: msg => {
    const m = msg.toLowerCase();
    if (m.includes('studia')) return `**Studia** — Academic management system (GPA calculation, schedule tracking). Tech: JavaScript, HTML5.`;
    if (m.includes('authpage')) return `**AuthPage** — 3D React authentication with TOTP. Tech: React, TypeScript, Security focus.`;
    if (m.includes('scanner')) return `**Security Scanner** — Automated OWASP Top-10 vulnerability tool. Tech: Python.`;
    if (m.includes('vanish')) return `**Vanish Pen** — Auto-fading canvas drawing with pressure simulation. Tech: JavaScript.`;
    if (m.includes('artmoji')) return `**Artmoji** — Text-to-dot-art parser with customisable density. Tech: JavaScript.`;
    if (m.includes('dragon')) return `**Mystical Dragon** — 3D WebGL interactive dragon with physics. Tech: JavaScript, TypeScript, Three.js.`;
    return `I'm Sabbir's AI. Ask about his skills, projects, education, CEH certification (Arena Web Security), or how to contact him.`;
  },
};

function getAIResponse(msg) {
  const intent = classifyIntent(msg);
  const fn = LOCAL_RESPONSES[intent] || LOCAL_RESPONSES.general;
  return (intent === 'skills_tech' || intent === 'general') ? fn(msg) : fn();
}

/* Chat UI */
const chatFab      = $('#chat-fab');
const chatPanel    = $('#chat-panel');
const chatClose    = $('#chat-close');
const chatMsgs     = $('#chat-messages');
const chatInput    = $('#chat-input');
const chatSend     = $('#chat-send');
const fabIconChat  = chatFab?.querySelector('.fab-icon-chat');
const fabIconClose = chatFab?.querySelector('.fab-icon-close');
const chatQuick    = $('#chat-quick');

const chatHistory = [];
const CHAT_SID    = 'chat_' + Math.random().toString(36).slice(2);

function appendChatMsg(text, role) {
  if (!chatMsgs) return;
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg-${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  div.appendChild(bubble);
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

function showChatTyping() {
  if (!chatMsgs) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-ai'; div.id = 'typing-indicator';
  div.innerHTML = '<div class="chat-bubble chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  chatMsgs.appendChild(div); chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

async function sendChat(msg) {
  if (!msg.trim()) return;
  if (chatInput) chatInput.value = '';
  if (chatQuick) chatQuick.style.display = 'none';
  appendChatMsg(msg, 'user');
  const typing = showChatTyping();

  let response = null, source = 'fallback';

  // Circuit breaker check
  if (!isGeminiCircuitOpen()) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(apiUrl('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: CHAT_SID }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('API error ' + res.status);
      const d = await res.json();
      response = d.response;
      source   = d.source || 'fallback';
      recordGeminiSuccess();
    } catch {
      recordGeminiFailure();
      response = null;
    }
  }

  // Always have a response
  if (!response) response = getAIResponse(msg);

  chatHistory.push({ role:'user', content:msg }, { role:'assistant', content:response });
  if (chatHistory.length > 10) chatHistory.splice(0, 2);

  const delay = Math.min(400 + response.length * 0.6, 2000);
  setTimeout(() => {
    typing?.remove();
    const el = appendChatMsg(response, 'ai');
    if (el) {
      const badge = document.createElement('div');
      badge.className = 'chat-source-badge';
      badge.textContent = source === 'gemini' ? '✦ Gemini AI' : '◈ Local AI';
      el.appendChild(badge);
    }
  }, delay);
}

function openChat() {
  if (!chatPanel) return;
  chatPanel.classList.add('open'); chatPanel.setAttribute('aria-hidden','false');
  chatFab?.setAttribute('aria-expanded','true');
  fabIconChat?.classList.add('hidden'); fabIconClose?.classList.remove('hidden');
  if (chatMsgs && chatMsgs.children.length === 0) {
    appendChatMsg("Hi! I'm Sabbir's AI assistant. Ask about his skills, projects, certifications, or how to contact him! 👋", 'ai');
  }
  setTimeout(() => chatInput?.focus(), 80);
}
function closeChat() {
  chatPanel?.classList.remove('open'); chatPanel?.setAttribute('aria-hidden','true');
  chatFab?.setAttribute('aria-expanded','false');
  fabIconChat?.classList.remove('hidden'); fabIconClose?.classList.add('hidden');
}

chatFab?.addEventListener('click', () => chatPanel?.classList.contains('open') ? closeChat() : openChat());
chatClose?.addEventListener('click', closeChat);
chatSend?.addEventListener('click', () => sendChat(chatInput?.value || ''));
chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(chatInput.value); });
$$('.quick-chip').forEach(b => b.addEventListener('click', () => sendChat(b.textContent.trim())));

/* ════════════════ HELP PANEL ════════════════ */
const helpOverlay = $('#help-overlay');
const helpBtn     = $('#help-btn');
const helpClose   = $('#help-close');
const openHelp  = () => { helpOverlay?.classList.add('open'); helpOverlay?.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
const closeHelp = () => { helpOverlay?.classList.remove('open'); helpOverlay?.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
helpBtn?.addEventListener('click', openHelp);
helpClose?.addEventListener('click', closeHelp);
helpOverlay?.addEventListener('click', e => { if (e.target === helpOverlay) closeHelp(); });

/* ════════════════ KEYBOARD SHORTCUTS ════════════════ */
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName?.toLowerCase() || '';
  // Fix: don't trigger shortcuts when user is typing in inputs
  const inInput = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
  if (e.key === 'Escape') {
    if (matrixStop) { matrixStop(); return; }
    closeTerm(); closeHelp(); closeChat(); closeMobile(); return;
  }
  if (inInput) return;
  switch (e.key) {
    case 't': case 'T': themeToggle?.click(); break;
    case 'h': case 'H': openHelp(); break;
    case 'g': case 'G': smoothScrollTo(document.getElementById('home')); break;
    case '/': e.preventDefault(); openTerm(); break;
    case 'c': case 'C': openChat(); break;
  }
});

/* ════════════════ SHARE BUTTONS ════════════════ */
const shareToast = $('#share-toast');
$$('.share-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = `Check out "${btn.dataset.project}" by Sabbir Hossain Rafat — ${btn.dataset.desc} ${window.location.origin}${window.location.pathname}#projects`;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .catch(() => { const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); })
      .finally(() => {
        if (!shareToast) return;
        shareToast.classList.add('show'); shareToast.setAttribute('aria-hidden','false');
        setTimeout(() => { shareToast.classList.remove('show'); shareToast.setAttribute('aria-hidden','true'); }, 2800);
      });
  });
});

/* ════════════════ SERVICE WORKER ════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Failed:', err));
  });
}

console.log('%c Sabbir Hossain Rafat · Portfolio v3.1 ', 'background:linear-gradient(135deg,#667eea,#22d3ee);color:#fff;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:800;');