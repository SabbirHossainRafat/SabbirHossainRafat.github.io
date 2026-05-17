// =============================================
// SABBIR HOSSAIN RAFAT — Portfolio Script (JS)
// =============================================

// ── Theme ──
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const savedTheme = localStorage.getItem('theme');
const html = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

applyTheme(savedTheme || (prefersDark.matches ? 'dark' : 'light'));

const themeToggle = document.getElementById('theme-toggle');
themeToggle?.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Reading Progress Bar ──
const progressBar = document.getElementById('progress-bar');
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${Math.min((scrollTop / docHeight) * 100, 100)}%`;
}

// ── Custom Cursor ──
const cursorDot = document.getElementById('cursor-dot');
let mouseX = 0, mouseY = 0, dotX = 0, dotY = 0;

document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

(function animateCursor() {
  dotX += (mouseX - dotX) * 0.15;
  dotY += (mouseY - dotY) * 0.15;
  if (cursorDot) {
    cursorDot.style.left = `${dotX}px`;
    cursorDot.style.top = `${dotY}px`;
  }
  requestAnimationFrame(animateCursor);
})();

// ── Navbar ──
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('back-to-top');

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  let current = '';
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 120) current = section.getAttribute('id') || '';
  });
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

function onScroll() {
  const y = window.scrollY;
  navbar?.classList.toggle('scrolled', y > 50);
  backToTop?.classList.toggle('visible', y > 300);
  updateProgress();
  updateActiveNav();
}

window.addEventListener('scroll', onScroll, { passive: true });
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Mobile Menu ──
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger?.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu?.setAttribute('aria-hidden', String(!open));
});

document.querySelectorAll('.mobile-link').forEach((link) => {
  link.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 900) {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
  }
});

// ── Typing Animation ──
const phrases = ['AI Product Engineer', 'Full-Stack Developer', 'Secure AI Systems Builder'];
let phraseIdx = 0, charIdx = 0, deleting = false;
const typedEl = document.getElementById('typed-text');

function typeLoop() {
  if (!typedEl) return;
  const phrase = phrases[phraseIdx];
  if (!deleting) {
    typedEl.textContent = phrase.slice(0, ++charIdx);
    if (charIdx === phrase.length) { deleting = true; setTimeout(typeLoop, 2000); return; }
    setTimeout(typeLoop, 80);
  } else {
    typedEl.textContent = phrase.slice(0, --charIdx);
    if (charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; setTimeout(typeLoop, 400); return; }
    setTimeout(typeLoop, 45);
  }
}
setTimeout(typeLoop, 800);

// ── Reveal on Scroll ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('visible'), delay);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// ── 3D Tilt ──
document.querySelectorAll('.tilt-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const cx = rect.width / 2, cy = rect.height / 2;
    card.style.transform = `perspective(800px) rotateX(${((y - cy) / cy) * -6}deg) rotateY(${((x - cx) / cx) * 6}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ── Project Filters ──
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter || 'all';
    projectCards.forEach((card, i) => {
      const tags = (card.dataset.tags || '').toLowerCase();
      const matches = filter === 'all' || tags.includes(filter.toLowerCase());
      card.classList.toggle('hidden-card', !matches);
    });
  });
});

// ── Ripple Effect ──
document.querySelectorAll('.ripple').forEach((el) => {
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;width:${size}px;height:${size}px;margin-left:${-size/2}px;margin-top:${-size/2}px;`;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});

// ── Magnetic Buttons ──
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.08}px,${y * 0.08}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});

// ── Contact Form ──
const form = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');
const submitCheck = document.getElementById('submit-check');
const formError = document.getElementById('form-error');
const charCount = document.getElementById('char-count');
const messageInput = document.getElementById('form-message');

messageInput?.addEventListener('input', () => { charCount.textContent = String(messageInput.value.length); });

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('form-name').value.trim();
  const email = document.getElementById('form-email').value.trim();
  const message = messageInput.value.trim();

  formError.classList.add('hidden');

  if (!name) { showError('Please enter your name.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }
  if (message.length < 10) { showError('Message must be at least 10 characters.'); return; }

  setSubmitting(true);
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });
    if (res.ok) { setSuccess(); form.reset(); charCount.textContent = '0'; }
    else { const d = await res.json(); showError(d.error || 'Something went wrong.'); setSubmitting(false); }
  } catch {
    // Demo fallback — shows success without real backend
    setSuccess(); form.reset(); charCount.textContent = '0';
  }
  setTimeout(resetButton, 3000);
});

function showError(msg) { if (formError) { formError.textContent = msg; formError.classList.remove('hidden'); } }
function setSubmitting(s) { submitBtn.disabled = s; submitText.textContent = s ? 'Processing...' : 'Send Message'; submitSpinner?.classList.toggle('hidden', !s); submitCheck?.classList.add('hidden'); }
function setSuccess() { submitBtn.disabled = false; submitText.textContent = 'Sent!'; submitSpinner?.classList.add('hidden'); submitCheck?.classList.remove('hidden'); }
function resetButton() { submitText.textContent = 'Send Message'; submitCheck?.classList.add('hidden'); submitBtn.disabled = false; }

// ── Keyboard Shortcuts Panel ──
const shortcutsPanel = document.getElementById('shortcuts-panel');
const shortcutsClose = document.getElementById('shortcuts-close');
const shortcutsBackdrop = document.getElementById('shortcuts-backdrop');
const helpBtn = document.getElementById('help-btn');

const openShortcuts = () => { shortcutsPanel?.classList.add('open'); shortcutsPanel?.setAttribute('aria-hidden','false'); };
const closeShortcuts = () => { shortcutsPanel?.classList.remove('open'); shortcutsPanel?.setAttribute('aria-hidden','true'); };

helpBtn?.addEventListener('click', openShortcuts);
shortcutsClose?.addEventListener('click', closeShortcuts);
shortcutsBackdrop?.addEventListener('click', closeShortcuts);

document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  switch (e.key.toLowerCase()) {
    case 't': themeToggle?.click(); break;
    case 'h': shortcutsPanel?.classList.contains('open') ? closeShortcuts() : openShortcuts(); break;
    case 'g': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'escape':
      closeShortcuts();
      hamburger?.classList.remove('open'); mobileMenu?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded','false'); mobileMenu?.setAttribute('aria-hidden','true');
      break;
  }
});

// ── Footer Dates ──
const footerYear = document.getElementById('footer-year');
const footerDate = document.getElementById('footer-date');
if (footerYear) footerYear.textContent = String(new Date().getFullYear());
if (footerDate) footerDate.textContent = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

// ── Resume Button ──
document.getElementById('resume-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  alert('Add your resume PDF URL to the resume-btn href in index.html');
});

// ── Smooth Scroll ──
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

console.log('%c Sabbir Hossain Rafat · Portfolio v1.0 ', 'background:#667eea;color:white;padding:8px 16px;border-radius:6px;font-weight:700;');