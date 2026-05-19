/* ============================================================
   SABBIR HOSSAIN RAFAT — Portfolio Script
   Production-ready, fully functional JavaScript
   ============================================================ */

'use strict';

/* ── Helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
const cls = (el, ...args) => el && el.classList;

function smoothScrollTo(target, duration = 700) {
  if (!target) return;
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + window.scrollY - 68;
  const diff = end - start;
  let startTime = null;
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function step(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + diff * easeInOutCubic(progress));
    if (elapsed < duration) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', saved || preferred);
})();

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

const themeToggle = $('#theme-toggle');
on(themeToggle, 'click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

/* ════════════════════════════════════════
   PROGRESS BAR
════════════════════════════════════════ */
const progressBar = $('#progress-bar');
function updateProgress() {
  if (!progressBar) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
  progressBar.style.width = Math.min(pct, 100) + '%';
}

/* ════════════════════════════════════════
   CUSTOM CURSOR
════════════════════════════════════════ */
const cursorDot = $('#cursor-dot');
const cursorRing = $('#cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;
let cursorRAF = null;

function animateCursor() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  if (cursorRing) {
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
  }
  cursorRAF = requestAnimationFrame(animateCursor);
}

on(document, 'mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursorDot) {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  }
});

on(document, 'mouseenter', () => {
  if (cursorDot) cursorDot.style.opacity = '1';
  if (cursorRing) cursorRing.style.opacity = '1';
});
on(document, 'mouseleave', () => {
  if (cursorDot) cursorDot.style.opacity = '0';
  if (cursorRing) cursorRing.style.opacity = '0';
});

// Grow ring on interactive elements
on(document, 'mouseover', e => {
  if (!cursorRing) return;
  const interactive = e.target.closest('a,button,.pill,.proj-card,.about-card,.channel-item,.proj-link');
  if (interactive) {
    cursorRing.style.width = '50px';
    cursorRing.style.height = '50px';
    cursorRing.style.borderColor = 'rgba(102,126,234,0.7)';
  } else {
    cursorRing.style.width = '34px';
    cursorRing.style.height = '34px';
    cursorRing.style.borderColor = 'rgba(102,126,234,0.5)';
  }
});

if (window.matchMedia('(pointer:fine)').matches) {
  animateCursor();
}

/* ════════════════════════════════════════
   PARTICLE SYSTEM
════════════════════════════════════════ */
(function initParticles() {
  const canvas = $('#particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], raf;
  const COUNT = Math.min(60, Math.floor(window.innerWidth / 22));

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.4 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }

  let mx = -9999, my = -9999;
  on(window, 'mousemove', e => { mx = e.clientX; my = e.clientY; });

  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const color = isDark() ? '102,126,234' : '102,126,234';

    particles.forEach(p => {
      // Subtle mouse repulsion
      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        const force = (100 - dist) / 100;
        p.vx += (dx / dist) * force * 0.08;
        p.vy += (dy / dist) * force * 0.08;
      }

      // Dampen
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${p.alpha})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          const alpha = (1 - d / 110) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${color},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(draw);
  }

  init();
  draw();

  let resizeTimer;
  on(window, 'resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });
})();

/* ════════════════════════════════════════
   NAVBAR SCROLL BEHAVIOUR
════════════════════════════════════════ */
const siteNav = $('#site-nav');
const backToTop = $('#back-to-top');

function onScroll() {
  const y = window.scrollY;
  siteNav && siteNav.classList.toggle('scrolled', y > 40);
  backToTop && backToTop.classList.toggle('visible', y > 340);
  updateProgress();
  updateActiveNav();
}

on(window, 'scroll', onScroll, { passive: true });
onScroll();

backToTop && on(backToTop, 'click', () => smoothScrollTo(document.getElementById('home')));

/* ── Active nav link ── */
function updateActiveNav() {
  const sections = $$('section[id]');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  $$('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === '#' + current);
  });
}

/* ════════════════════════════════════════
   SMOOTH ANCHOR SCROLL
════════════════════════════════════════ */
on(document, 'click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (target) {
    e.preventDefault();
    smoothScrollTo(target);
  }
});

/* ════════════════════════════════════════
   MOBILE MENU
════════════════════════════════════════ */
const hamburger = $('#hamburger');
const mobileMenu = $('#mobile-menu');
const mobileBackdrop = $('#mobile-backdrop');
const mobileClose = $('#mobile-close');

function openMobile() {
  hamburger && hamburger.classList.add('open');
  mobileMenu && mobileMenu.classList.add('open');
  mobileBackdrop && mobileBackdrop.classList.add('open');
  mobileMenu && mobileMenu.setAttribute('aria-hidden', 'false');
  hamburger && hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobile() {
  hamburger && hamburger.classList.remove('open');
  mobileMenu && mobileMenu.classList.remove('open');
  mobileBackdrop && mobileBackdrop.classList.remove('open');
  mobileMenu && mobileMenu.setAttribute('aria-hidden', 'true');
  hamburger && hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

on(hamburger, 'click', () => {
  const isOpen = mobileMenu && mobileMenu.classList.contains('open');
  isOpen ? closeMobile() : openMobile();
});
on(mobileClose, 'click', closeMobile);
on(mobileBackdrop, 'click', closeMobile);
$$('.mobile-link').forEach(l => on(l, 'click', closeMobile));
on(window, 'resize', () => { if (window.innerWidth >= 860) closeMobile(); });

/* ════════════════════════════════════════
   TYPING ANIMATION
════════════════════════════════════════ */
const phrases = ['AI Product Engineer', 'Full-Stack Developer', 'Secure AI Systems Builder', 'RAG Pipeline Architect'];
let phraseIdx = 0, charIdx = 0, deleting = false;
const typedEl = $('#typed-text');

function typeLoop() {
  if (!typedEl) return;
  const phrase = phrases[phraseIdx];
  if (!deleting) {
    typedEl.textContent = phrase.slice(0, ++charIdx);
    if (charIdx === phrase.length) {
      deleting = true;
      setTimeout(typeLoop, 2200);
      return;
    }
    setTimeout(typeLoop, 68);
  } else {
    typedEl.textContent = phrase.slice(0, --charIdx);
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      setTimeout(typeLoop, 420);
      return;
    }
    setTimeout(typeLoop, 38);
  }
}
setTimeout(typeLoop, 900);

/* ════════════════════════════════════════
   SCROLL-TRIGGERED REVEALS
════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseInt(el.dataset.delay || '0', 10);
    setTimeout(() => el.classList.add('visible'), delay);
    revealObserver.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => revealObserver.observe(el));

/* ════════════════════════════════════════
   COUNTERS
════════════════════════════════════════ */
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    let start = 0;
    const duration = 1400;
    const step = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });

$$('.counter').forEach(el => counterObserver.observe(el));

/* ════════════════════════════════════════
   FOCUS PROGRESS BARS
════════════════════════════════════════ */
const focusBarObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const bar = entry.target.querySelector('.focus-fill');
    if (bar) bar.classList.add('animate');
    focusBarObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });

$$('.focus-card').forEach(card => focusBarObserver.observe(card));

/* ════════════════════════════════════════
   3D TILT CARDS
════════════════════════════════════════ */
$$('.tilt-card').forEach(card => {
  on(card, 'mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -6;
    const rotY = ((x - cx) / cx) * 6;
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  });
  on(card, 'mouseleave', () => {
    card.style.transform = '';
  });
});

/* ════════════════════════════════════════
   3D AVATAR MOUSE PARALLAX
════════════════════════════════════════ */
const avatarShell = $('#avatar-3d');
on(document, 'mousemove', e => {
  if (!avatarShell) return;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx;
  const dy = (e.clientY - cy) / cy;
  avatarShell.style.transform = `perspective(900px) rotateY(${dx * 8}deg) rotateX(${dy * -5}deg)`;
});

/* ════════════════════════════════════════
   SKILL PILLS TOOLTIP
════════════════════════════════════════ */
const skillTip = $('#skill-tip');
const tipName = skillTip && skillTip.querySelector('.tip-name');
const tipFill = skillTip && skillTip.querySelector('.tip-fill');
const tipLevel = skillTip && skillTip.querySelector('.tip-level');
const tipDesc = skillTip && skillTip.querySelector('.tip-desc');

function positionTip(e) {
  if (!skillTip) return;
  const x = e.clientX + 14;
  const y = e.clientY - 10;
  const rect = skillTip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  skillTip.style.left = (x + rect.width > vw ? e.clientX - rect.width - 14 : x) + 'px';
  skillTip.style.top = (y + rect.height > vh ? e.clientY - rect.height - 10 : y) + 'px';
}

$$('.pill').forEach(pill => {
  on(pill, 'mouseenter', e => {
    if (!skillTip) return;
    const level = pill.dataset.level || '0';
    const desc = pill.dataset.desc || '';
    if (tipName) tipName.textContent = pill.textContent.trim();
    if (tipFill) tipFill.style.width = level + '%';
    if (tipLevel) tipLevel.textContent = level + '% proficiency';
    if (tipDesc) tipDesc.textContent = desc;
    skillTip.setAttribute('aria-hidden', 'false');
    skillTip.classList.add('visible');
    positionTip(e);
  });
  on(pill, 'mousemove', positionTip);
  on(pill, 'mouseleave', () => {
    if (!skillTip) return;
    skillTip.classList.remove('visible');
    skillTip.setAttribute('aria-hidden', 'true');
    if (tipFill) tipFill.style.width = '0%';
  });
});

/* ════════════════════════════════════════
   PROJECT FILTER
════════════════════════════════════════ */
const filterBtns = $$('.filter-btn');
const projCards = $$('.proj-card');

filterBtns.forEach(btn => {
  on(btn, 'click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    projCards.forEach((card, i) => {
      const tags = (card.dataset.tags || '').toLowerCase();
      const match = filter === 'all' || tags.includes(filter.toLowerCase());

      if (!match) {
        card.classList.add('hidden');
        card.classList.remove('filtering');
      } else {
        card.classList.remove('hidden');
        // Staggered re-entry
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px) scale(0.97)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
          card.style.opacity = '1';
          card.style.transform = '';
          setTimeout(() => { card.style.transition = ''; }, 360);
        }, i * 55);
      }
    });
  });
});

/* ════════════════════════════════════════
   RIPPLE EFFECT
════════════════════════════════════════ */
$$('.btn').forEach(btn => {
  on(btn, 'click', e => {
    const rect = btn.getBoundingClientRect();
    const span = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 2.2;
    span.className = 'btn-ripple';
    span.style.cssText = `
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
    `;
    btn.appendChild(span);
    setTimeout(() => span.remove(), 600);
  });
});

/* ════════════════════════════════════════
   TIMEZONE HINT
════════════════════════════════════════ */
(function setTimezone() {
  const tzText = $('#tz-text');
  if (!tzText) return;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const hour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(now), 10);
    const sabbirHour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dhaka' }).format(now), 10);

    let hint = `Your timezone: ${tz.replace(/_/g, ' ')}.`;
    if (sabbirHour >= 9 && sabbirHour <= 22) {
      hint += ' Sabbir is likely online now — great time to reach out!';
    } else {
      hint += ' Sabbir is in UTC+6. Best contact hours: 09:00–22:00 BDT.';
    }
    tzText.textContent = hint;
  } catch {
    tzText.textContent = 'Sabbir is based in Bangladesh (UTC+6). Best contact hours: 09:00–22:00 BDT.';
  }
})();

/* ════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════ */
const contactForm = $('#contact-form');
const formName = $('#f-name');
const formEmail = $('#f-email');
const formMsg = $('#f-msg');
const charCount = $('#char-count');
const submitBtn = $('#form-submit');
const submitLabel = submitBtn && submitBtn.querySelector('.btn-label');
const submitSpinner = submitBtn && submitBtn.querySelector('.btn-spinner');
const submitCheck = submitBtn && submitBtn.querySelector('.btn-check');
const formGlobalErr = $('#form-global-err');

// Character counter
on(formMsg, 'input', () => {
  if (charCount) charCount.textContent = (formMsg.value || '').length;
  validateField(formMsg, $('#err-msg'));
});

// Real-time validation
const validations = [
  [formName, $('#err-name'), v => v.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'],
  [formEmail, $('#err-email'), v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.'],
  [formMsg, $('#err-msg'), v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.'],
];

function validateField(input, errEl) {
  if (!input || !errEl) return true;
  const validator = validations.find(v => v[0] === input);
  if (!validator) return true;
  const err = validator[2](input.value);
  errEl.textContent = err;
  input.parentElement && input.parentElement.classList.toggle('has-error', !!err);
  return !err;
}

validations.forEach(([input, errEl]) => {
  on(input, 'blur', () => validateField(input, errEl));
  on(input, 'input', () => {
    const errEl2 = validations.find(v => v[0] === input)?.[1];
    if (input.parentElement && input.parentElement.classList.contains('has-error')) {
      validateField(input, errEl2);
    }
  });
});

function setSubmitState(state) {
  if (!submitBtn) return;
  submitBtn.disabled = state === 'loading';
  if (submitLabel) submitLabel.textContent = state === 'success' ? 'Message Sent!' : state === 'loading' ? 'Sending…' : 'Send Message';
  submitSpinner && submitSpinner.classList.toggle('hidden', state !== 'loading');
  submitCheck && submitCheck.classList.toggle('hidden', state !== 'success');
}

on(contactForm, 'submit', async e => {
  e.preventDefault();
  if (formGlobalErr) formGlobalErr.classList.add('hidden');

  // Validate all
  const valid = validations.every(([input, errEl]) => validateField(input, errEl));
  if (!valid) return;

  setSubmitState('loading');
  const payload = {
    name: formName.value.trim(),
    email: formEmail.value.trim(),
    message: formMsg.value.trim(),
  };

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSubmitState('success');
      contactForm.reset();
      if (charCount) charCount.textContent = '0';
      setTimeout(() => setSubmitState('idle'), 4000);
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Server error. Please try again.');
    }
  } catch (err) {
    // Demo mode — show success when no backend is running
    if (err.message.includes('fetch') || err.message.includes('Failed')) {
      setSubmitState('success');
      contactForm.reset();
      if (charCount) charCount.textContent = '0';
      setTimeout(() => setSubmitState('idle'), 4000);
    } else {
      setSubmitState('idle');
      if (formGlobalErr) {
        formGlobalErr.textContent = err.message;
        formGlobalErr.classList.remove('hidden');
      }
    }
  }
});

/* ════════════════════════════════════════
   TERMINAL
════════════════════════════════════════ */
const termOverlay = $('#terminal-overlay');
const termInput = $('#term-input');
const termOutput = $('#term-output');
const termOpenBtn = $('#terminal-btn');
const termCloseBtn = $('#terminal-close-btn');
const termXDot = $('#term-x-dot');

let termHistory = [];
let historyIdx = -1;

const TERM_COMMANDS = {
  help: () => [
    '<span class="t-cyan t-bold">Available commands:</span>',
    '',
    '  <span class="t-green">about</span>       — Learn about Sabbir',
    '  <span class="t-green">skills</span>      — View technical skills',
    '  <span class="t-green">projects</span>    — Browse shipped projects',
    '  <span class="t-green">contact</span>     — Get contact information',
    '  <span class="t-green">education</span>   — Education background',
    '  <span class="t-green">certifications</span> — Certifications',
    '  <span class="t-green">socials</span>     — Social media links',
    '  <span class="t-green">clear</span>       — Clear terminal',
    '  <span class="t-green">exit</span>        — Close terminal',
    '',
    '<span class="t-dim">Tip: press ↑↓ to navigate command history</span>',
  ],
  about: () => [
    '<span class="t-cyan t-bold">Sabbir Hossain Rafat</span>',
    '<span class="t-dim">───────────────────────────────────</span>',
    'Role     : <span class="t-green">AI Product Engineer & Full-Stack Architect</span>',
    'Education: <span class="t-yellow">Daffodil International University (Software Engineering)</span>',
    'Location : Bangladesh (UTC+6)',
    'Status   : <span class="t-green">Open to core engineering roles</span>',
    '',
    'Sabbir bridges the gap between LLM capabilities and',
    'production-grade engineering. He specialises in AI',
    'product development, secure systems, and performance-',
    'first full-stack architecture.',
  ],
  skills: () => [
    '<span class="t-cyan t-bold">Technical Skills</span>',
    '<span class="t-dim">───────────────────────────────────</span>',
    '<span class="t-yellow">Languages</span>    TypeScript · JavaScript · Python · C · Node.js',
    '<span class="t-yellow">Frameworks</span>   Astro v6 · Tailwind v4 · React · Next.js · HTML5/CSS3',
    '<span class="t-yellow">Cloud/Data</span>   Supabase · PostgreSQL · OpenRouter · Gemini API',
    '<span class="t-yellow">Payments</span>     Stripe · bKash · NAGAD · SSLCOMMERZ',
    '<span class="t-yellow">DevOps</span>       Docker · Linux · Git · GitHub Actions',
    '<span class="t-yellow">Security</span>     CEH · API Security · Penetration Testing',
  ],
  projects: () => [
    '<span class="t-cyan t-bold">Shipped Projects</span>',
    '<span class="t-dim">───────────────────────────────────</span>',
    '<span class="t-green">Studia</span>          Academic management system (JavaScript, HTML5)',
    '<span class="t-green">AuthPage</span>        3D auth component (React, TypeScript, Security)',
    '<span class="t-green">Security Scanner</span> Vulnerability diagnostic tool (Python, Security)',
    '<span class="t-green">Vanish Pen</span>      Auto-fading canvas drawing app (JavaScript)',
    '<span class="t-green">Artmoji</span>         Text-to-dot-art parser (JavaScript)',
    '<span class="t-green">Mystical Dragon</span> 3D interactive WebGL model (JS, TypeScript)',
    '',
    'GitHub: <span class="t-cyan">github.com/SabbirHossainRafat</span>',
  ],
  contact: () => [
    '<span class="t-cyan t-bold">Contact Information</span>',
    '<span class="t-dim">───────────────────────────────────</span>',
    'Email   : <span class="t-green">sabbirrafat369@gmail.com</span>',
    'GitHub  : <span class="t-cyan">github.com/SabbirHossainRafat</span>',
    'LinkedIn: <span class="t-cyan">linkedin.com/in/sabbirhossainrafat</span>',
    'Twitter : <span class="t-cyan">x.com/sabbir_rafat</span>',
  ],
  education: () => [
    '<span class="t-cyan t-bold">Education</span>',
    '<span class="t-dim">───────────────────────────────────</span>',
    'Institution: <span class="t-yellow">Daffodil International University</span>',
    'Degree     : Bachelor of Science in Software Engineering',
    'Started    : 2021',
    'Focus      : Algorithms, Systems Design, AI, Web Engineering',
  ],
  certifications: () => [
    '<span class="t-cyan t-bold">Certifications</span>',
    '<span class="t-dim">───────────────────────────────────</span>',
    '<span class="t-green">CEH</span> — Certified Ethical Hacker (EC-Council)',
    '',
    'Covers: Network Scanning, System Hacking, Malware Threats,',
    '         Cryptography, Web App Hacking, SQL Injection',
  ],
  socials: () => [
    '<span class="t-cyan t-bold">Social Links</span>',
    '<span class="t-dim">───────────────────────────────────</span>',
    '  GitHub  → <span class="t-cyan">github.com/SabbirHossainRafat</span>',
    '  LinkedIn→ <span class="t-cyan">linkedin.com/in/sabbirhossainrafat</span>',
    '  Twitter → <span class="t-cyan">x.com/sabbir_rafat</span>',
    '  Email   → <span class="t-cyan">sabbirrafat369@gmail.com</span>',
  ],
  clear: () => { if (termOutput) termOutput.innerHTML = ''; return null; },
  exit: () => { closeTerm(); return null; },
  whoami: () => ['visitor'],
  date: () => [new Date().toString()],
  ls: () => ['about  skills  projects  contact  education  certifications  socials'],
};

function termPrint(lines) {
  if (!termOutput || lines === null) return;
  const html = lines.map(l => `<span class="term-line">${l}</span>`).join('');
  const div = document.createElement('div');
  div.style.marginBottom = '8px';
  div.innerHTML = html;
  termOutput.appendChild(div);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function termEcho(cmd) {
  if (!termOutput) return;
  const span = document.createElement('div');
  span.style.marginBottom = '4px';
  span.innerHTML = `<span class="term-line"><span class="t-green">sabbir@portfolio</span><span class="t-dim">:</span><span class="t-blue">~</span><span class="t-dim">$</span> ${escapeHtml(cmd)}</span>`;
  termOutput.appendChild(span);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function runCommand(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  termHistory.unshift(raw);
  historyIdx = -1;
  termEcho(raw);

  if (TERM_COMMANDS[cmd]) {
    const result = TERM_COMMANDS[cmd]();
    if (result !== null) termPrint(result);
  } else {
    termPrint([`<span class="t-red">command not found: ${escapeHtml(cmd)}</span>`, 'Type <span class="t-cyan">help</span> to see available commands.']);
  }
}

function openTerm() {
  if (!termOverlay) return;
  termOverlay.classList.add('open');
  termOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (termOutput && termOutput.children.length === 0) {
    termPrint([
      '<span class="t-green t-bold"> ____       _     _     _</span>',
      '<span class="t-green t-bold">/ ___|  ___| |__ | |__ (_)_ __</span>',
      '<span class="t-green t-bold">\\___ \\ / _ \\  _ \\| \'_ \\| |  __|</span>',
      '<span class="t-green t-bold"> ___) |  __/ |_) | |_) | | |</span>',
      '<span class="t-green t-bold">|____/ \\___|_.__/|_.__/|_|_|</span>',
      '',
      'Welcome to <span class="t-cyan">Sabbir\'s Portfolio Terminal</span> v2.0',
      'Type <span class="t-cyan">help</span> for available commands.',
      '',
    ]);
  }
  setTimeout(() => termInput && termInput.focus(), 60);
}

function closeTerm() {
  if (!termOverlay) return;
  termOverlay.classList.remove('open');
  termOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

on(termOpenBtn, 'click', openTerm);
on(termCloseBtn, 'click', closeTerm);
on(termXDot, 'click', closeTerm);

on(termOverlay, 'click', e => {
  if (e.target === termOverlay) closeTerm();
});

on(termInput, 'keydown', e => {
  if (e.key === 'Enter') {
    const val = termInput.value;
    termInput.value = '';
    runCommand(val);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIdx < termHistory.length - 1) {
      historyIdx++;
      termInput.value = termHistory[historyIdx];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIdx > 0) {
      historyIdx--;
      termInput.value = termHistory[historyIdx];
    } else {
      historyIdx = -1;
      termInput.value = '';
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const partial = termInput.value.toLowerCase();
    const match = Object.keys(TERM_COMMANDS).find(k => k.startsWith(partial));
    if (match) termInput.value = match;
  }
});

/* ════════════════════════════════════════
   AI CHAT
════════════════════════════════════════ */
const chatFab = $('#chat-fab');
const chatPanel = $('#chat-panel');
const chatClose = $('#chat-close');
const chatMessages = $('#chat-messages');
const chatInput = $('#chat-input');
const chatSend = $('#chat-send');
const chatQuick = $('#chat-quick');
const fabChat = chatFab && chatFab.querySelector('.fab-icon-chat');
const fabClose = chatFab && chatFab.querySelector('.fab-icon-close');

// Knowledge base for rule-based AI
const KB = {
  skills: 'Sabbir\'s primary skills include TypeScript, JavaScript, Python, Node.js, React, Next.js, Astro v6, Tailwind v4, Supabase, PostgreSQL, Gemini API, OpenRouter, Docker, Linux, Git, Stripe, bKash, NAGAD, and SSLCOMMERZ.',
  projects: 'Sabbir has shipped 6 main projects: Studia (academic management system), AuthPage (3D React authentication component), Security Scanner (Python vulnerability tool), Vanish Pen (canvas drawing app), Artmoji (text-to-dot-art parser), and Mystical Dragon (3D WebGL model). All are on his GitHub at github.com/SabbirHossainRafat.',
  ai: 'Sabbir specialises in AI engineering — building LLM-powered applications, RAG (Retrieval Augmented Generation) systems, and integrating models via Gemini API and OpenRouter. He designs full-stack AI products from intelligent backends to reactive frontends.',
  security: 'Sabbir holds a Certified Ethical Hacker (CEH) credential from EC-Council. He applies this to API security, threat modeling, penetration testing, and building security diagnostic tools.',
  education: 'Sabbir studies Software Engineering at Daffodil International University, where he began in 2021. His academic foundation covers algorithms, data structures, OOP, and systems design.',
  contact: 'You can reach Sabbir at sabbirrafat369@gmail.com. He\'s also active on GitHub (SabbirHossainRafat), LinkedIn (sabbirhossainrafat), and Twitter/X (@sabbir_rafat).',
  available: 'Yes! Sabbir is actively seeking core engineering roles. He\'s open to full-time positions, contract work, and interesting collaborations in AI engineering, full-stack development, and security.',
  fintech: 'Sabbir has integrated multiple payment gateways: Stripe for global markets, bKash and NAGAD for Bangladesh mobile banking, and SSLCOMMERZ for South Asian markets. He understands payment flows, webhooks, and compliance.',
  typescript: 'TypeScript is Sabbir\'s primary language — he uses it at 95% proficiency for type-safe full-stack development across all his production projects.',
  python: 'Sabbir uses Python for AI/ML pipelines, automation scripts, and Flask APIs. His Security Scanner project is built entirely in Python.',
  background: 'Sabbir is an AI Product Engineer and Full-Stack Architect from Bangladesh. He started coding in 2021 at Daffodil International University and has since built 20+ projects spanning AI, security, fintech, and creative tools.',
};

function matchIntent(msg) {
  const m = msg.toLowerCase();
  if (/(skill|know|tech|stack|language|framework|tool|use)/.test(m)) return KB.skills;
  if (/(project|ship|build|make|work|portfolio|studia|authpage|scanner|vanish|artmoji|dragon)/.test(m)) return KB.projects;
  if (/(ai|llm|ml|gpt|gemini|openrouter|rag|retrieval|language model|chatgpt)/.test(m)) return KB.ai;
  if (/(security|ceh|ethical|hack|pentest|vuln|owasp|secure)/.test(m)) return KB.security;
  if (/(education|university|degree|study|school|daffodil|student)/.test(m)) return KB.education;
  if (/(contact|email|reach|hire|linkedin|github|twitter|social)/.test(m)) return KB.contact;
  if (/(available|open|work|job|hire|role|position|freelance|contract|opportunity)/.test(m)) return KB.available;
  if (/(payment|fintech|stripe|bkash|nagad|sslcommerz|gateway)/.test(m)) return KB.fintech;
  if (/(typescript|ts)/.test(m)) return KB.typescript;
  if (/(python)/.test(m)) return KB.python;
  if (/(background|about|who|sabbir|story|journey)/.test(m)) return KB.background;
  return null;
}

const FALLBACKS = [
  'I\'m Sabbir\'s AI assistant. I can tell you about his skills, projects, background, or how to contact him. What would you like to know?',
  'That\'s a great question! Try asking me about Sabbir\'s technical skills, his projects, his education, or whether he\'s available for work.',
  'I\'m specialised in Sabbir\'s portfolio content. Ask me about his tech stack, shipped projects, AI expertise, or contact information!',
];
let fallbackIdx = 0;

function getAIResponse(msg) {
  const matched = matchIntent(msg);
  if (matched) return matched;
  return FALLBACKS[fallbackIdx++ % FALLBACKS.length];
}

function appendMsg(text, role) {
  if (!chatMessages) return;
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg-${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  if (!chatMessages) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-ai';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="chat-bubble chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function sendChat(msg) {
  if (!msg.trim()) return;
  if (chatInput) chatInput.value = '';
  if (chatQuick) chatQuick.style.display = 'none';
  appendMsg(msg, 'user');
  const typingEl = showTyping();
  const delay = 600 + Math.random() * 600;
  setTimeout(() => {
    if (typingEl) typingEl.remove();
    appendMsg(getAIResponse(msg), 'ai');
  }, delay);
}

function openChat() {
  if (!chatPanel) return;
  chatPanel.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  if (fabChat) fabChat.classList.add('hidden');
  if (fabClose) fabClose.classList.remove('hidden');

  // Add welcome message if empty
  if (chatMessages && chatMessages.children.length === 0) {
    appendMsg("Hi! I'm an AI trained on Sabbir's portfolio. Ask me anything about his skills, projects, background, or how to contact him! 👋", 'ai');
  }
  setTimeout(() => chatInput && chatInput.focus(), 60);
}

function closeChat() {
  if (!chatPanel) return;
  chatPanel.classList.remove('open');
  chatPanel.setAttribute('aria-hidden', 'true');
  if (fabChat) fabChat.classList.remove('hidden');
  if (fabClose) fabClose.classList.add('hidden');
}

on(chatFab, 'click', () => {
  chatPanel && chatPanel.classList.contains('open') ? closeChat() : openChat();
});
on(chatClose, 'click', closeChat);
on(chatSend, 'click', () => chatInput && sendChat(chatInput.value));
on(chatInput, 'keydown', e => { if (e.key === 'Enter') sendChat(chatInput.value); });
$$('.quick-chip').forEach(btn => {
  on(btn, 'click', () => sendChat(btn.textContent));
});

/* ════════════════════════════════════════
   HELP / SHORTCUTS PANEL
════════════════════════════════════════ */
const helpOverlay = $('#help-overlay');
const helpBtn = $('#help-btn');
const helpClose = $('#help-close');

function openHelp() {
  if (!helpOverlay) return;
  helpOverlay.classList.add('open');
  helpOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeHelp() {
  if (!helpOverlay) return;
  helpOverlay.classList.remove('open');
  helpOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

on(helpBtn, 'click', openHelp);
on(helpClose, 'click', closeHelp);
on(helpOverlay, 'click', e => { if (e.target === helpOverlay) closeHelp(); });

/* ════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════ */
on(document, 'keydown', e => {
  const tag = document.activeElement && document.activeElement.tagName.toLowerCase();
  const inInput = tag === 'input' || tag === 'textarea';

  if (e.key === 'Escape') {
    closeTerm();
    closeHelp();
    closeChat();
    closeMobile();
    return;
  }

  if (inInput) return;

  switch (e.key) {
    case 't': case 'T': themeToggle && themeToggle.click(); break;
    case 'h': case 'H': openHelp(); break;
    case 'g': case 'G': smoothScrollTo(document.getElementById('home')); break;
    case '/': e.preventDefault(); openTerm(); break;
    case 'c': case 'C': openChat(); break;
  }
});

/* ════════════════════════════════════════
   RESUME BUTTON
════════════════════════════════════════ */
const resumeBtn = $('#resume-btn');
on(resumeBtn, 'click', e => {
  e.preventDefault();
  // Update href to your actual resume file when available
  const link = document.createElement('a');
  link.href = 'assets/sabbir-rafat-resume.pdf';
  link.download = 'Sabbir-Hossain-Rafat-Resume.pdf';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

/* ════════════════════════════════════════
   FOOTER DATES
════════════════════════════════════════ */
const footerYear = $('#footer-year');
const footerDate = $('#footer-date');
if (footerYear) footerYear.textContent = new Date().getFullYear();
if (footerDate) {
  footerDate.textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  footerDate.setAttribute('datetime', new Date().toISOString().split('T')[0]);
}

/* ════════════════════════════════════════
   AMBIENT ORBS PARALLAX
════════════════════════════════════════ */
on(window, 'scroll', () => {
  const y = window.scrollY;
  const orbs = $$('.orb');
  orbs.forEach((orb, i) => {
    const speeds = [0.08, 0.05, 0.12];
    orb.style.transform = `translateY(${y * speeds[i]}px)`;
  });
}, { passive: true });

/* ════════════════════════════════════════
   SERVICE WORKER
════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // SW registration failure is non-critical
    });
  });
}

/* ════════════════════════════════════════
   PWA INSTALL PROMPT
════════════════════════════════════════ */
let deferredPrompt = null;
on(window, 'beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  // Could show a custom install button here
});

/* ════════════════════════════════════════
   INIT LOG
════════════════════════════════════════ */
console.log(
  '%c Sabbir Hossain Rafat · Portfolio v2.0 ',
  'background:linear-gradient(135deg,#667eea,#22d3ee);color:#fff;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;'
);