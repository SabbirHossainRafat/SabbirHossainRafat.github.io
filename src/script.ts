/* ==========================================================================
   TYPESCRIPT TYPED SCHEMAS DEFINITIONS
   ========================================================================== */

interface ProjectDataStructure {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    github: string;
    patternClass: string;
}

interface PipelineSubmissionPackage {
    name: string;
    email: string;
    message: string;
}

/* ==========================================================================
   STATIC PORTFOLIO DATA HUB
   ========================================================================== */

const PORTFOLIO_REPOSITORIES: ProjectDataStructure[] = [
    {
        id: "studia",
        title: "Studia",
        description: "Advanced academic ecosystem featuring a highly organized course library, integrated task management loops, and a structured Mind Vault note management system.",
        technologies: ["JavaScript", "HTML5 Nodes"],
        github: "https://github.com/SabbirHossainRafat/studia-academic-hub",
        patternClass: "pattern-mesh"
    },
    {
        id: "authpage",
        title: "AuthPage",
        description: "Production-ready, ultra-secure authentication component executing premium 3D flip layer states paired with auto-submitting OTP terminal hooks.",
        technologies: ["React", "TypeScript", "Security"],
        github: "https://github.com/SabbirHossainRafat/authpage-3d",
        patternClass: "pattern-ring-node"
    },
    {
        id: "security-scanner",
        title: "Security Scanner",
        description: "Defensive utility crafted to compute global safety diagnostics, executing real-time phishing tracking, multi-vendor WHOIS checks, and granular DNS path lookups.",
        technologies: ["Python", "Security"],
        github: "https://github.com/SabbirHossainRafat/security-scanner",
        patternClass: "pattern-bars"
    },
    {
        id: "vanish-pen",
        title: "Vanish Pen",
        description: "Interactive canvas drawing interface outputting luminous pixel paths that dynamically and uniformly fade out exactly after a 5-second interval.",
        technologies: ["JavaScript"],
        github: "https://github.com/SabbirHossainRafat/vanish-pen-canvas",
        patternClass: "pattern-cross"
    },
    {
        id: "artmoji",
        title: "Artmoji",
        description: "Text-to-graphics parser layout rendering system engineered to construct customizable character configurations and complex dot-art matrices instantly.",
        technologies: ["JavaScript"],
        github: "https://github.com/SabbirHossainRafat/artmoji-parser",
        patternClass: "pattern-dots"
    },
    {
        id: "mystical-dragon",
        title: "Mystical Dragon",
        description: "Immersive, cursor-responsive structural interaction system built with an underlying CLI panel to control model velocity, colors, and global scaling.",
        technologies: ["JavaScript", "TypeScript"],
        github: "https://github.com/SabbirHossainRafat/mystical-dragon-cli",
        patternClass: "pattern-diamonds"
    }
];

/* ==========================================================================
   PRINCIPAL APPLICATION CONTROLLER SUBSYSTEM
   ========================================================================== */

class ApplicationCoreContext {
    private menuToggle: HTMLButtonElement | null = null;
    private navMenu: HTMLElement | null = null;
    private copyrightYear: HTMLElement | null = null;
    private lastUpdatedNode: HTMLElement | null = null;
    private backToTop: HTMLButtonElement | null = null;
    private contactForm: HTMLFormElement | null = null;
    private formFeedback: HTMLDivElement | null = null;
    private submitBtn: HTMLButtonElement | null = null;
    private themeToggleBtn: HTMLButtonElement | null = null;
    private projectsGrid: HTMLElement | null = null;
    private shortcutsOverlay: HTMLDivElement | null = null;
    private portalTooltip: HTMLDivElement | null = null;

    constructor() {
        this.gatherDOMReferences();
        this.bindSystemEventPipelines();
        this.compileProjectsMatrix("All");
        this.runStructuralTypingEngine();
        this.deployIntersectionObservers();
        this.processAvatarResourceStream();
    }

    private gatherDOMReferences(): void {
        this.menuToggle = document.getElementById('menuToggle') as HTMLButtonElement;
        this.navMenu = document.getElementById('navMenu');
        this.copyrightYear = document.getElementById('copyrightYear');
        this.lastUpdatedNode = document.getElementById('lastUpdated');
        this.backToTop = document.getElementById('backToTop') as HTMLButtonElement;
        this.contactForm = document.getElementById('contactForm') as HTMLFormElement;
        this.formFeedback = document.getElementById('formFeedback') as HTMLDivElement;
        this.submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
        this.themeToggleBtn = document.getElementById('themeToggleBtn') as HTMLButtonElement;
        this.projectsGrid = document.getElementById('projectsGridWrapper');
        this.shortcutsOverlay = document.getElementById('shortcutsOverlay') as HTMLDivElement;
        this.portalTooltip = document.getElementById('portal-global-tooltip') as HTMLDivElement;
    }

    private bindSystemEventPipelines(): void {
        // Theme UI Preference Memory Checks (Feature 1)
        const cachedThemePreference = localStorage.getItem('sabbir-portfolio-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', cachedThemePreference);
        this.updateThemeToggleAccessibilityAttrs(cachedThemePreference);

        this.themeToggleBtn?.addEventListener('click', () => this.toggleApplicationThemeLayer());

        // Mobile Panel Toggle Routing Controls
        this.menuToggle?.addEventListener('click', () => {
            const openState = this.navMenu?.classList.toggle('active');
            this.menuToggle?.setAttribute('aria-expanded', String(openState));
            this.menuToggle?.classList.toggle('active');
        });

        // Event-Delegated Categorized Query Controls Filtering Selection (Feature 2)
        const controlsContainer = document.getElementById('filterControls');
        controlsContainer?.addEventListener('click', (e: Event) => {
            const activeTarget = e.target as HTMLButtonElement;
            if (!activeTarget.classList.contains('filter-btn')) return;

            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            activeTarget.classList.add('active');
            
            const selectedCategory = activeTarget.getAttribute('data-filter') || 'All';
            this.compileProjectsMatrix(selectedCategory);
        });

        // Programmatic Focus Interaction Floating Label State Injections (Bug 2 Fix)
        document.querySelectorAll('.floating-input').forEach(element => {
            const inputField = element as HTMLInputElement | HTMLTextAreaElement;
            
            const evaluateInputState = () => {
                const parentGroup = inputField.parentElement;
                if (inputField.value.trim() !== "") {
                    parentGroup?.classList.add('has-value');
                } else {
                    parentGroup?.classList.remove('has-value');
                }
            };

            inputField.addEventListener('input', evaluateInputState);
            inputField.addEventListener('blur', evaluateInputState);
            // Account for pre-filled browser states
            setTimeout(evaluateInputState, 300);
        });

        // Dynamic Message Character Counter Tracker (Bug 2 Addition)
        const messageBox = document.getElementById('formMessage') as HTMLTextAreaElement;
        const countDisplay = document.getElementById('charCount');
        messageBox?.addEventListener('input', () => {
            if (countDisplay) countDisplay.textContent = String(messageBox.value.length);
        });

        // Global Command Line Shortcuts Router (Bug 4 Fix)
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if ((e.key === 'h' || e.key === '?') && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.shortcutsOverlay?.classList.add('active');
                this.shortcutsOverlay?.setAttribute('aria-hidden', 'false');
            }
            if (e.key === 'Escape') {
                this.shortcutsOverlay?.classList.remove('active');
                this.shortcutsOverlay?.setAttribute('aria-hidden', 'true');
                this.navMenu?.classList.remove('active');
                this.menuToggle?.classList.remove('active');
                this.menuToggle?.setAttribute('aria-expanded', 'false');
            }
            if (e.key === 'g' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        document.getElementById('closeShortcutsBtn')?.addEventListener('click', () => {
            this.shortcutsOverlay?.classList.remove('active');
            this.shortcutsOverlay?.setAttribute('aria-hidden', 'true');
        });

        // Scroll Tracking Interface Handlers Layer 
        window.addEventListener('scroll', () => {
            const scrollDistance = window.scrollY;
            const fullHeight = document.documentElement.scrollHeight - window.innerHeight;
            
            if (this.readingProgress && fullHeight > 0) {
                this.readingProgress.style.width = `${(scrollDistance / fullHeight) * 100}%`;
            }

            if (this.backToTop) {
                if (scrollDistance > 300) {
                    this.backToTop.classList.add('visible');
                } else {
                    this.backToTop.classList.remove('visible');
                }
            }
        }, { passive: true });

        this.backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        // Interactive Target Micro-Interactions Ripple Engine Implementation
        document.body.addEventListener('click', (e: MouseEvent) => {
            const interactiveNode = (e.target as HTMLElement).closest('.ripple-target');
            if (!interactiveNode) return;

            const trackingData = (interactiveNode as HTMLElement).getAttribute('data-analytics');
            if (trackingData) console.log(`[ANALYTICS SYSTEM HANDSHAKE]: Action Node -> ${trackingData}`);

            const rectBounds = interactiveNode.getBoundingClientRect();
            const rippleSpan = document.createElement('span');
            const circumference = Math.max(interactiveNode.clientWidth, interactiveNode.clientHeight);
            
            rippleSpan.style.width = rippleSpan.style.height = `${circumference}px`;
            rippleSpan.style.left = `${e.clientX - rectBounds.left - circumference / 2}px`;
            rippleSpan.style.top = `${e.clientY - rectBounds.top - circumference / 2}px`;
            rippleSpan.classList.add('button-ripple-element');

            interactiveNode.querySelector('.button-ripple-element')?.remove();
            interactiveNode.appendChild(rippleSpan);
        });

        // Static Target Explicit Structural Component Scroll Scopes Actions Linking
        document.getElementById('heroViewProjects')?.addEventListener('click', () => {
            document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
        });
        document.getElementById('heroInitializeContact')?.addEventListener('click', () => {
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        });
        document.getElementById('resumeBtn')?.addEventListener('click', () => {
            console.log('[TELEMETRY RESUME PIPELINE]: Target initialized acquisition query.');
            alert('Sabbir\'s professional secure resume document is undergoing validation compilation updates.');
        });

        // Unified Universal Portal Hover Tooltips Controller Pipeline (Bug 12 Fix)
        document.body.addEventListener('mouseover', (e: MouseEvent) => {
            const tooltippedEl = (e.target as HTMLElement).closest('[data-tooltip]');
            if (!tooltippedEl || !this.portalTooltip) return;

            const messageString = tooltippedEl.getAttribute('data-tooltip') || '';
            this.portalTooltip.textContent = messageString;
            this.portalTooltip.classList.add('visible');

            const moveTooltip = (moveEvent: MouseEvent) => {
                if (this.portalTooltip) {
                    this.portalTooltip.style.left = `${moveEvent.clientX}px`;
                    this.customCursor ? this.portalTooltip.style.top = `${moveEvent.clientY - 15}px` : this.portalTooltip.style.top = `${moveEvent.clientY}px`;
                }
            };

            tooltippedEl.addEventListener('mousemove', moveTooltip as EventListener);
            tooltippedEl.addEventListener('mouseleave', () => {
                this.portalTooltip?.classList.remove('visible');
                tooltippedEl.removeEventListener('mousemove', moveTooltip as EventListener);
            }, { once: true });
        });

        // Dynamic System Time Stamp Format Synchronization Verification (Bug 13 Fix)
        if (this.copyrightYear) this.copyrightYear.textContent = String(new Date().getFullYear());
        if (this.lastUpdatedNode) {
            this.lastUpdatedNode.textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }

        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e: Event) => this.transmitContactHandshake(e));
        }

        // Hardware Concurrency Context Performance Custom Fine Pointer Initialization (Bug 8 Fix)
        const processingThreads = navigator.hardwareConcurrency || 2;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (this.customCursor && window.matchMedia('(pointer: fine)').matches && processingThreads >= 2 && !prefersReducedMotion) {
            window.addEventListener('mousemove', (e: MouseEvent) => {
                if (this.customCursor) {
                    this.customCursor.style.left = `${e.clientX}px`;
                    this.customCursor.style.top = `${e.clientY}px`;
                    this.customCursor.style.opacity = '1';
                }
            }, { passive: true });
        }

        // Contextual Smooth Anchor Scroller Menus Navigation Closures
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e: Event) => {
                const targetHash = (link as HTMLAnchorElement).getAttribute('href');
                if (targetHash && targetHash.startsWith('#')) {
                    e.preventDefault();
                    document.querySelector(targetHash)?.scrollIntoView({ behavior: 'smooth' });
                    this.navMenu?.classList.remove('active');
                    this.menuToggle?.classList.remove('active');
                    this.menuToggle?.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    private toggleApplicationThemeLayer(): void {
        const structuralCurrentState = document.documentElement.getAttribute('data-theme');
        const targetTheme = structuralCurrentState === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('sabbir-portfolio-theme', targetTheme);
        this.updateThemeToggleAccessibilityAttrs(targetTheme);
    }

    private updateThemeToggleAccessibilityAttrs(currentTheme: string): void {
        if (this.themeToggleBtn) {
            this.themeToggleBtn.setAttribute('aria-pressed', String(currentTheme === 'light'));
            const descriptiveLabel = currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
            this.themeToggleBtn.setAttribute('data-tooltip', descriptiveLabel);
        }
    }

    private runStructuralTypingEngine(): void {
        const element = document.getElementById('typing-subtitle');
        if (!element) return;

        const concepts = ['AI Product Engineer', 'Full-Stack Developer', 'Secure AI Systems Builder'];
        let conceptIndex = 0; let charIndex = 0; let retracting = false;
        const cursorNode = document.createElement('span');
        cursorNode.classList.add('typing-cursor');

        const tickLoop = () => {
            const fullString = concepts[conceptIndex];
            if (retracting) {
                element.textContent = fullString.substring(0, charIndex - 1);
                charIndex--;
            } else {
                element.textContent = fullString.substring(0, charIndex + 1);
                charIndex++;
            }
            element.appendChild(cursorNode);

            let calculatedPace = retracting ? 40 : 75;
            if (!retracting && charIndex === fullString.length) {
                calculatedPace = 2000; retracting = true;
            } else if (retracting && charIndex === 0) {
                retracting = false;
                conceptIndex = (conceptIndex + 1) % concepts.length;
                calculatedPace = 450;
            }
            setTimeout(tickLoop, calculatedPace);
        };
        setTimeout(tickLoop, 1000);
    }

    private compileProjectsMatrix(filterCategory: string): void {
        if (!this.projectsGrid) return;
        this.projectsGrid.innerHTML = '';

        // Filter calculation processing mapping matching rules (Feature 2)
        const criteriaMatchedPool = PORTFOLIO_REPOSITORIES.filter(project => {
            if (filterCategory === "All") return true;
            if (filterCategory === "Security") return project.technologies.includes("Security");
            return project.technologies.includes(filterCategory);
        });

        criteriaMatchedPool.forEach(project => {
            const articleContainer = document.createElement('div');
            articleContainer.className = 'project-card-wrapper fade-in-node';
            
            articleContainer.innerHTML = `
                <article class="glass-card project-card">
                    <div class="project-visual ${project.patternClass} lazy-pattern pattern-active">
                        <div class="project-visual-centering-subnode"></div>
                        <div class="visual-overlay"></div>
                        <div class="view-code-overlay"><span>View Code</span></div>
                    </div>
                    <div class="project-info">
                        <h3>${project.title}</h3>
                        <p class="project-text">${project.description}</p>
                        <div class="project-tech">
                            ${project.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                        </div>
                        <div class="project-links">
                            <button class="btn btn-secondary btn-project code-base-trigger-node click-scale-target" data-target-url="${project.github}">
                                Code Base ↗
                            </button>
                        </div>
                    </div>
                </article>
            `;

            // Professional Standard Structural Button Click Handling Remapping
            articleContainer.querySelector('.code-base-trigger-node')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const remoteRepositoryEndpoint = (e.currentTarget as HTMLButtonElement).getAttribute('data-target-url');
                if (remoteRepositoryEndpoint) window.open(remoteRepositoryEndpoint, '_blank', 'noopener noreferrer');
            });

            this.projectsGrid?.appendChild(articleContainer);
        });
    }

    private deployIntersectionObservers(): void {
        const prefersReducedMotionSetting = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotionSetting) {
            document.querySelectorAll('.section-reveal-node').forEach(n => n.classList.add('revealed'));
            return;
        }

        // Section entry viewport structural observers setup configuration (Feature 3)
        const viewportObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    viewportObserver.unobserve(entry.target);
                }
            });
        }, { root: null, rootMargin: '0px 0px -100px 0px', threshold: 0.02 });

        document.querySelectorAll('.section-reveal-node').forEach(node => viewportObserver.observe(node));

        // Anchor navigation high-precision spatial positioning observer sync loops
        const navigationalSpatialObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const activeSectionId = entry.target.getAttribute('id');
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${activeSectionId}`) link.classList.add('active');
                    });
                }
            });
        }, { root: null, rootMargin: '-30% 0px -50% 0px', threshold: 0 });

        document.querySelectorAll('section[id]').forEach(s => navigationalSpatialObserver.observe(s));
    }

    private processAvatarPerformanceThrottleFallback(imgElement: HTMLImageElement, skeletonElement: HTMLElement | null): void {
        // Sandboxed deadline safety timeout guard protection (Bug 10 Fix)
        const crashDeadlineTimeout = window.setTimeout(() => {
            if (skeletonElement && !skeletonElement.classList.contains('hidden')) {
                skeletonElement.classList.add('hidden');
                console.warn('[INFRASTRUCTURE FALLBACK]: Target avatar network timeout deadline constraint reached.');
            }
        }, 5000);

        imgElement.addEventListener('load', () => {
            window.clearTimeout(crashDeadlineTimeout);
            skeletonElement?.classList.add('hidden');
            imgElement.classList.remove('hidden');
        });
    }

    private processAvatarResourceStream(): void {
        const skeleton = document.getElementById('avatar-skeleton');
        const img = document.getElementById('avatar-image') as HTMLImageElement | null;
        if (!img) return;

        img.src = img.getAttribute('data-src') || '';
        this.processAvatarPerformanceThrottleFallback(img, skeleton);
    }

    private initializeTiltMechanics(targetElement: HTMLElement, event: MouseEvent): void {
        // High-performance micro-throttled desktop interactive tilt math mechanics handler (Bug 9 Fix)
        if (window.innerWidth <= 768) return;
        
        const bounds = targetElement.getBoundingClientRect();
        const pointerX = event.clientX - bounds.left;
        const pointerY = event.clientY - bounds.top;
        
        const rotateAxisX = (bounds.height / 2 - pointerY) / 12;
        const rotateAxisY = (pointerX - bounds.width / 2) / 12;
        
        window.requestAnimationFrame(() => {
            targetElement.style.transform = `perspective(1000px) rotateX(${rotateAxisX}deg) rotateY(${rotateAxisY}deg)`;
        });
    }

    private initializeTiltEngineReset(targetElement: HTMLElement): void {
        window.requestAnimationFrame(() => {
            targetElement.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }

    private initializeTiltMechanics(): void {
        if (window.innerWidth <= 768) return;
        
        document.body.addEventListener('mousemove', (e: MouseEvent) => {
            const cardNode = (e.target as HTMLElement).closest('[data-tilt]') as HTMLElement;
            if (!cardNode) return;
            this.initializeTiltMechanics(cardNode, e);
        });

        document.body.addEventListener('mouseout', (e: MouseEvent) => {
            const cardNode = (e.target as HTMLElement).closest('[data-tilt]') as HTMLElement;
            if (!cardNode) return;
            this.initializeTiltEngineReset(cardNode);
        });
    }

    private async transmitContactHandshake(e: Event): Promise<void> {
        e.preventDefault();
        if (!this.contactForm || !this.formFeedback || !this.submitBtn) return;

        const infoNode = this.formFeedback;
        const button = this.submitBtn;
        const labelText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.btn-spinner');
        const successCheck = button.querySelector('.btn-success-icon');

        const inputName = document.getElementById('formName') as HTMLInputElement;
        const inputEmail = document.getElementById('formEmail') as HTMLInputElement;
        const inputMsg = document.getElementById('formMessage') as HTMLTextAreaElement;

        const dataPackage: PipelineSubmissionPackage = {
            name: inputName.value.trim(),
            email: inputEmail.value.trim(),
            message: inputMsg.value.trim()
        };

        if (!dataPackage.name || !dataPackage.email || !dataPackage.message) {
            infoNode.textContent = 'All fields are required for access handshake verification transmission.';
            infoNode.className = 'form-feedback error';
            return;
        }

        const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!validEmailRegex.test(dataPackage.email)) {
            infoNode.textContent = 'Malformed identity verification bounds compiled.';
            infoNode.className = 'form-feedback error';
            return;
        }

        // Set Loading State Requirements (Button Upgrades Matrix)
        button.disabled = true;
        labelText?.classList.add('hidden');
        spinner?.classList.remove('hidden');
        infoNode.textContent = 'Transmitting handshake metrics configuration package...';
        infoNode.className = 'form-feedback';

        // Read environment variables fallback targets gracefully (Bug 5 Fix)
        const runtimeAPIEndpoint = (import.meta as any).env?.VITE_API_ENDPOINT || 'http://localhost:5000/api/contact';

        try {
            const response = await fetch(runtimeAPIEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPackage)
            });

            if (!response.ok) throw new Error(`HTTP transaction server error status returned: ${response.status}`);
            const payloadResolution = await response.json();

            if (payloadResolution.status === 'success') {
                // Set Success State Requirements (Button Upgrades Matrix)
                spinner?.classList.add('hidden');
                successCheck?.classList.remove('hidden');
                infoNode.textContent = 'Handshake accepted. Secure data transmission successfully logged.';
                infoNode.className = 'form-feedback success';
                this.contactForm.reset();
                
                setTimeout(() => {
                    successCheck?.classList.add('hidden');
                    labelText?.classList.remove('hidden');
                    infoNode.textContent = '';
                    infoNode.className = 'form-feedback';
                }, 2000);

            } else {
                throw new Error(payloadResolution.message || 'Infrastructure communication transaction validation error.');
            }
        } catch (error: unknown) {
            const instanceError = error as Error;
            spinner?.add('hidden');
            labelText?.remove('hidden');
            infoNode.textContent = `Transmission Interface Exception: ${instanceError.message}`;
            infoNode.className = 'form-feedback error';
        } finally {
            button.disabled = false;
        }
    }
}

// System initialization bootstrap activation
new ApplicationCoreContext();