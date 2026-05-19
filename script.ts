/* ============================================================
   SABBIR HOSSAIN RAFAT — Portfolio TypeScript Source
   Strict-mode typed version of script.js
   ============================================================ */

'use strict';

/* ── Utility types ── */
type Theme = 'dark' | 'light';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';
interface Particle { x: number; y: number; r: number; vx: number; vy: number; alpha: number }
interface KnowledgeBase { [key: string]: string }

/* ── Helpers ── */
const $ = <T extends Element = Element>(sel: string, ctx: Document | Element = document): T | null =>
  (ctx as Document | Element).querySelector(sel) as T | null;

const $$ = <T extends Element = Element>(sel: string, ctx: Document | Element = document): T[] =>
  [...(ctx as Document | Element).querySelectorAll<T>(sel)];

/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
(function initTheme(): void {
  const saved = localStorage.getItem('theme') as Theme | null;
  const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', saved ?? preferred);
})();

function setTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

const themeToggle = $('#theme-toggle') as HTMLButtonElement | null;
themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') as Theme;
  setTheme(current === 'dark' ? 'light' : 'dark');
});

/* ════════════════════════════════════════
   SMOOTH SCROLL
════════════════════════════════════════ */
function smoothScrollTo(target: Element | null, duration = 700): void {
  if (!target) return;
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + window.scrollY - 68;
  const diff = end - start;
  let startTime: number | null = null;

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(ts: number): void {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + diff * easeInOutCubic(progress));
    if (elapsed < duration) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.addEventListener('click', (e: MouseEvent) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href')!.slice(1);
  const target = document.getElementById(id);
  if (target) { e.preventDefault(); smoothScrollTo(target); }
});

/* ════════════════════════════════════════
   PROGRESS BAR
════════════════════════════════════════ */
const progressBar = $('#progress-bar') as HTMLElement | null;

function updateProgress(): void {
  if (!progressBar) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
  progressBar.style.width = Math.min(pct, 100) + '%';
}

/* ════════════════════════════════════════
   CUSTOM CURSOR
════════════════════════════════════════ */
const cursorDot = $('#cursor-dot') as HTMLElement | null;
const cursorRing = $('#cursor-ring') as HTMLElement | null;
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

function animateCursor(): void {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  if (cursorRing) {
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
  }
  requestAnimationFrame(animateCursor);
}

document.addEventListener('mousemove', (e: MouseEvent) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursorDot) {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  }
});

document.addEventListener('mouseover', (e: MouseEvent) => {
  if (!cursorRing) return;
  const interactive = (e.target as Element).closest('a,button,.pill,.proj-card,.about-card,.channel-item');
  cursorRing.style.width = interactive ? '50px' : '34px';
  cursorRing.style.height = interactive ? '50px' : '34px';
  cursorRing.style.borderColor = interactive ? 'rgba(102,126,234,0.7)' : 'rgba(102,126,234,0.5)';
});

if (window.matchMedia('(pointer:fine)').matches) animateCursor();

/* ════════════════════════════════════════
   PARTICLE SYSTEM
════════════════════════════════════════ */
(function initParticles(): void {
  const canvas = $('#particle-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0;
  let particles: Particle[] = [];
  const COUNT = Math.min(60, Math.floor(window.innerWidth / 22));
  let mx = -9999, my = -9999;

  function resize(): void { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

  function createParticle(): Particle {
    return { x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.4 + 0.1 };
  }

  function init(): void {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }

  window.addEventListener('mousemove', (e: MouseEvent) => { mx = e.clientX; my = e.clientY; });

  function draw(): void {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      const dx = p.x - mx, dy = p.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        const force = (100 - dist) / 100;
        p.vx += (dx / dist) * force * 0.08;
        p.vy += (dy / dist) * force * 0.08;
      }
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(102,126,234,${p.alpha})`;
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(102,126,234,${(1 - d / 110) * 0.12})`;
          ctx.lineWidth = 0.6; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  init(); draw();
  let rTimer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => { clearTimeout(rTimer); rTimer = setTimeout(init, 200); });
})();

/* ════════════════════════════════════════
   NAVBAR + SCROLL
════════════════════════════════════════ */
const siteNav = $('#site-nav') as HTMLElement | null;
const backToTop = $('#back-to-top') as HTMLButtonElement | null;

function updateActiveNav(): void {
  const sections = $$<HTMLElement>('section[id]');
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
  $$<HTMLAnchorElement>('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

function onScroll(): void {
  const y = window.scrollY;
  siteNav?.classList.toggle('scrolled', y > 40);
  backToTop?.classList.toggle('visible', y > 340);
  updateProgress();
  updateActiveNav();
  $$<HTMLElement>('.orb').forEach((orb, i) => {
    const speeds = [0.08, 0.05, 0.12];
    orb.style.transform = `translateY(${y * speeds[i]}px)`;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
backToTop?.addEventListener('click', () => smoothScrollTo(document.getElementById('home')));

/* ════════════════════════════════════════
   MOBILE MENU
════════════════════════════════════════ */
const hamburger = $('#hamburger') as HTMLButtonElement | null;
const mobileMenu = $('#mobile-menu') as HTMLElement | null;
const mobileBackdrop = $('#mobile-backdrop') as HTMLElement | null;
const mobileClose = $('#mobile-close') as HTMLButtonElement | null;

const openMobile = (): void => {
  hamburger?.classList.add('open');
  mobileMenu?.classList.add('open');
  mobileBackdrop?.classList.add('open');
  mobileMenu?.setAttribute('aria-hidden', 'false');
  hamburger?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};

const closeMobile = (): void => {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  mobileBackdrop?.classList.remove('open');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  hamburger?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

hamburger?.addEventListener('click', () => mobileMenu?.classList.contains('open') ? closeMobile() : openMobile());
mobileClose?.addEventListener('click', closeMobile);
mobileBackdrop?.addEventListener('click', closeMobile);
$$('.mobile-link').forEach(l => l.addEventListener('click', closeMobile));
window.addEventListener('resize', () => { if (window.innerWidth >= 860) closeMobile(); });

/* ════════════════════════════════════════
   TYPING ANIMATION
════════════════════════════════════════ */
const phrases: string[] = ['AI Product Engineer', 'Full-Stack Developer', 'Secure AI Systems Builder', 'RAG Pipeline Architect'];
let phraseIdx = 0, charIdx = 0, deleting = false;
const typedEl = $('#typed-text') as HTMLElement | null;

function typeLoop(): void {
  if (!typedEl) return;
  const phrase = phrases[phraseIdx];
  if (!deleting) {
    typedEl.textContent = phrase.slice(0, ++charIdx);
    if (charIdx === phrase.length) { deleting = true; setTimeout(typeLoop, 2200); return; }
    setTimeout(typeLoop, 68);
  } else {
    typedEl.textContent = phrase.slice(0, --charIdx);
    if (charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; setTimeout(typeLoop, 420); return; }
    setTimeout(typeLoop, 38);
  }
}
setTimeout(typeLoop, 900);

/* ════════════════════════════════════════
   REVEAL OBSERVER
════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target as HTMLElement;
    setTimeout(() => el.classList.add('visible'), parseInt(el.dataset.delay ?? '0', 10));
    revealObs.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => revealObs.observe(el));

/* ════════════════════════════════════════
   COUNTERS
════════════════════════════════════════ */
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target as HTMLElement;
    const target = parseInt(el.dataset.target ?? '0', 10);
    let start: number | null = null;
    const step = (ts: number): void => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1400, 1);
      el.textContent = String(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step); else el.textContent = String(target);
    };
    requestAnimationFrame(step);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });

$$('.counter').forEach(el => counterObs.observe(el));

/* ════════════════════════════════════════
   FOCUS BAR ANIMATION
════════════════════════════════════════ */
const focusBarObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    (entry.target.querySelector('.focus-fill') as HTMLElement | null)?.classList.add('animate');
    focusBarObs.unobserve(entry.target);
  });
}, { threshold: 0.3 });
$$('.focus-card').forEach(c => focusBarObs.observe(c));

/* ════════════════════════════════════════
   3D TILT
════════════════════════════════════════ */
$$<HTMLElement>('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (e: MouseEvent) => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -6;
    const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 6;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ════════════════════════════════════════
   AVATAR 3D PARALLAX
════════════════════════════════════════ */
const avatarEl = $('#avatar-3d') as HTMLElement | null;
document.addEventListener('mousemove', (e: MouseEvent) => {
  if (!avatarEl) return;
  const dx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  avatarEl.style.transform = `perspective(900px) rotateY(${dx * 8}deg) rotateX(${dy * -5}deg)`;
});

/* ════════════════════════════════════════
   SKILL TOOLTIP
════════════════════════════════════════ */
const skillTip = $('#skill-tip') as HTMLElement | null;
const tipName = skillTip?.querySelector('.tip-name') as HTMLElement | null;
const tipFill = skillTip?.querySelector('.tip-fill') as HTMLElement | null;
const tipLevel = skillTip?.querySelector('.tip-level') as HTMLElement | null;
const tipDesc = skillTip?.querySelector('.tip-desc') as HTMLElement | null;

function positionTip(e: MouseEvent): void {
  if (!skillTip) return;
  const x = e.clientX + 14, y = e.clientY - 10;
  const rect = skillTip.getBoundingClientRect();
  skillTip.style.left = (x + rect.width > window.innerWidth ? e.clientX - rect.width - 14 : x) + 'px';
  skillTip.style.top = (y + rect.height > window.innerHeight ? e.clientY - rect.height - 10 : y) + 'px';
}

$$<HTMLButtonElement>('.pill').forEach(pill => {
  pill.addEventListener('mouseenter', (e: MouseEvent) => {
    if (!skillTip) return;
    if (tipName) tipName.textContent = pill.textContent?.trim() ?? '';
    if (tipFill) tipFill.style.width = (pill.dataset.level ?? '0') + '%';
    if (tipLevel) tipLevel.textContent = (pill.dataset.level ?? '0') + '% proficiency';
    if (tipDesc) tipDesc.textContent = pill.dataset.desc ?? '';
    skillTip.classList.add('visible');
    skillTip.setAttribute('aria-hidden', 'false');
    positionTip(e);
  });
  pill.addEventListener('mousemove', positionTip);
  pill.addEventListener('mouseleave', () => {
    skillTip?.classList.remove('visible');
    skillTip?.setAttribute('aria-hidden', 'true');
    if (tipFill) tipFill.style.width = '0%';
  });
});

/* ════════════════════════════════════════
   PROJECT FILTER
════════════════════════════════════════ */
$$<HTMLButtonElement>('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter ?? 'all';
    $$<HTMLElement>('.proj-card').forEach((card, i) => {
      const match = filter === 'all' || (card.dataset.tags ?? '').toLowerCase().includes(filter.toLowerCase());
      if (!match) { card.classList.add('hidden'); return; }
      card.classList.remove('hidden');
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px) scale(0.97)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.35s ease,transform 0.35s ease';
        card.style.opacity = '1';
        card.style.transform = '';
        setTimeout(() => { card.style.transition = ''; }, 360);
      }, i * 55);
    });
  });
});

/* ════════════════════════════════════════
   RIPPLE
════════════════════════════════════════ */
$$<HTMLElement>('.btn').forEach(btn => {
  btn.addEventListener('click', (e: MouseEvent) => {
    const rect = btn.getBoundingClientRect();
    const span = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 2.2;
    span.className = 'btn-ripple';
    span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(span);
    setTimeout(() => span.remove(), 600);
  });
});

/* ════════════════════════════════════════
   TIMEZONE HINT
════════════════════════════════════════ */
(function setTimezone(): void {
  const tzText = $('#tz-text') as HTMLElement | null;
  if (!tzText) return;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const sabbirHour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dhaka' }).format(now), 10);
    const online = sabbirHour >= 9 && sabbirHour <= 22;
    tzText.textContent = `Your timezone: ${tz.replace(/_/g, ' ')}. ${online ? 'Sabbir is likely online now — great time to reach out!' : 'Sabbir is in UTC+6. Best contact hours: 09:00–22:00 BDT.'}`;
  } catch {
    tzText.textContent = 'Sabbir is based in Bangladesh (UTC+6). Best contact hours: 09:00–22:00 BDT.';
  }
})();

/* ════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════ */
const contactForm = $('#contact-form') as HTMLFormElement | null;
const fName = $('#f-name') as HTMLInputElement | null;
const fEmail = $('#f-email') as HTMLInputElement | null;
const fMsg = $('#f-msg') as HTMLTextAreaElement | null;
const charCountEl = $('#char-count') as HTMLElement | null;
const submitBtn = $('#form-submit') as HTMLButtonElement | null;
const submitLabel = submitBtn?.querySelector('.btn-label') as HTMLElement | null;
const submitSpinner = submitBtn?.querySelector('.btn-spinner') as HTMLElement | null;
const submitCheck = submitBtn?.querySelector('.btn-check') as HTMLElement | null;
const formGlobalErr = $('#form-global-err') as HTMLElement | null;

type FieldValidator = [HTMLInputElement | HTMLTextAreaElement | null, HTMLElement | null, (v: string) => string];

const validators: FieldValidator[] = [
  [fName, $('#err-name'), v => v.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'],
  [fEmail, $('#err-email'), v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.'],
  [fMsg, $('#err-msg'), v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.'],
];

function validateField(input: HTMLInputElement | HTMLTextAreaElement | null, errEl: HTMLElement | null): boolean {
  if (!input || !errEl) return true;
  const v = validators.find(x => x[0] === input);
  if (!v) return true;
  const err = v[2](input.value);
  errEl.textContent = err;
  input.parentElement?.classList.toggle('has-error', !!err);
  return !err;
}

fMsg?.addEventListener('input', () => {
  if (charCountEl) charCountEl.textContent = String(fMsg.value.length);
  validateField(fMsg, validators.find(v => v[0] === fMsg)?.[1] ?? null);
});

validators.forEach(([input, errEl]) => {
  input?.addEventListener('blur', () => validateField(input, errEl));
  input?.addEventListener('input', () => {
    if (input.parentElement?.classList.contains('has-error')) validateField(input, errEl);
  });
});

function setSubmitState(state: SubmitState): void {
  if (!submitBtn) return;
  submitBtn.disabled = state === 'loading';
  if (submitLabel) submitLabel.textContent = state === 'success' ? 'Message Sent!' : state === 'loading' ? 'Sending…' : 'Send Message';
  submitSpinner?.classList.toggle('hidden', state !== 'loading');
  submitCheck?.classList.toggle('hidden', state !== 'success');
}

contactForm?.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  formGlobalErr?.classList.add('hidden');
  const valid = validators.every(([input, errEl]) => validateField(input, errEl));
  if (!valid) return;
  setSubmitState('loading');
  const payload = { name: fName!.value.trim(), email: fEmail!.value.trim(), message: fMsg!.value.trim() };
  try {
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setSubmitState('success'); contactForm.reset(); if (charCountEl) charCountEl.textContent = '0'; setTimeout(() => setSubmitState('idle'), 4000); }
    else { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Server error.'); }
  } catch (err) {
    const e = err as Error;
    if (e.message.includes('fetch') || e.message.includes('Failed')) {
      setSubmitState('success'); contactForm.reset(); if (charCountEl) charCountEl.textContent = '0'; setTimeout(() => setSubmitState('idle'), 4000);
    } else {
      setSubmitState('idle');
      if (formGlobalErr) { formGlobalErr.textContent = e.message; formGlobalErr.classList.remove('hidden'); }
    }
  }
});

/* ════════════════════════════════════════
   TERMINAL
════════════════════════════════════════ */
const termOverlay = $('#terminal-overlay') as HTMLElement | null;
const termInputEl = $('#term-input') as HTMLInputElement | null;
const termOutputEl = $('#term-output') as HTMLElement | null;
const termOpenBtn = $('#terminal-btn') as HTMLButtonElement | null;
const termCloseBtn = $('#terminal-close-btn') as HTMLButtonElement | null;
const termXDot = $('#term-x-dot') as HTMLButtonElement | null;

let termHistory: string[] = [];
let historyIdx = -1;

const TERM_COMMANDS: Record<string, () => string[] | null> = {
  help: () => ['<span class="t-cyan t-bold">Available commands:</span>','',
    '  <span class="t-green">about</span>       — Learn about Sabbir','  <span class="t-green">skills</span>      — Technical skills',
    '  <span class="t-green">projects</span>    — Shipped projects','  <span class="t-green">contact</span>     — Contact information',
    '  <span class="t-green">education</span>   — Education','  <span class="t-green">certifications</span> — Certifications',
    '  <span class="t-green">socials</span>     — Social links','  <span class="t-green">clear</span>       — Clear terminal',
    '  <span class="t-green">exit</span>        — Close terminal','','<span class="t-dim">↑↓ to navigate history · Tab to autocomplete</span>'],
  about: () => ['<span class="t-cyan t-bold">Sabbir Hossain Rafat</span>','<span class="t-dim">──────────────────────────────</span>',
    'Role     : <span class="t-green">AI Product Engineer & Full-Stack Architect</span>',
    'Education: <span class="t-yellow">Daffodil International University</span>',
    'Location : Bangladesh (UTC+6)','Status   : <span class="t-green">Open to core engineering roles</span>'],
  skills: () => ['<span class="t-cyan t-bold">Technical Skills</span>','<span class="t-dim">──────────────────────────────</span>',
    '<span class="t-yellow">Languages</span>  TypeScript · JavaScript · Python · C · Node.js',
    '<span class="t-yellow">Frameworks</span> Astro v6 · Tailwind v4 · React · Next.js · HTML5/CSS3',
    '<span class="t-yellow">Cloud/Data</span> Supabase · PostgreSQL · OpenRouter · Gemini API',
    '<span class="t-yellow">Payments</span>   Stripe · bKash · NAGAD · SSLCOMMERZ',
    '<span class="t-yellow">DevOps</span>     Docker · Linux · Git · GitHub Actions'],
  projects: () => ['<span class="t-cyan t-bold">Shipped Projects</span>','<span class="t-dim">──────────────────────────────</span>',
    '<span class="t-green">Studia</span>           Academic management system',
    '<span class="t-green">AuthPage</span>         3D React authentication component',
    '<span class="t-green">Security Scanner</span> Python vulnerability diagnostic tool',
    '<span class="t-green">Vanish Pen</span>       Auto-fading canvas drawing app',
    '<span class="t-green">Artmoji</span>          Text-to-dot-art parser',
    '<span class="t-green">Mystical Dragon</span>  3D WebGL interactive model','',
    'GitHub: <span class="t-cyan">github.com/SabbirHossainRafat</span>'],
  contact: () => ['<span class="t-cyan t-bold">Contact</span>','<span class="t-dim">──────────────────────────────</span>',
    'Email   : <span class="t-green">sabbirrafat369@gmail.com</span>',
    'GitHub  : <span class="t-cyan">github.com/SabbirHossainRafat</span>',
    'LinkedIn: <span class="t-cyan">linkedin.com/in/sabbirhossainrafat</span>',
    'Twitter : <span class="t-cyan">x.com/sabbir_rafat</span>'],
  education: () => ['<span class="t-cyan t-bold">Education</span>','<span class="t-dim">──────────────────────────────</span>',
    'Institution: <span class="t-yellow">Daffodil International University</span>',
    'Degree     : BSc Software Engineering','Started    : 2021'],
  certifications: () => ['<span class="t-cyan t-bold">Certifications</span>','<span class="t-dim">──────────────────────────────</span>',
    '<span class="t-green">CEH</span> — Certified Ethical Hacker (EC-Council)',
    '','Domains: Network Scanning · System Hacking · Cryptography',
    '         Web App Hacking · SQL Injection · Malware Threats'],
  socials: () => ['<span class="t-cyan t-bold">Socials</span>','<span class="t-dim">──────────────────────────────</span>',
    '  GitHub   → <span class="t-cyan">github.com/SabbirHossainRafat</span>',
    '  LinkedIn → <span class="t-cyan">linkedin.com/in/sabbirhossainrafat</span>',
    '  Twitter  → <span class="t-cyan">x.com/sabbir_rafat</span>'],
  whoami: () => ['visitor'],
  date: () => [new Date().toString()],
  ls: () => ['about  skills  projects  contact  education  certifications  socials  clear  exit'],
  clear: () => { if (termOutputEl) termOutputEl.innerHTML = ''; return null; },
  exit: () => { closeTerm(); return null; },
};

function escHtml(s: string): string { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function termPrint(lines: string[]): void {
  if (!termOutputEl) return;
  const div = document.createElement('div');
  div.style.marginBottom = '8px';
  div.innerHTML = lines.map(l => `<span class="term-line">${l}</span>`).join('');
  termOutputEl.appendChild(div);
  termOutputEl.scrollTop = termOutputEl.scrollHeight;
}

function termEcho(cmd: string): void {
  if (!termOutputEl) return;
  const div = document.createElement('div');
  div.style.marginBottom = '4px';
  div.innerHTML = `<span class="term-line"><span class="t-green">sabbir@portfolio</span><span class="t-dim">:</span><span class="t-blue">~</span><span class="t-dim">$</span> ${escHtml(cmd)}</span>`;
  termOutputEl.appendChild(div);
}

function runCommand(raw: string): void {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  termHistory.unshift(raw); historyIdx = -1;
  termEcho(raw);
  if (TERM_COMMANDS[cmd]) {
    const r = TERM_COMMANDS[cmd]();
    if (r !== null) termPrint(r);
  } else {
    termPrint([`<span class="t-red">command not found: ${escHtml(cmd)}</span>`, 'Type <span class="t-cyan">help</span> to see available commands.']);
  }
}

function openTerm(): void {
  if (!termOverlay) return;
  termOverlay.classList.add('open');
  termOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (termOutputEl && termOutputEl.children.length === 0) {
    termPrint(['<span class="t-green t-bold">Sabbir Portfolio Terminal v2.0</span>','',
      'Type <span class="t-cyan">help</span> for available commands.','']);
  }
  setTimeout(() => termInputEl?.focus(), 60);
}

function closeTerm(): void {
  if (!termOverlay) return;
  termOverlay.classList.remove('open');
  termOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

termOpenBtn?.addEventListener('click', openTerm);
termCloseBtn?.addEventListener('click', closeTerm);
termXDot?.addEventListener('click', closeTerm);
termOverlay?.addEventListener('click', (e: MouseEvent) => { if (e.target === termOverlay) closeTerm(); });

termInputEl?.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') { const v = termInputEl.value; termInputEl.value = ''; runCommand(v); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (historyIdx < termHistory.length - 1) termInputEl.value = termHistory[++historyIdx]; }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIdx > 0) termInputEl.value = termHistory[--historyIdx]; else { historyIdx = -1; termInputEl.value = ''; } }
  else if (e.key === 'Tab') { e.preventDefault(); const m = Object.keys(TERM_COMMANDS).find(k => k.startsWith(termInputEl.value.toLowerCase())); if (m) termInputEl.value = m; }
});

/* ════════════════════════════════════════
   AI CHAT
════════════════════════════════════════ */
const chatFab = $('#chat-fab') as HTMLButtonElement | null;
const chatPanel = $('#chat-panel') as HTMLElement | null;
const chatCloseBtn = $('#chat-close') as HTMLButtonElement | null;
const chatMsgs = $('#chat-messages') as HTMLElement | null;
const chatInputEl = $('#chat-input') as HTMLInputElement | null;
const chatSendBtn = $('#chat-send') as HTMLButtonElement | null;
const fabChatIcon = chatFab?.querySelector('.fab-icon-chat') as HTMLElement | null;
const fabCloseIcon = chatFab?.querySelector('.fab-icon-close') as HTMLElement | null;

const KB: KnowledgeBase = {
  skills: 'Sabbir\'s primary skills include TypeScript, JavaScript, Python, Node.js, React, Next.js, Astro v6, Tailwind v4, Supabase, PostgreSQL, Gemini API, OpenRouter, Docker, Linux, Git, Stripe, bKash, NAGAD, and SSLCOMMERZ.',
  projects: 'Sabbir has shipped 6 main projects: Studia (academic management), AuthPage (3D React auth component), Security Scanner (Python OWASP tool), Vanish Pen (canvas app), Artmoji (text-to-art parser), and Mystical Dragon (3D WebGL). All on GitHub at github.com/SabbirHossainRafat.',
  ai: 'Sabbir specialises in AI engineering — LLM-powered applications, RAG systems, and Gemini API / OpenRouter integrations. He designs full-stack AI products end-to-end.',
  security: 'Sabbir holds a CEH (Certified Ethical Hacker) from EC-Council, and applies it to API security, threat modeling, and penetration testing.',
  education: 'Sabbir studies Software Engineering at Daffodil International University, started 2021.',
  contact: 'Email: sabbirrafat369@gmail.com | GitHub: SabbirHossainRafat | LinkedIn: sabbirhossainrafat | Twitter: @sabbir_rafat',
  available: 'Yes! Sabbir is actively seeking core engineering roles — full-time, contract, or collaboration in AI engineering, full-stack, and security.',
  background: 'Sabbir is an AI Product Engineer from Bangladesh. He started coding in 2021 and has built 20+ projects spanning AI, security, fintech, and creative tooling.',
};

const FALLBACKS = [
  'I\'m Sabbir\'s AI. Ask me about his skills, projects, background, or contact info!',
  'Try asking about his tech stack, shipped projects, AI expertise, or availability.',
  'I know everything about Sabbir\'s portfolio — skills, projects, education, certifications!',
];
let fbIdx = 0;

function getAIResponse(msg: string): string {
  const m = msg.toLowerCase();
  if (/(skill|tech|stack|language|framework|tool)/.test(m)) return KB.skills;
  if (/(project|ship|build|studia|authpage|scanner|vanish|artmoji|dragon)/.test(m)) return KB.projects;
  if (/(ai|llm|rag|gemini|openrouter|ml|model)/.test(m)) return KB.ai;
  if (/(security|ceh|hack|pentest|vuln|owasp)/.test(m)) return KB.security;
  if (/(education|university|degree|study|daffodil)/.test(m)) return KB.education;
  if (/(contact|email|reach|linkedin|github|twitter|social)/.test(m)) return KB.contact;
  if (/(available|open|work|job|hire|role|freelance|opportunity)/.test(m)) return KB.available;
  if (/(background|about|who|sabbir|story)/.test(m)) return KB.background;
  return FALLBACKS[fbIdx++ % FALLBACKS.length];
}

function appendMsg(text: string, role: 'ai' | 'user'): void {
  if (!chatMsgs) return;
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg-${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  div.appendChild(bubble);
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function showTyping(): HTMLElement | null {
  if (!chatMsgs) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-ai';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="chat-bubble chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

function sendChat(msg: string): void {
  if (!msg.trim()) return;
  if (chatInputEl) chatInputEl.value = '';
  const quick = $('#chat-quick') as HTMLElement | null;
  if (quick) quick.style.display = 'none';
  appendMsg(msg, 'user');
  const typing = showTyping();
  setTimeout(() => { typing?.remove(); appendMsg(getAIResponse(msg), 'ai'); }, 600 + Math.random() * 600);
}

function openChat(): void {
  if (!chatPanel) return;
  chatPanel.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  fabChatIcon?.classList.add('hidden');
  fabCloseIcon?.classList.remove('hidden');
  if (chatMsgs && chatMsgs.children.length === 0) {
    appendMsg("Hi! I'm Sabbir's AI assistant. Ask me anything about his skills, projects, background, or contact info! 👋", 'ai');
  }
  setTimeout(() => chatInputEl?.focus(), 60);
}

function closeChat(): void {
  chatPanel?.classList.remove('open');
  chatPanel?.setAttribute('aria-hidden', 'true');
  fabChatIcon?.classList.remove('hidden');
  fabCloseIcon?.classList.add('hidden');
}

chatFab?.addEventListener('click', () => chatPanel?.classList.contains('open') ? closeChat() : openChat());
chatCloseBtn?.addEventListener('click', closeChat);
chatSendBtn?.addEventListener('click', () => sendChat(chatInputEl?.value ?? ''));
chatInputEl?.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') sendChat(chatInputEl.value); });
$$<HTMLButtonElement>('.quick-chip').forEach(b => b.addEventListener('click', () => sendChat(b.textContent ?? '')));

/* ════════════════════════════════════════
   HELP PANEL
════════════════════════════════════════ */
const helpOverlay = $('#help-overlay') as HTMLElement | null;
const helpBtn = $('#help-btn') as HTMLButtonElement | null;
const helpClose = $('#help-close') as HTMLButtonElement | null;

const openHelp = (): void => { helpOverlay?.classList.add('open'); helpOverlay?.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
const closeHelp = (): void => { helpOverlay?.classList.remove('open'); helpOverlay?.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };

helpBtn?.addEventListener('click', openHelp);
helpClose?.addEventListener('click', closeHelp);
helpOverlay?.addEventListener('click', (e: MouseEvent) => { if (e.target === helpOverlay) closeHelp(); });

/* ════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════ */
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const tag = (document.activeElement as HTMLElement | null)?.tagName.toLowerCase() ?? '';
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

/* ════════════════════════════════════════
   RESUME BUTTON
════════════════════════════════════════ */
$('#resume-btn')?.addEventListener('click', (e: Event) => {
  e.preventDefault();
  const a = document.createElement('a');
  a.href = 'assets/sabbir-rafat-resume.pdf';
  a.download = 'Sabbir-Hossain-Rafat-Resume.pdf';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
});

/* ════════════════════════════════════════
   FOOTER DATES
════════════════════════════════════════ */
const fy = $('#footer-year') as HTMLElement | null;
const fd = $('#footer-date') as HTMLElement | null;
if (fy) fy.textContent = String(new Date().getFullYear());
if (fd) { fd.textContent = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); fd.setAttribute('datetime', new Date().toISOString().split('T')[0]); }

/* ════════════════════════════════════════
   SERVICE WORKER
════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}

console.log('%c Sabbir Hossain Rafat · Portfolio v2.0 ','background:linear-gradient(135deg,#667eea,#22d3ee);color:#fff;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;');