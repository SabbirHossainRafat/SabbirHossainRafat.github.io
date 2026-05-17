// =============================================
// SABBIR HOSSAIN RAFAT — Portfolio Script
// TypeScript source (compiled to script.js)
// =============================================

// ── Types ──
interface RippleElement extends HTMLElement {
  getBoundingClientRect(): DOMRect;
}

// ── Theme ──
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const savedTheme = localStorage.getItem('theme');
const html = document.documentElement;

function applyTheme(theme: string): void {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

if (savedTheme) {
  applyTheme(savedTheme);
} else {
  applyTheme(prefersDark.matches ? 'dark' : 'light');
}

const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
themeToggle?.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Reading Progress Bar ──
const progressBar = document.getElementById('progress-bar') as HTMLElement;
function updateProgress(): void {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = Math.min((scrollTop / docHeight) * 100, 100);
  progressBar.style.width = `${progress}%`;
}

// ── Custom Cursor ──
const cursorDot = document.getElementById('cursor-dot') as HTMLElement;
let mouseX = 0, mouseY = 0;
let dotX = 0, dotY = 0;

function animateCursor(): void {
  dotX += (mouseX - dotX) * 0.15;
  dotY += (mouseY - dotY) * 0.15;
  cursorDot.style.left = `${dotX}px`;
  cursorDot.style.top = `${dotY}px`;
  requestAnimationFrame(animateCursor);
}

document.addEventListener('mousemove', (e: MouseEvent) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

animateCursor();

// ── Navbar Scroll ──
const navbar = document.getElementById('navbar') as HTMLElement;
const backToTop = document.getElementById('back-to-top') as HTMLButtonElement;

function onScroll(): void {
  const y = window.scrollY;

  // Navbar
  if (y > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Back to top
  if (y > 300) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }

  updateProgress();
  updateActiveNav();
}

window.addEventListener('scroll', onScroll, { passive: true });

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Active Nav Link ──
function updateActiveNav(): void {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  let current = '';
  sections.forEach((section) => {
    const el = section as HTMLElement;
    if (window.scrollY >= el.offsetTop - 120) {
      current = el.getAttribute('id') || '';
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

// ── Mobile Menu ──
const hamburger = document.getElementById('hamburger') as HTMLButtonElement;
const mobileMenu = document.getElementById('mobile-menu') as HTMLElement;

hamburger?.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu.setAttribute('aria-hidden', String(!open));
});

// Close on link click
document.querySelectorAll('.mobile-link').forEach((link) => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

// Close on resize
window.addEventListener('resize', () => {
  if (window.innerWidth >= 900) {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
});

// ── Typing Animation ──
const phrases = ['AI Product Engineer', 'Full-Stack Developer', 'Secure AI Systems Builder'];
let phraseIdx = 0;
let charIdx = 0;
let deleting = false;
const typedEl = document.getElementById('typed-text') as HTMLElement;

function typeLoop(): void {
  if (!typedEl) return;
  const phrase = phrases[phraseIdx];

  if (!deleting) {
    typedEl.textContent = phrase.slice(0, ++charIdx);
    if (charIdx === phrase.length) {
      deleting = true;
      setTimeout(typeLoop, 2000);
      return;
    }
    setTimeout(typeLoop, 80);
  } else {
    typedEl.textContent = phrase.slice(0, --charIdx);
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      setTimeout(typeLoop, 400);
      return;
    }
    setTimeout(typeLoop, 45);
  }
}

setTimeout(typeLoop, 800);

// ── Reveal on Scroll ──
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => el.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealEls.forEach((el) => observer.observe(el));

// ── 3D Tilt on Cards ──
document.querySelectorAll('.tilt-card').forEach((card) => {
  const el = card as HTMLElement;

  el.addEventListener('mousemove', (e: Event) => {
    const event = e as MouseEvent;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -6;
    const rotY = ((x - cx) / cx) * 6;
    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  });

  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});

// ── Project Filtering ──
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = (btn as HTMLElement).dataset.filter || 'all';

    projectCards.forEach((card, i) => {
      const el = card as HTMLElement;
      const tags = (el.dataset.tags || '').toLowerCase();
      const matches = filter === 'all' || tags.includes(filter.toLowerCase());

      if (matches) {
        el.classList.remove('hidden-card');
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = '';
        }, i * 50);
      } else {
        el.classList.add('hidden-card');
      }
    });
  });
});

// ── Ripple Effect ──
document.querySelectorAll('.ripple').forEach((el) => {
  el.addEventListener('click', (e: Event) => {
    const event = e as MouseEvent;
    const btn = el as RippleElement;
    const rect = btn.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height) * 2}px`;
    ripple.style.marginLeft = ripple.style.marginTop = `${-Math.max(rect.width, rect.height)}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});

// ── Magnetic Button Effect ──
document.querySelectorAll('.btn').forEach((btn) => {
  const el = btn as HTMLElement;

  el.addEventListener('mousemove', (e: Event) => {
    const event = e as MouseEvent;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });

  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});

// ── Contact Form ──
const form = document.getElementById('contact-form') as HTMLFormElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const submitText = document.getElementById('submit-text') as HTMLElement;
const submitSpinner = document.getElementById('submit-spinner') as HTMLElement;
const submitCheck = document.getElementById('submit-check') as HTMLElement;
const formError = document.getElementById('form-error') as HTMLElement;
const charCount = document.getElementById('char-count') as HTMLElement;
const messageInput = document.getElementById('form-message') as HTMLTextAreaElement;

messageInput?.addEventListener('input', () => {
  charCount.textContent = String(messageInput.value.length);
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = (document.getElementById('form-name') as HTMLInputElement).value.trim();
  const email = (document.getElementById('form-email') as HTMLInputElement).value.trim();
  const message = messageInput.value.trim();

  formError.classList.add('hidden');
  formError.textContent = '';

  // Validate
  if (!name) { showError('Please enter your name.'); return; }
  if (!isValidEmail(email)) { showError('Please enter a valid email address.'); return; }
  if (message.length < 10) { showError('Message must be at least 10 characters.'); return; }

  // Submit state
  setSubmitting(true);

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });

    if (res.ok) {
      setSuccess();
      form.reset();
      charCount.textContent = '0';
      setTimeout(() => resetButton(), 3000);
    } else {
      const data = await res.json();
      showError(data.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  } catch {
    // Fallback for demo / no backend
    setSuccess();
    form.reset();
    charCount.textContent = '0';
    setTimeout(() => resetButton(), 3000);
  }
});

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(msg: string): void {
  formError.textContent = msg;
  formError.classList.remove('hidden');
}

function setSubmitting(state: boolean): void {
  submitBtn.disabled = state;
  submitText.textContent = state ? 'Processing...' : 'Send Message';
  submitSpinner.classList.toggle('hidden', !state);
  submitCheck.classList.add('hidden');
}

function setSuccess(): void {
  submitBtn.disabled = false;
  submitText.textContent = 'Sent!';
  submitSpinner.classList.add('hidden');
  submitCheck.classList.remove('hidden');
}

function resetButton(): void {
  submitText.textContent = 'Send Message';
  submitCheck.classList.add('hidden');
  submitBtn.disabled = false;
}

// ── Keyboard Shortcuts Panel ──
const shortcutsPanel = document.getElementById('shortcuts-panel') as HTMLElement;
const shortcutsClose = document.getElementById('shortcuts-close') as HTMLButtonElement;
const shortcutsBackdrop = document.getElementById('shortcuts-backdrop') as HTMLElement;
const helpBtn = document.getElementById('help-btn') as HTMLButtonElement;

function openShortcuts(): void {
  shortcutsPanel.classList.add('open');
  shortcutsPanel.setAttribute('aria-hidden', 'false');
}

function closeShortcuts(): void {
  shortcutsPanel.classList.remove('open');
  shortcutsPanel.setAttribute('aria-hidden', 'true');
}

helpBtn?.addEventListener('click', openShortcuts);
shortcutsClose?.addEventListener('click', closeShortcuts);
shortcutsBackdrop?.addEventListener('click', closeShortcuts);

// ── Keyboard Shortcuts ──
document.addEventListener('keydown', (e: KeyboardEvent) => {
  // Skip when typing in input
  const tag = (e.target as HTMLElement).tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  switch (e.key.toLowerCase()) {
    case 't':
      themeToggle?.click();
      break;
    case 'h':
      if (shortcutsPanel.classList.contains('open')) {
        closeShortcuts();
      } else {
        openShortcuts();
      }
      break;
    case 'g':
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'escape':
      closeShortcuts();
      if (mobileMenu.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
      break;
  }
});

// ── Footer Dates ──
const footerYear = document.getElementById('footer-year') as HTMLElement;
const footerDate = document.getElementById('footer-date') as HTMLElement;

if (footerYear) footerYear.textContent = String(new Date().getFullYear());
if (footerDate) {
  footerDate.textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Resume Button ──
const resumeBtn = document.getElementById('resume-btn') as HTMLAnchorElement;
resumeBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  // Replace with actual resume URL
  const msg = 'Resume download link — update src/assets/resume.pdf with your actual file.';
  console.info(msg);
  alert('Resume link — add your PDF URL to the resume-btn href in index.html');
});

// ── Smooth scroll for all anchor links ──
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e: Event) => {
    const href = (anchor as HTMLAnchorElement).getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

console.log('%c Sabbir Hossain Rafat — Portfolio v1.0 ', 'background:#667eea;color:white;padding:8px 16px;border-radius:6px;font-size:14px;');