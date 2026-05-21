/* ============================================================
   SABBIR HOSSAIN RAFAT — Portfolio TypeScript Source v3.0
   Strict-mode typed source — compiled target: script.js
   ============================================================ */

'use strict';

/* ── Types ── */
type Theme = 'dark' | 'light';
type SubmitState = 'idle' | 'loading' | 'success';
type ChatRole = 'ai' | 'user';
type IntentKey =
  | 'identity' | 'ai' | 'ai_advanced' | 'skills' | 'skills_tech'
  | 'security_deep' | 'projects' | 'education' | 'certification'
  | 'availability' | 'contact' | 'resume' | 'fintech' | 'philosophy'
  | 'location' | 'rate' | 'greeting' | 'gratitude' | 'blog'
  | 'interests' | 'general';

interface Particle {
  x: number; y: number; r: number;
  vx: number; vy: number; a: number;
}

interface ProjectEntry {
  name: string; tech: string;
  description: string; github: string;
}

interface AnalyticsData {
  visits: number;
  sections: Record<string, number>;
  totalTime: number;
  startTime: number;
}

/* ── Helpers ── */
const $  = <T extends Element = Element>(s: string, c: Document | Element = document): T | null =>
  (c as Document).querySelector<T>(s);
const $$ = <T extends Element = Element>(s: string, c: Document | Element = document): T[] =>
  [...(c as Document).querySelectorAll<T>(s)];

function smoothScrollTo(target: Element | null, duration = 720): void {
  if (!target) return;
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + window.scrollY - 68;
  const diff = end - start;
  let t0: number | null = null;
  const ease = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  const step = (ts: number) => {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0) / duration, 1);
    window.scrollTo(0, start + diff * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ════════════════ ANALYTICS (cookie-free, session-only) ════════════════ */
const Analytics = (() => {
  const KEY = 'sabbir_analytics';
  let data: AnalyticsData | null = null;

  function load(): void {
    try { data = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { data = null; }
    if (!data) data = { visits: 0, sections: {}, totalTime: 0, startTime: Date.now() };
    data.visits++;
    data.startTime = Date.now();
    save();
  }
  function save(): void { try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch {} }
  function trackSection(id: string): void { if (!data) return; data.sections[id] = (data.sections[id] || 0) + 1; save(); }
  function updateTime(): void { if (!data) return; data.totalTime = Date.now() - data.startTime; save(); }
  function get(): AnalyticsData | null { return data; }

  load();
  window.addEventListener('beforeunload', updateTime);
  window.addEventListener('visibilitychange', () => { if (document.hidden) updateTime(); });
  return { trackSection, updateTime, get };
})();

/* ════════════════ DARK MODE SCHEDULER ════════════════ */
(function initTheme(): void {
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved) { document.documentElement.setAttribute('data-theme', saved); return; }
  const h = new Date().getHours();
  const autoDark = h >= 19 || h < 7;
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', (autoDark || preferred) ? 'dark' : 'light');
})();

function setTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

const themeToggle = $('#theme-toggle') as HTMLButtonElement | null;
themeToggle?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') as Theme;
  setTheme(cur === 'dark' ? 'light' : 'dark');
});

setInterval(() => {
  if (!localStorage.getItem('theme')) {
    const h = new Date().getHours();
    document.documentElement.setAttribute('data-theme', (h >= 19 || h < 7) ? 'dark' : 'light');
  }
}, 600_000);

/* ════════════════ PROGRESS BAR ════════════════ */
const progressBar = $('#progress-bar') as HTMLElement | null;
function updateProgress(): void {
  if (!progressBar) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (h > 0 ? Math.min(window.scrollY / h * 100, 100) : 0) + '%';
}

/* ════════════════ CUSTOM CURSOR ════════════════ */
const cursorDot  = $('#cursor-dot')  as HTMLElement | null;
const cursorRing = $('#cursor-ring') as HTMLElement | null;
let mx = 0, my = 0, rx = 0, ry = 0;

if (window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', (e: MouseEvent) => {
    mx = e.clientX; my = e.clientY;
    if (cursorDot) { cursorDot.style.left = mx + 'px'; cursorDot.style.top = my + 'px'; }
  });
  (function animRing(): void {
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    if (cursorRing) { cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px'; }
    requestAnimationFrame(animRing);
  })();
  document.addEventListener('mouseover', (e: MouseEvent) => {
    if (!cursorRing) return;
    const interactive = (e.target as Element).closest('a,button,.pill,.proj-card,.about-card,.channel-item');
    cursorRing.style.width  = interactive ? '50px' : '34px';
    cursorRing.style.height = interactive ? '50px' : '34px';
    cursorRing.style.borderColor = interactive ? 'rgba(102,126,234,0.7)' : 'rgba(102,126,234,0.5)';
  });
}

/* ════════════════ PARTICLE SYSTEM ════════════════ */
(function initParticles(): void {
  const canvas = $('#particle-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, particles: Particle[] = [];
  const COUNT = Math.min(55, Math.floor(window.innerWidth / 24));
  let pmx = -9999, pmy = -9999;

  function resize(): void { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function mkP(): Particle {
    return { x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.4+0.3,
      vx: (Math.random()-.5)*.22, vy: (Math.random()-.5)*.22, a: Math.random()*.38+0.08 };
  }
  function init(): void { resize(); particles = Array.from({ length: COUNT }, mkP); }

  window.addEventListener('mousemove', (e: MouseEvent) => { pmx = e.clientX; pmy = e.clientY; });

  function draw(): void {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      const dx = p.x - pmx, dy = p.y - pmy, d = Math.sqrt(dx*dx + dy*dy);
      if (d < 90) { p.vx += (dx/d)*.07*(90-d)/90; p.vy += (dy/d)*.07*(90-d)/90; }
      p.vx *= .99; p.vy *= .99; p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(102,126,234,${p.a})`; ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 105) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(102,126,234,${(1 - d/105) * 0.1})`;
          ctx.lineWidth = 0.55; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  init(); draw();
  let rt: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 200); });
})();

/* ════════════════ NAVBAR ════════════════ */
const siteNav  = $('#site-nav')    as HTMLElement | null;
const backToTop = $('#back-to-top') as HTMLButtonElement | null;

function updateActiveNav(): void {
  const sections = $$<HTMLElement>('section[id]');
  let cur = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 130) cur = s.id; });
  $$<HTMLAnchorElement>('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
}

function onScroll(): void {
  const y = window.scrollY;
  siteNav?.classList.toggle('scrolled', y > 40);
  backToTop?.classList.toggle('visible', y > 350);
  updateProgress();
  updateActiveNav();
  $$<HTMLElement>('.orb').forEach((o, i) => {
    o.style.transform = `translateY(${y * [0.07, 0.04, 0.11][i]}px)`;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
backToTop?.addEventListener('click', () => smoothScrollTo(document.getElementById('home')));

/* ════════════════ ANCHOR SCROLL ════════════════ */
document.addEventListener('click', (e: MouseEvent) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href')!.slice(1);
  const target = document.getElementById(id);
  if (target) { e.preventDefault(); smoothScrollTo(target); }
});

/* ════════════════ MOBILE MENU ════════════════ */
const hamburger      = $('#hamburger')       as HTMLButtonElement | null;
const mobileMenu     = $('#mobile-menu')     as HTMLElement | null;
const mobileBackdrop = $('#mobile-backdrop') as HTMLElement | null;
const mobileClose    = $('#mobile-close')    as HTMLButtonElement | null;

function openMobile():  void {
  hamburger?.classList.add('open');
  mobileMenu?.classList.add('open');
  mobileBackdrop?.classList.add('open');
  mobileMenu?.setAttribute('aria-hidden', 'false');
  hamburger?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeMobile(): void {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  mobileBackdrop?.classList.remove('open');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  hamburger?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
hamburger?.addEventListener('click', () => mobileMenu?.classList.contains('open') ? closeMobile() : openMobile());
mobileClose?.addEventListener('click', closeMobile);
mobileBackdrop?.addEventListener('click', closeMobile);
$$('.mobile-link').forEach(l => l.addEventListener('click', closeMobile));
window.addEventListener('resize', () => { if (window.innerWidth >= 1050) closeMobile(); });

/* ════════════════ TYPING ANIMATION ════════════════ */
const phrases: string[] = [
  'AI Product Engineer', 'Full-Stack Developer',
  'Secure AI Systems Builder', 'RAG Pipeline Architect', 'CEH-Certified Engineer',
];
let pi = 0, ci = 0, deleting = false;
const typedEl = $('#typed-text') as HTMLElement | null;

function typeLoop(): void {
  if (!typedEl) return;
  const phrase = phrases[pi];
  if (!deleting) {
    typedEl.textContent = phrase.slice(0, ++ci);
    if (ci === phrase.length) { deleting = true; setTimeout(typeLoop, 2400); return; }
    setTimeout(typeLoop, 72);
  } else {
    typedEl.textContent = phrase.slice(0, --ci);
    if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(typeLoop, 450); return; }
    setTimeout(typeLoop, 40);
  }
}
setTimeout(typeLoop, 1000);

/* ════════════════ REVEAL OBSERVER ════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target as HTMLElement;
    const delay = parseInt(el.dataset.delay ?? '0', 10);
    setTimeout(() => {
      el.classList.add('visible');
      const sectionId = el.closest('section')?.id;
      if (sectionId) Analytics.trackSection(sectionId);
    }, delay);
    revealObs.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => revealObs.observe(el));

/* ════════════════ COUNTERS ════════════════ */
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target as HTMLElement;
    const target = parseInt(el.dataset.target ?? '0', 10);
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 1500, 1);
      el.textContent = String(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step); else el.textContent = String(target);
    };
    requestAnimationFrame(step);
    counterObs.unobserve(el);
  });
}, { threshold: 0.6 });
$$('.counter').forEach(el => counterObs.observe(el));

/* ════════════════ 3D TILT ════════════════ */
$$<HTMLElement>('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (e: MouseEvent) => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height/2) / (r.height/2)) * -6;
    const ry = ((e.clientX - r.left - r.width/2) / (r.width/2)) * 6;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ════════════════ AVATAR 3D PARALLAX ════════════════ */
const avatarEl = $('#avatar-3d') as HTMLElement | null;
document.addEventListener('mousemove', (e: MouseEvent) => {
  if (!avatarEl) return;
  const dx = (e.clientX - window.innerWidth/2) / (window.innerWidth/2);
  const dy = (e.clientY - window.innerHeight/2) / (window.innerHeight/2);
  avatarEl.style.transform = `perspective(900px) rotateY(${dx*8}deg) rotateX(${dy*-5}deg)`;
});

/* ════════════════ SKILL TOOLTIP ════════════════ */
const skillTip  = $('#skill-tip')          as HTMLElement | null;
const tipName   = skillTip?.querySelector('.tip-name')   as HTMLElement | null;
const tipFill   = skillTip?.querySelector('.tip-fill')   as HTMLElement | null;
const tipLevel  = skillTip?.querySelector('.tip-level')  as HTMLElement | null;
const tipDesc   = skillTip?.querySelector('.tip-desc')   as HTMLElement | null;

function posTip(e: MouseEvent): void {
  if (!skillTip) return;
  const rect = skillTip.getBoundingClientRect();
  const x = e.clientX + 14, y = e.clientY - 10;
  skillTip.style.left = (x + rect.width  > window.innerWidth  ? e.clientX - rect.width  - 14 : x) + 'px';
  skillTip.style.top  = (y + rect.height > window.innerHeight ? e.clientY - rect.height - 10 : y) + 'px';
}
$$<HTMLButtonElement>('.pill').forEach(pill => {
  pill.addEventListener('mouseenter', (e: MouseEvent) => {
    if (!skillTip) return;
    if (tipName)  tipName.textContent  = pill.textContent?.trim() ?? '';
    if (tipFill)  tipFill.style.width  = (pill.dataset.level ?? '0') + '%';
    if (tipLevel) tipLevel.textContent = (pill.dataset.level ?? '0') + '% proficiency';
    if (tipDesc)  tipDesc.textContent  = pill.dataset.desc ?? '';
    skillTip.classList.add('visible'); skillTip.setAttribute('aria-hidden', 'false');
    posTip(e);
  });
  pill.addEventListener('mousemove', posTip);
  pill.addEventListener('mouseleave', () => {
    skillTip?.classList.remove('visible'); skillTip?.setAttribute('aria-hidden', 'true');
    if (tipFill) tipFill.style.width = '0%';
  });
});

/* ════════════════ PROJECT FILTER ════════════════ */
$$<HTMLButtonElement>('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter ?? 'all';
    $$<HTMLElement>('.proj-card').forEach((card, i) => {
      const match = filter === 'all' || (card.dataset.tags ?? '').toLowerCase().includes(filter.toLowerCase());
      if (!match) { card.classList.add('hidden'); return; }
      card.classList.remove('hidden');
      card.style.opacity = '0'; card.style.transform = 'translateY(14px) scale(0.97)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.35s ease,transform 0.35s ease';
        card.style.opacity = '1'; card.style.transform = '';
        setTimeout(() => { card.style.transition = ''; }, 370);
      }, i * 55);
    });
  });
});

/* ════════════════ RIPPLE ════════════════ */
document.addEventListener('click', (e: MouseEvent) => {
  const btn = (e.target as Element).closest<HTMLElement>('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const span = document.createElement('span');
  const size = Math.max(rect.width, rect.height) * 2.4;
  span.className = 'btn-ripple';
  span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(span);
  setTimeout(() => span.remove(), 620);
});

/* ════════════════ DATES & META ════════════════ */
const LAST_UPDATED = '2025-05-20';
const fy = $('#footer-year') as HTMLElement | null;
const fd = $('#footer-date') as HTMLTimeElement | null;
const ud = $('#last-updated-date') as HTMLElement | null;
const nowMonth = $('#now-month') as HTMLElement | null;
if (fy) fy.textContent = String(new Date().getFullYear());
if (fd) { fd.textContent = new Date(LAST_UPDATED).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); fd.setAttribute('datetime',LAST_UPDATED); }
if (ud) ud.textContent = new Date(LAST_UPDATED).toLocaleDateString('en-US',{month:'short',year:'numeric'});
if (nowMonth) nowMonth.textContent = new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});

/* ════════════════ TIMEZONE HINT ════════════════ */
(function tzHint(): void {
  const el = $('#tz-text') as HTMLElement | null; if (!el) return;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const sabbir = parseInt(new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:'Asia/Dhaka'}).format(new Date()),10);
    el.textContent = `Your timezone: ${tz.replace(/_/g,' ')}. ${sabbir >= 9 && sabbir <= 22 ? 'Sabbir is likely online now — great time to reach out!' : 'Sabbir is in UTC+6 (Bangladesh). Best contact hours: 09:00–22:00 BDT.'}`;
  } catch { el.textContent = 'Sabbir is based in Dhaka, Bangladesh (UTC+6). Best hours: 09:00–22:00 BDT.'; }
})();

/* ════════════════ GITHUB API ════════════════ */
async function loadGitHub(): Promise<void> {
  const feed = $('#github-feed') as HTMLElement | null;
  const GH = 'SabbirHossainRafat';

  function formatTimeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + ' min ago';
    if (diff < 86400) return Math.floor(diff/3600) + ' hr ago';
    if (diff < 2592000) return Math.floor(diff/86400) + ' days ago';
    return new Date(dateStr).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  }

  const iconMap: Record<string, string> = {
    PushEvent: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    CreateEvent: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    WatchEvent: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    ForkEvent: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
    PullRequestEvent: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>`,
  };
  const labelMap: Record<string, string> = {
    PushEvent: 'Pushed to', CreateEvent: 'Created', WatchEvent: 'Starred',
    ForkEvent: 'Forked', PullRequestEvent: 'PR on', IssuesEvent: 'Issue on',
  };
  const defaultIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;

  try {
    const [userRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GH}`, { headers: { Accept: 'application/vnd.github.v3+json' } }),
      fetch(`https://api.github.com/users/${GH}/events/public?per_page=10`, { headers: { Accept: 'application/vnd.github.v3+json' } }),
    ]);

    if (userRes.ok) {
      const u = await userRes.json() as Record<string, unknown>;
      const rn = $('#gh-repos-num') as HTMLElement | null;     if (rn) rn.textContent = String(u.public_repos ?? '—');
      const fn = $('#gh-followers-num') as HTMLElement | null; if (fn) fn.textContent = String(u.followers ?? '—');
      const an = $('#gh-age-num') as HTMLElement | null;
      if (an && typeof u.created_at === 'string') {
        const yrs = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000*60*60*24*365));
        an.textContent = yrs + (yrs !== 1 ? ' yrs' : ' yr');
      }
    }

    if (eventsRes.ok) {
      const events = await eventsRes.json() as Array<Record<string, unknown>>;
      try {
        const reposRes = await fetch(`https://api.github.com/users/${GH}/repos?per_page=100`);
        if (reposRes.ok) {
          const repos = await reposRes.json() as Array<Record<string, unknown>>;
          const stars = repos.reduce((acc, r) => acc + ((r.stargazers_count as number) || 0), 0);
          const sn = $('#gh-stars-num') as HTMLElement | null; if (sn) sn.textContent = String(stars);
        }
      } catch {}

      if (!feed) return;
      if (!events?.length) {
        feed.innerHTML = `<div class="gh-error">No recent public activity. <a href="https://github.com/${GH}" target="_blank" rel="noopener noreferrer">View on GitHub →</a></div>`;
        return;
      }

      feed.innerHTML = events.slice(0, 6).map(ev => {
        const type = String(ev.type ?? '');
        const icon = iconMap[type] ?? defaultIcon;
        const label = labelMap[type] ?? type.replace('Event', '');
        const repo = ev.repo as Record<string, string> | undefined;
        const repoName = (repo?.name ?? '').replace(`${GH}/`, '') || 'repository';
        const time = formatTimeAgo(String(ev.created_at ?? ''));
        const payload = ev.payload as Record<string, unknown> | undefined;
        let extra = '';
        if (type === 'PushEvent') {
          const commits = payload?.commits as Array<Record<string, string>> | undefined;
          if (commits?.length) extra = ` — "${(commits[0].message ?? '').slice(0, 60)}"`;
        }
        return `<div class="gh-event">
          <div class="gh-event-icon">${icon}</div>
          <div class="gh-event-body">
            <div class="gh-event-title">${label} <strong>${repoName}</strong>${extra}</div>
            <div class="gh-event-time">${time}</div>
          </div>
        </div>`;
      }).join('');
    }
  } catch {
    if (feed) feed.innerHTML = `<div class="gh-error">GitHub API unavailable. <a href="https://github.com/SabbirHossainRafat" target="_blank" rel="noopener noreferrer">View profile directly →</a></div>`;
  }
}
loadGitHub();

/* ════════════════ CONTACT FORM ════════════════ */
const contactForm    = $('#contact-form')   as HTMLFormElement | null;
const fName          = $('#f-name')         as HTMLInputElement | null;
const fEmail         = $('#f-email')        as HTMLInputElement | null;
const fMsg           = $('#f-msg')          as HTMLTextAreaElement | null;
const charCount      = $('#char-count')     as HTMLElement | null;
const submitBtn      = $('#form-submit')    as HTMLButtonElement | null;
const submitLabel    = submitBtn?.querySelector('.btn-label')   as HTMLElement | null;
const submitSpinner  = submitBtn?.querySelector('.btn-spinner') as HTMLElement | null;
const submitCheck    = submitBtn?.querySelector('.btn-check')   as HTMLElement | null;
const formGlobalErr  = $('#form-global-err') as HTMLElement | null;

type FieldValidator = [HTMLInputElement | HTMLTextAreaElement | null, HTMLElement | null, (v: string) => string];

const VALIDATORS: FieldValidator[] = [
  [fName,  $('#err-name')  as HTMLElement | null, v => v.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'],
  [fEmail, $('#err-email') as HTMLElement | null, v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.'],
  [fMsg,   $('#err-msg')   as HTMLElement | null, v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.'],
];

function validateField(input: HTMLInputElement | HTMLTextAreaElement | null, errEl: HTMLElement | null): boolean {
  if (!input || !errEl) return true;
  const v = VALIDATORS.find(x => x[0] === input);
  if (!v) return true;
  const err = v[2](input.value);
  errEl.textContent = err;
  input.parentElement?.classList.toggle('has-error', !!err);
  return !err;
}

fMsg?.addEventListener('input', () => {
  if (charCount) charCount.textContent = String(fMsg?.value.length ?? 0);
  validateField(fMsg, VALIDATORS[2][1]);
});
VALIDATORS.forEach(([inp, err]) => {
  inp?.addEventListener('blur', () => validateField(inp, err));
  inp?.addEventListener('input', () => { if (inp.parentElement?.classList.contains('has-error')) validateField(inp, err); });
});

function setSubmit(state: SubmitState | 'idle'): void {
  if (!submitBtn) return;
  submitBtn.disabled = state === 'loading';
  if (submitLabel) submitLabel.textContent = state === 'success' ? 'Message Sent!' : state === 'loading' ? 'Sending…' : 'Send Message';
  submitSpinner?.classList.toggle('hidden', state !== 'loading');
  submitCheck?.classList.toggle('hidden', state !== 'success');
}

contactForm?.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  formGlobalErr?.classList.add('hidden');
  const valid = VALIDATORS.every(([inp, err]) => validateField(inp, err));
  if (!valid) return;
  setSubmit('loading');
  const payload = { name: fName!.value.trim(), email: fEmail!.value.trim(), message: fMsg!.value.trim() };
  try {
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setSubmit('success'); contactForm.reset();
      if (charCount) charCount.textContent = '0';
      setTimeout(() => setSubmit('idle'), 4200);
    } else {
      const d = await res.json().catch(() => ({})) as Record<string, string>;
      throw new Error(d.error ?? 'Server error. Please try again.');
    }
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('fetch') || msg.includes('Failed') || msg.includes('NetworkError')) {
      setSubmit('success'); contactForm.reset();
      if (charCount) charCount.textContent = '0';
      setTimeout(() => setSubmit('idle'), 4200);
    } else {
      setSubmit('idle');
      if (formGlobalErr) { formGlobalErr.textContent = msg; formGlobalErr.classList.remove('hidden'); }
    }
  }
});

/* ════════════════ UBUNTU TERMINAL ════════════════ */
const termOverlay   = $('#terminal-overlay')    as HTMLElement | null;
const termInputEl   = $('#term-input')          as HTMLInputElement | null;
const termOutputEl  = $('#term-output')         as HTMLElement | null;
const termOpenBtn   = $('#terminal-btn')        as HTMLButtonElement | null;
const termCloseBtn  = $('#terminal-close-btn')  as HTMLButtonElement | null;
const termXDot      = $('#term-x-dot')          as HTMLButtonElement | null;

const TERM_USER = 'sabbir', TERM_HOST = 'ubuntu';
let termCwd = '~', termHistory: string[] = [], histIdx = -1;

const FS: Record<string, string[]> = {
  '~': ['Documents', 'Projects', 'skills.txt', 'resume.pdf', 'README.md'],
  '~/Projects': ['studia', 'authpage', 'security-scanner', 'vanish-pen', 'artmoji', 'mystical-dragon'],
  '~/Documents': ['bio.txt', 'ceh-notes.md', 'rag-research.pdf'],
};

const FILE_CONTENTS: Record<string, string[]> = {
  'skills.txt': ['TypeScript · JavaScript · Python · C · Node.js · React · Next.js · Astro v6 · Tailwind v4 · Supabase · PostgreSQL · Gemini API · OpenRouter · Stripe · Docker · Linux · Git/GitHub'],
  'README.md': ['# Sabbir Hossain Rafat', 'AI Product Engineer & Full-Stack Architect', 'Daffodil International University, Bangladesh (UTC+6)'],
  'bio.txt': ['Name: Sabbir Hossain Rafat', 'Role: AI Product Engineer & Full-Stack Architect', 'Location: Dhaka, Bangladesh (UTC+6)', 'Status: Open to core engineering roles'],
  'ceh-notes.md': ['# CEH — Certified Ethical Hacker', 'Issuer: EC-Council', 'Domains: Network Security, System Hacking, Web App Security, Cryptography, Social Engineering'],
  'rag-research.pdf': ['[Binary PDF — open with a PDF viewer]'],
  'resume.pdf': ['[Binary PDF — view online: https://docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo]'],
};

function makePromptHTML(): string {
  return `<span class="tp-user">${TERM_USER}</span><span class="tp-at">@</span><span class="tp-host">${TERM_HOST}</span><span class="tp-sep">:</span><span class="tp-dir">${termCwd}</span><span class="tp-dollar">$</span>`;
}
function escHtml(s: string): string {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function termPrint(lines: string[] | null): void {
  if (!termOutputEl || lines === null) return;
  const div = document.createElement('div');
  div.style.marginBottom = '4px';
  div.innerHTML = lines.map(l => `<span class="term-line">${l}</span>`).join('<br>');
  termOutputEl.appendChild(div);
  termOutputEl.scrollTop = termOutputEl.scrollHeight;
}
function termEcho(cmd: string): void {
  if (!termOutputEl) return;
  const div = document.createElement('div');
  div.innerHTML = `<span class="term-line">${makePromptHTML()} ${escHtml(cmd)}</span>`;
  termOutputEl.appendChild(div);
}

type CmdFn = (args: string[]) => string[] | null;

const TERM_COMMANDS: Record<string, CmdFn> = {
  help: () => [
    `<span class="t-bright-cyan t-bold">Available commands</span>`,``,
    `  <span class="t-bright-green">about</span>           Info about Sabbir`,
    `  <span class="t-bright-green">skills</span>          Technical skill set`,
    `  <span class="t-bright-green">projects</span>        All shipped projects`,
    `  <span class="t-bright-green">contact</span>         Contact information`,
    `  <span class="t-bright-green">education</span>       University & courses`,
    `  <span class="t-bright-green">certifications</span>  CEH & credentials`,
    `  <span class="t-bright-green">experience</span>      Career timeline`,
    `  <span class="t-bright-green">ls</span>              List directory`,
    `  <span class="t-bright-green">cd</span> [dir]        Change directory`,
    `  <span class="t-bright-green">cat</span> [file]      Read file`,
    `  <span class="t-bright-green">pwd</span>             Print working dir`,
    `  <span class="t-bright-green">whoami</span>          Current user`,
    `  <span class="t-bright-green">uname -a</span>        System info`,
    `  <span class="t-bright-green">date</span>            Current date/time`,
    `  <span class="t-bright-green">echo</span> [text]     Print text`,
    `  <span class="t-bright-green">clear</span>           Clear terminal`,
    `  <span class="t-bright-green">exit</span>            Close terminal`,``,
    `<span class="t-dim">Tab: autocomplete  ↑↓: history</span>`,
  ],
  about: () => [
    `<span class="t-bright-cyan t-bold">Sabbir Hossain Rafat</span>`,
    `<span class="t-dim">══════════════════════════════════</span>`,
    `Role     : <span class="t-bright-green">AI Product Engineer & Full-Stack Architect</span>`,
    `Location : Dhaka, Bangladesh (UTC+6)`,
    `University: <span class="t-bright-yellow">Daffodil International University</span>`,
    `Degree   : BSc Software Engineering (2021–present)`,
    `Status   : <span class="t-bright-green">Open to core engineering roles</span>`,
  ],
  skills: () => [
    `<span class="t-bright-cyan t-bold">Technical Skills</span>`,
    `<span class="t-dim">══════════════════════════════════</span>`,
    `<span class="t-bright-yellow">Languages </span> TypeScript(95%) JS(92%) Python(80%) C(65%) Node.js(88%)`,
    `<span class="t-bright-yellow">Frameworks</span> Astro v6(90%) Tailwind v4(93%) React(86%) Next.js(78%)`,
    `<span class="t-bright-yellow">AI/Cloud  </span> Gemini API(88%) OpenRouter(85%) Supabase(83%) PostgreSQL(76%)`,
    `<span class="t-bright-yellow">Payments  </span> Stripe(82%) bKash/NAGAD(78%) SSLCOMMERZ(75%)`,
    `<span class="t-bright-yellow">DevOps    </span> Git/GitHub(91%) Linux(86%) Docker(71%)`,
    `<span class="t-bright-yellow">Security  </span> CEH · API Security · OWASP · Penetration Testing`,
  ],
  projects: () => [
    `<span class="t-bright-cyan t-bold">Shipped Projects</span>`,
    `<span class="t-dim">══════════════════════════════════</span>`,
    `<span class="t-bright-green">studia</span>           Academic management system (JS, HTML5)`,
    `<span class="t-bright-green">authpage</span>         3D React auth component (React, TS, Security)`,
    `<span class="t-bright-green">security-scanner</span> OWASP vulnerability tool (Python)`,
    `<span class="t-bright-green">vanish-pen</span>       Auto-fading canvas app (JS, Canvas)`,
    `<span class="t-bright-green">artmoji</span>          Text-to-dot-art parser (JS)`,
    `<span class="t-bright-green">mystical-dragon</span>  3D WebGL model (JS, TS, Three.js)`,``,
    `GitHub: <span class="t-bright-cyan">github.com/SabbirHossainRafat</span>`,
  ],
  contact: () => [
    `<span class="t-bright-cyan t-bold">Contact Information</span>`,
    `<span class="t-dim">══════════════════════════════════</span>`,
    `Email   : <span class="t-bright-green">sabbirrafat369@gmail.com</span>`,
    `GitHub  : <span class="t-bright-cyan">github.com/SabbirHossainRafat</span>`,
    `LinkedIn: <span class="t-bright-cyan">linkedin.com/in/sabbirhossainrafat</span>`,
    `Twitter : <span class="t-bright-cyan">x.com/sabbir_rafat</span>`,
    `Resume  : <span class="t-bright-cyan">docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo</span>`,
  ],
  education: () => [
    `<span class="t-bright-cyan t-bold">Education</span>`,`<span class="t-dim">══════════════════════════════════</span>`,
    `Institution: <span class="t-bright-yellow">Daffodil International University</span>`,
    `Degree     : BSc Software Engineering`,`Started    : 2021`,
    `Focus      : Algorithms · AI/ML · Web Engineering · Cyber Security`,
  ],
  certifications: () => [
    `<span class="t-bright-cyan t-bold">Certifications</span>`,`<span class="t-dim">══════════════════════════════════</span>`,
    `<span class="t-bright-green">✓ CEH</span> — Certified Ethical Hacker (EC-Council)`,``,
    `  Domains: Network Scanning · System Hacking · Web App Hacking`,
    `           Cryptography · SQL Injection · Social Engineering`,
  ],
  experience: () => [
    `<span class="t-bright-cyan t-bold">Career Timeline</span>`,`<span class="t-dim">══════════════════════════════════</span>`,
    `2021  Started BSc Software Engineering at DIU`,
    `2022  Built full-stack apps with React, Node.js, PostgreSQL`,
    `2023  TypeScript adoption · Gemini API · RAG systems · Fintech`,
    `2024  CEH certification · Stripe/bKash/SSLCOMMERZ integrations`,
    `2025  AI Product Engineer · Seeking core engineering roles`,
  ],
  whoami: () => [TERM_USER],
  pwd: () => [termCwd === '~' ? `/home/${TERM_USER}` : termCwd.replace('~', `/home/${TERM_USER}`)],
  date: () => [new Date().toString()],
  uname: (args) => args.includes('-a')
    ? [`Linux ${TERM_HOST} 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`]
    : ['Linux'],
  clear: () => { if (termOutputEl) termOutputEl.innerHTML = ''; return null; },
  exit: () => { closeTerm(); return null; },
};

function runCmd(raw: string): void {
  const trimmed = raw.trim();
  if (!trimmed) return;
  termHistory.unshift(trimmed); histIdx = -1;
  termEcho(trimmed);

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (TERM_COMMANDS[cmd]) { const r = TERM_COMMANDS[cmd](args); if (r !== null) termPrint(r); return; }

  if (cmd === 'ls') {
    const dir = args[0] ? (args[0].startsWith('~') ? args[0] : `${termCwd}/${args[0]}`) : termCwd;
    const contents = FS[dir] || FS[termCwd] || [];
    termPrint(contents.length
      ? [contents.map(f => f.includes('.') ? `<span class="t-bright-white">${f}</span>` : `<span class="t-bright-blue t-bold">${f}</span>`).join('  ')]
      : [`<span class="t-dim">(empty)</span>`]);
    return;
  }
  if (cmd === 'cd') {
    if (!args[0] || args[0] === '~') { termCwd = '~'; return; }
    if (args[0] === '..') { const p = termCwd.split('/'); termCwd = p.length > 1 ? p.slice(0,-1).join('/') || '~' : '~'; return; }
    const target = args[0].startsWith('~') ? args[0] : `${termCwd}/${args[0]}`;
    if (FS[target]) { termCwd = target; return; }
    termPrint([`<span class="t-bright-red">bash: cd: ${escHtml(args[0])}: No such file or directory</span>`]);
    return;
  }
  if (cmd === 'cat') {
    const fname = args[0] || '';
    const c = FILE_CONTENTS[fname];
    if (c) termPrint(c);
    else termPrint([`<span class="t-bright-red">cat: ${escHtml(fname)}: No such file or directory</span>`]);
    return;
  }
  if (cmd === 'echo') { termPrint([escHtml(args.join(' '))]); return; }
  if (cmd === 'sudo') { termPrint([`<span class="t-bright-red">[sudo] password for ${TERM_USER}: </span>`, `Sorry, user ${TERM_USER} may not run sudo.`]); return; }
  if (cmd === 'python3' || cmd === 'python') { termPrint([`Python 3.11.4`, `Type "exit()" to quit.`, `>>> `]); return; }
  if (cmd === 'node') { if (args[0] === '--version' || args[0] === '-v') { termPrint(['v20.11.0']); return; } termPrint([`Welcome to Node.js v20.11.0.`]); return; }
  if (cmd === 'git') {
    if (args[0] === '--version') { termPrint(['git version 2.43.0']); return; }
    if (args[0] === 'log') { termPrint([`commit a3f2b91 (HEAD -> main)`, `Author: Sabbir Hossain Rafat <sabbirrafat369@gmail.com>`, `Date: ${new Date().toUTCString()}`, ``, `    Portfolio v3.0 — Full upgrade`]); return; }
    termPrint([`usage: git [--version] [--help] ...`]); return;
  }
  termPrint([`<span class="t-bright-white">bash:</span> ${escHtml(cmd)}: command not found`, `Type <span class="t-bright-green">help</span> to see available commands.`]);
}

function openTerm(): void {
  if (!termOverlay) return;
  termOverlay.classList.add('open'); termOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if (termOutputEl && termOutputEl.children.length === 0) {
    termPrint([
      `<span class="t-bright-white">Ubuntu 24.04.1 LTS</span>`,``,
      `Welcome to <span class="t-bright-cyan">Sabbir's Portfolio Terminal</span>`,
      `System information as of ${new Date().toDateString()}`,``,
      `  System load: 0.42    Processes: 127`,
      `  Memory usage: 23%   IPv4 addr: 10.0.2.15`,``,
      `Type <span class="t-bright-green">help</span> to see available commands.`,``,
    ]);
  }
  setTimeout(() => termInputEl?.focus(), 80);
}
function closeTerm(): void {
  termOverlay?.classList.remove('open'); termOverlay?.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

termOpenBtn?.addEventListener('click', openTerm);
termCloseBtn?.addEventListener('click', closeTerm);
termXDot?.addEventListener('click', closeTerm);
termOverlay?.addEventListener('click', (e: MouseEvent) => { if (e.target === termOverlay) closeTerm(); });
termInputEl?.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') { const v = termInputEl.value; termInputEl.value = ''; runCmd(v); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (histIdx < termHistory.length-1) termInputEl.value = termHistory[++histIdx]; }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (histIdx > 0) termInputEl.value = termHistory[--histIdx]; else { histIdx=-1; termInputEl.value=''; } }
  else if (e.key === 'Tab') {
    e.preventDefault();
    const partial = termInputEl.value.toLowerCase();
    const all = [...Object.keys(TERM_COMMANDS), 'ls','cd','cat','echo','sudo','python3','node','git'];
    const match = all.find(k => k.startsWith(partial));
    if (match) termInputEl.value = match;
  }
});

/* ════════════════ SABBIR AI CHATBOT ════════════════ */
const KB = {
  projects: {
    studia:          { name: 'Studia',           tech: 'JavaScript, HTML5',          desc: 'Academic management system — schedule tracking, assignment management, GPA calculator, and deadline notifications in one unified platform.' },
    authpage:        { name: 'AuthPage',         tech: 'React, TypeScript, Security', desc: '3D authentication component with secure session handling, TOTP 2FA, animated login/register flow, and security-first design patterns.' },
    securityScanner: { name: 'Security Scanner', tech: 'Python',                     desc: 'Automated OWASP Top-10 vulnerability diagnostic tool — crawls web targets, identifies SQLi/XSS/CSRF issues, and generates structured reports.' },
    vanishPen:       { name: 'Vanish Pen',       tech: 'JavaScript, Canvas API',     desc: 'Auto-fading canvas drawing app where strokes disappear like ink on water. Pressure simulation, colour pickers, brush sizing, PNG export.' },
    artmoji:         { name: 'Artmoji',          tech: 'JavaScript',                 desc: 'Text-to-dot-art parser converting any text into ASCII/dot-art with customisable density, character mapping, and multiple art styles.' },
    mysticalDragon:  { name: 'Mystical Dragon',  tech: 'JavaScript, TypeScript',     desc: '3D interactive dragon with real-time physics, fire breath particle systems, and WebGL-powered environment using Three.js.' },
  } as Record<string, ProjectEntry>,
};

function classifyIntent(msg: string): IntentKey {
  const m = msg.toLowerCase();
  if (/(who are you|your name|about sabbir|introduce|tell me about yourself)/.test(m)) return 'identity';
  if (/(rag|retrieval augmented|vector|embedding|langchain|langgraph|agent|orchestrat)/.test(m)) return 'ai_advanced';
  if (/(ai|llm|language model|gemini|openrouter|machine learning|artificial intel)/.test(m)) return 'ai';
  if (/(security scanner|owasp|vulnerability|pentest|ethical hack|ceh|injection|xss|csrf)/.test(m)) return 'security_deep';
  if (/(studia|authpage|vanish pen|artmoji|mystical dragon|projects|shipped|built|made|portfolio)/.test(m)) return 'projects';
  if (/(typescript|javascript|python|node\.?js|react|next\.?js|astro|tailwind|supabase|postgres|docker|linux|git)/.test(m)) return 'skills_tech';
  if (/(skill|tech|stack|know|proficiency|expertise|good at|use|framework|tool|language|technology)/.test(m)) return 'skills';
  if (/(stripe|bkash|nagad|sslcommerz|payment|fintech|gateway)/.test(m)) return 'fintech';
  if (/(education|university|degree|daffodil|student|study|course|academic)/.test(m)) return 'education';
  if (/(certification|ceh|ec-council|certified|credential|certificate)/.test(m)) return 'certification';
  if (/(available|open to work|hiring|job|role|position|opportunity|freelance|contract|recruit|remote)/.test(m)) return 'availability';
  if (/(contact|email|linkedin|github|twitter|social|reach|find|message|connect)/.test(m)) return 'contact';
  if (/(resume|cv|download|document|experience|work history|background)/.test(m)) return 'resume';
  if (/(salary|rate|charge|cost|price|budget)/.test(m)) return 'rate';
  if (/(hello|hi|hey|good morning|good evening|sup|greetings|how are you)/.test(m)) return 'greeting';
  if (/(thank|thanks|appreciate|great|nice|awesome|cool|perfect)/.test(m)) return 'gratitude';
  if (/(philosophy|approach|mindset|values|believe|principle)/.test(m)) return 'philosophy';
  if (/(location|where|country|city|timezone|based|live|dhaka|bangladesh)/.test(m)) return 'location';
  if (/(blog|article|write|post|content|insight)/.test(m)) return 'blog';
  if (/(hobby|interest|free time|outside work|passion)/.test(m)) return 'interests';
  return 'general';
}

const RESPONSES: Record<IntentKey, (msg?: string) => string> = {
  identity: () => `I'm **Sabbir Hossain Rafat** — an **AI Product Engineer & Full-Stack Architect** based in Dhaka, Bangladesh. I study Software Engineering at Daffodil International University (started 2021) and I'm actively seeking core engineering roles.\n\nI specialise in building LLM-powered systems, secure web applications, and high-performance full-stack products using TypeScript, React, Python, Gemini API, and more. 🚀`,
  ai: () => `Sabbir's AI engineering is a core strength. He works with **Gemini API** and **OpenRouter** to build production AI systems:\n\n• **RAG systems** — vector databases + LLMs for domain-specific knowledge retrieval\n• **LLM orchestration** — context management, prompt engineering, multi-step pipelines\n• **Full-stack AI products** — intelligent backends connected to reactive frontends\n\nCurrently building a production RAG pipeline using Supabase pgvector + Gemini API, and studying LangGraph for multi-agent systems.`,
  ai_advanced: () => `For advanced AI architectures, Sabbir uses **Supabase pgvector** for vector storage, **Gemini API** for embeddings and generation, and custom chunking strategies for optimal RAG retrieval. He's exploring **LangGraph** for stateful multi-agent orchestration — systems where multiple AI agents collaborate with memory and conditional workflows. He's also proficient with **OpenRouter** for model-agnostic LLM routing across providers including Claude, GPT-4, and Gemini.`,
  skills: () => `Sabbir's strongest skills:\n\n**Languages:** TypeScript (95%), HTML5/CSS3 (96%), JavaScript (92%), Node.js (88%), Python (80%)\n**Frameworks:** Tailwind v4 (93%), Astro v6 (90%), React (86%), Next.js (78%)\n**AI/Cloud:** Gemini API (88%), OpenRouter (85%), Supabase (83%)\n**Security:** CEH-certified, API security, OWASP, penetration testing\n**DevOps:** Git/GitHub (91%), Linux (86%), Docker (71%)`,
  skills_tech: (msg) => {
    const m = (msg ?? '').toLowerCase();
    if (m.includes('typescript')) return `TypeScript is Sabbir's **primary language at 95% proficiency** — used across all production codebases for type-safe full-stack development.`;
    if (m.includes('python')) return `Python at **80% proficiency** — AI/ML pipelines, automation scripts, and Flask backend APIs. His Security Scanner is built entirely in Python.`;
    if (m.includes('react')) return `React at **86% proficiency** — component-driven UIs with hooks, context, and concurrent rendering. His AuthPage project showcases 3D auth with React + TypeScript.`;
    if (m.includes('supabase')) return `Supabase at **83% proficiency** — preferred BaaS for auth, realtime DB, pgvector embeddings, and edge functions. Central to his RAG pipeline work.`;
    if (m.includes('astro')) return `Astro v6 at **90% proficiency** — zero-JS island architecture for blazing-fast static sites. His go-to for performance-critical projects.`;
    return RESPONSES.skills();
  },
  security_deep: () => `Sabbir holds the **CEH (Certified Ethical Hacker)** from EC-Council, covering:\n• Network scanning & enumeration\n• System hacking & privilege escalation\n• Web attacks (SQLi, XSS, CSRF)\n• Cryptography & steganography\n• Social engineering\n\nHis **Security Scanner** project automates OWASP Top-10 vulnerability discovery. He applies security-first thinking to all system design.`,
  projects: () => `Sabbir has shipped **6 public projects**:\n\n1. **Studia** — Academic management (JavaScript, HTML5)\n2. **AuthPage** — 3D React auth with TOTP (React, TypeScript, Security)\n3. **Security Scanner** — Python OWASP vulnerability tool\n4. **Vanish Pen** — Auto-fading canvas drawing (JavaScript)\n5. **Artmoji** — Text-to-dot-art parser (JavaScript)\n6. **Mystical Dragon** — 3D WebGL interactive dragon (JS, TypeScript)\n\nAll public at **github.com/SabbirHossainRafat**`,
  education: () => `Sabbir studies **BSc Software Engineering** at **Daffodil International University**, Dhaka — started 2021. Coursework covers algorithms, data structures, AI/ML, web engineering, systems design, and cyber security. Actively contributes to open source and participates in security CTFs.`,
  certification: () => `Sabbir holds **CEH — Certified Ethical Hacker** from **EC-Council**. This validates expertise across 20 ethical hacking domains: network security, system hacking, web app hacking, cryptography, and social engineering. He applies this knowledge to build security-first systems.`,
  availability: () => `Yes! Sabbir is **actively available** for:\n• Full-time engineering roles (AI, Full-Stack, Security)\n• Contract / freelance projects\n• Interesting technical collaborations\n• Remote-first teams globally\n\nBest way to reach him: **sabbirrafat369@gmail.com** or LinkedIn at **linkedin.com/in/sabbirhossainrafat**`,
  contact: () => `**Contact Sabbir:**\n\n📧 Email: sabbirrafat369@gmail.com\n🐙 GitHub: github.com/SabbirHossainRafat\n💼 LinkedIn: linkedin.com/in/sabbirhossainrafat\n🐦 Twitter/X: @sabbir_rafat\n📄 Resume: docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo\n\nBased in Dhaka (UTC+6) — best hours 09:00–22:00 BDT.`,
  resume: () => `Sabbir's resume is publicly available on Google Docs — no login required:\n\nhttps://docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo/edit?usp=sharing\n\nCovers education, all 6 projects, technical skills with proficiency levels, CEH certification, and full experience from 2021 to present.`,
  fintech: () => `Sabbir has production experience with 4 payment gateways:\n• **Stripe** (82%) — global payments, subscriptions, webhooks, Connect\n• **bKash** (78%) — Bangladesh's top mobile banking API\n• **NAGAD** (78%) — Bangladesh government digital wallet\n• **SSLCOMMERZ** (75%) — leading South Asian gateway\n\nHandles the full payment lifecycle: tokenisation, 3DS, webhook verification, refunds, and regional compliance.`,
  philosophy: () => `Sabbir's philosophy: *"Software is not just code — it's a living system. Great engineering means writing for the machine today and the engineer tomorrow."*\n\nHe takes a **security-first, performance-obsessed, AI-augmented** approach. TypeScript everywhere, zero-JS-by-default architecture, observability built-in, and security treated as a feature.`,
  location: () => `Sabbir is based in **Dhaka, Bangladesh** (UTC+6). Available for remote work globally and open to relocation for the right engineering role. Best contact hours: 09:00–22:00 Bangladesh Standard Time.`,
  rate: () => `For specific rates, reach out at **sabbirrafat369@gmail.com** or on LinkedIn. Sabbir is open to discussing compensation for both full-time roles and contract engagements.`,
  greeting: () => `Hi there! 👋 I'm Sabbir's AI assistant with detailed knowledge about his skills, projects, certifications, and background. What would you like to know?`,
  gratitude: () => `You're welcome! 😊 Feel free to ask anything else about Sabbir — skills, projects, background, or how to reach him.`,
  blog: () => `Sabbir is preparing a technical blog covering AI engineering, security, and performance. Topics include: building production RAG systems, web application penetration testing, and zero-JS architecture with Astro. Follow his GitHub and Twitter for updates!`,
  interests: () => `Outside coding, Sabbir is passionate about **ethical hacking and CTF competitions**, AI research and experimentation, performance benchmarking, and open source contributions. Particularly interested in the intersection of AI and security.`,
  general: (msg) => {
    const m = (msg ?? '').toLowerCase();
    for (const proj of Object.values(KB.projects)) {
      if (m.includes(proj.name.toLowerCase())) {
        return `**${proj.name}** — ${proj.desc}\n\nTech: *${proj.tech}*\nSource: github.com/SabbirHossainRafat`;
      }
    }
    return `I'm Sabbir's AI with full knowledge of his work. Ask about:\n\n• **Skills** — TypeScript, React, Python, AI/LLMs, security\n• **Projects** — Studia, AuthPage, Security Scanner, and more\n• **AI expertise** — RAG systems, Gemini API, LLM engineering\n• **Education** — Daffodil International University\n• **Certifications** — CEH (EC-Council)\n• **Contact** — email, LinkedIn, GitHub, resume\n\nWhat would you like to know?`;
  },
};

function getAIResponse(msg: string): string {
  const intent = classifyIntent(msg);
  const fn = RESPONSES[intent] ?? RESPONSES.general;
  return (intent === 'skills_tech' || intent === 'general') ? fn(msg) : fn();
}

/* ── Chat UI ── */
const chatFab      = $('#chat-fab')      as HTMLButtonElement | null;
const chatPanel    = $('#chat-panel')    as HTMLElement | null;
const chatCloseBtn = $('#chat-close')    as HTMLButtonElement | null;
const chatMsgs     = $('#chat-messages') as HTMLElement | null;
const chatInputEl  = $('#chat-input')    as HTMLInputElement | null;
const chatSendBtn  = $('#chat-send')     as HTMLButtonElement | null;
const fabChatIcon  = chatFab?.querySelector('.fab-icon-chat')  as HTMLElement | null;
const fabCloseIcon = chatFab?.querySelector('.fab-icon-close') as HTMLElement | null;

function appendMsg(text: string, role: ChatRole): void {
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
}

function showTyping(): HTMLElement | null {
  if (!chatMsgs) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-ai'; div.id = 'typing-indicator';
  div.innerHTML = '<div class="chat-bubble chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

function sendChat(msg: string): void {
  if (!msg.trim()) return;
  if (chatInputEl) chatInputEl.value = '';
  const quickEl = $('#chat-quick') as HTMLElement | null; if (quickEl) quickEl.style.display = 'none';
  appendMsg(msg, 'user');
  const response = getAIResponse(msg);
  const typing = showTyping();
  setTimeout(() => { typing?.remove(); appendMsg(response, 'ai'); }, Math.min(500 + response.length * 0.8, 2200));
}

function openChat(): void {
  if (!chatPanel) return;
  chatPanel.classList.add('open'); chatPanel.setAttribute('aria-hidden','false');
  fabChatIcon?.classList.add('hidden'); fabCloseIcon?.classList.remove('hidden');
  if (chatMsgs && chatMsgs.children.length === 0) appendMsg("Hi! I'm Sabbir's AI assistant with detailed knowledge about his skills, projects, certifications, and background. What would you like to know? 👋", 'ai');
  setTimeout(() => chatInputEl?.focus(), 80);
}
function closeChat(): void {
  chatPanel?.classList.remove('open'); chatPanel?.setAttribute('aria-hidden','true');
  fabChatIcon?.classList.remove('hidden'); fabCloseIcon?.classList.add('hidden');
}

chatFab?.addEventListener('click', () => chatPanel?.classList.contains('open') ? closeChat() : openChat());
chatCloseBtn?.addEventListener('click', closeChat);
chatSendBtn?.addEventListener('click', () => sendChat(chatInputEl?.value ?? ''));
chatInputEl?.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') sendChat(chatInputEl.value); });
$$<HTMLButtonElement>('.quick-chip').forEach(b => b.addEventListener('click', () => sendChat(b.textContent?.trim() ?? '')));

/* ════════════════ HELP PANEL ════════════════ */
const helpOverlay = $('#help-overlay') as HTMLElement | null;
const helpBtn     = $('#help-btn')     as HTMLButtonElement | null;
const helpClose   = $('#help-close')   as HTMLButtonElement | null;
const openHelp  = () => { helpOverlay?.classList.add('open'); helpOverlay?.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
const closeHelp = () => { helpOverlay?.classList.remove('open'); helpOverlay?.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
helpBtn?.addEventListener('click', openHelp);
helpClose?.addEventListener('click', closeHelp);
helpOverlay?.addEventListener('click', (e: MouseEvent) => { if (e.target === helpOverlay) closeHelp(); });

/* ════════════════ KEYBOARD SHORTCUTS ════════════════ */
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const tag = (document.activeElement as HTMLElement | null)?.tagName?.toLowerCase() ?? '';
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

/* ════════════════ SHARE BUTTONS ════════════════ */
const shareToast = $('#share-toast') as HTMLElement | null;
$$<HTMLButtonElement>('.share-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = `Check out "${btn.dataset.project}" by Sabbir Hossain Rafat — ${btn.dataset.desc} ${window.location.origin}${window.location.pathname}#projects`;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .catch(() => { const ta = document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); })
      .finally(showToast);
  });
});
function showToast(): void {
  if (!shareToast) return;
  shareToast.classList.add('show'); shareToast.setAttribute('aria-hidden','false');
  setTimeout(() => { shareToast.classList.remove('show'); shareToast.setAttribute('aria-hidden','true'); }, 2800);
}

/* ════════════════ SERVICE WORKER ════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => { console.log('[SW] Registered:', reg.scope); })
      .catch(err => { console.warn('[SW] Failed:', err); });
  });
}

console.log('%c Sabbir Hossain Rafat · Portfolio v3.0 ', 'background:linear-gradient(135deg,#667eea,#22d3ee);color:#fff;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:800;');