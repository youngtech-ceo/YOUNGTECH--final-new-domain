// Using Firebase global compat scripts loaded via HTML
const firebaseConfig = {
    apiKey: "AIzaSyCUwsvNGxWj98aMkuzFHXwBRl91xLbacwY",
    authDomain: "yt-web-58043.firebaseapp.com",
    databaseURL: "https://yt-web-58043-default-rtdb.firebaseio.com",
    projectId: "yt-web-58043",
    storageBucket: "yt-web-58043.firebasestorage.app",
    messagingSenderId: "32116509565",
    appId: "1:32116509565:web:143feab9e000dcabf81a14",
    measurementId: "G-Z6VT7XHZPD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    // Cyber-Security Escapement & Throttler Utilities
    function sanitizeInput(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[<>]/g, tag => {
            const repl = { '<': '&lt;', '>': '&gt;' };
            return repl[tag] || tag;
        });
    }

    function isRateLimited(formName) {
        const maxRequests = 3;
        const timeframeMs = 5 * 60 * 1000; // 5 minutes
        const now = Date.now();
        const storageKey = `rate_limit_${formName}`;
        
        let submissions = [];
        try {
            submissions = JSON.parse(localStorage.getItem(storageKey)) || [];
        } catch (e) {
            submissions = [];
        }
        
        submissions = submissions.filter(time => now - time < timeframeMs);
        
        if (submissions.length >= maxRequests) {
            return true;
        }
        
        submissions.push(now);
        localStorage.setItem(storageKey, JSON.stringify(submissions));
        return false;
    }

    function getCooldownTimeRemaining(formName) {
        const timeframeMs = 5 * 60 * 1000;
        const now = Date.now();
        const storageKey = `rate_limit_${formName}`;
        let submissions = [];
        try {
            submissions = JSON.parse(localStorage.getItem(storageKey)) || [];
        } catch (e) {
            return 0;
        }
        submissions = submissions.filter(time => now - time < timeframeMs);
        if (submissions.length === 0) return 0;
        const oldestSub = submissions[0];
        const remainingMs = timeframeMs - (now - oldestSub);
        return Math.max(0, Math.ceil(remainingMs / 1000));
    }

    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // ==========================================
    // 1. LIGHT & DARK THEME SWITCHER LOGIC
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Read stored theme or fallback to device media settings
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Set initial theme
    htmlElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        const icon = themeToggleBtn.querySelector('i');
        if (icon) {
            if (theme === 'dark') {
                icon.setAttribute('data-lucide', 'sun');
            } else {
                icon.setAttribute('data-lucide', 'moon');
            }
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    // ==========================================
    // 2. LIGHTWEIGHT CANVAS-BASED HERO PARTICLES
    // ==========================================
    const particlesContainer = document.getElementById('hero-particles');
    if (particlesContainer) {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        particlesContainer.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let width = canvas.width = particlesContainer.offsetWidth;
        let height = canvas.height = particlesContainer.offsetHeight;

        window.addEventListener('resize', () => {
            if (!particlesContainer) return;
            width = canvas.width = particlesContainer.offsetWidth;
            height = canvas.height = particlesContainer.offsetHeight;
        });

        const particles = [];
        const maxParticles = 60;

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
                this.alpha = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                    this.reset();
                }
            }
            draw() {
                const currentTheme = htmlElement.getAttribute('data-theme');
                // Glow colors adapting to active theme
                const particleColor = currentTheme === 'dark' ? 'rgba(99, 102, 241,' : 'rgba(37, 99, 235,';
                ctx.fillStyle = particleColor + this.alpha + ')';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, width, height);
            
            // Draw connections
            ctx.strokeStyle = htmlElement.getAttribute('data-theme') === 'dark' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(37, 99, 235, 0.04)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // ==========================================
    // 3. STATS COUNT-UP TICKER ANIMATION
    // ==========================================
    const metricNumbers = document.querySelectorAll('.metric-number[data-target]');
    let countersActive = false;

    const scrollObserverOptions = {
        threshold: 0.1
    };

    const countUpObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersActive) {
                countersActive = true;
                metricNumbers.forEach(num => {
                    const target = parseInt(num.getAttribute('data-target'));
                    let current = 0;
                    const duration = 2000; // 2 seconds
                    const step = Math.ceil(target / (duration / 16)); // ~60fps
                    
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            num.textContent = target;
                            clearInterval(timer);
                        } else {
                            num.textContent = current;
                        }
                    }, 16);
                });
                obs.unobserve(entry.target);
            }
        });
    }, scrollObserverOptions);

    const metricsGrid = document.querySelector('.hero-metrics');
    if (metricsGrid) {
        countUpObserver.observe(metricsGrid);
    }

    // ==========================================
    // 4. PORTFOLIO DYNAMIC FILTERING & DUMMY DATA
    // ==========================================
    const DEFAULT_PROJECTS = {
        "p1": {
            title: "Amman Relax Bakery Catalog",
            category: "web",
            techStack: "React, Next.js, Firebase",
            desc: "Highly aesthetic catalog and instant ordering web system built with Next.js static rendering and Firebase database storage. Features custom micro-interactions.",
            results: "+180% surge in online table bookings",
            img: "https://i.ibb.co/XxWfnk7C/Y-20240920-210022-0000.png",
            url: "amman-relax-bakery",
            icon: "coffee"
        },
        "p2": {
            title: "Lions Gym Erode CRM Portal",
            category: "web",
            techStack: "React, Node.js, SQL Database",
            desc: "A custom customer management hub built for local gym operations, integrating real-time check-in stats and automated fee reminders.",
            results: "45% increase in gym member retention",
            img: "https://i.ibb.co/XxWfnk7C/Y-20240920-210022-0000.png",
            url: "lions_gym_erode",
            icon: "activity"
        },
        "p3": {
            title: "Mavis Warehouse IoT Streams",
            category: "mobile",
            techStack: "Flutter, ESP32, MQTT Protocol",
            desc: "A beautifully animated Flutter mobile dashboard tracking warehouse telemetry updates and sensor metrics under 200ms.",
            results: "Prevented 3 major food spoilage events",
            img: "https://i.ibb.co/XxWfnk7C/Y-20240920-210022-0000.png",
            url: "mavis",
            icon: "smartphone"
        },
        "p4": {
            title: "One Dine Tirupur Systems",
            category: "web",
            techStack: "Next.js, Tailwind, Node.js",
            desc: "Full-stack restaurant digital menu catalog and smart table booking engine optimized to achieve 100/100 Lighthouse performance metrics.",
            results: "1.2s rapid initial content paint load",
            img: "https://i.ibb.co/XxWfnk7C/Y-20240920-210022-0000.png",
            url: "one_dine_tirupur",
            icon: "layout"
        },
        "p5": {
            title: "Pretty Queen Salon Ledger",
            category: "web",
            techStack: "Vanilla JS, CSS Grid, SEO Schema",
            desc: "A stunning corporate aesthetic showcase, treatment catalogs, and booking ledger tailored to rank first inside local search parameters.",
            results: "+120% surge in online bookings",
            img: "https://i.ibb.co/XxWfnk7C/Y-20240920-210022-0000.png",
            url: "pretty_queen_salon",
            icon: "sparkles"
        },
        "p6": {
            title: "Thenmanam Home Delivery App",
            category: "mobile",
            techStack: "Flutter, Firebase, SMS Hooks",
            desc: "Cross-platform mobile delivery tracking application with organic location indicators and automated SMS message confirmations on package drops.",
            results: "99.9% transparency rating on drop shipments",
            img: "https://i.ibb.co/XxWfnk7C/Y-20240920-210022-0000.png",
            url: "thenmanam_anna_nagar",
            icon: "smartphone"
        }
    };

    let projectsCache = {};

    const portfolioGrid = document.getElementById('portfolio-grid-container');
    const filterButtons = document.querySelectorAll('#portfolio-filters .filter-btn');

    // Fetch and Bind Projects
    const projectsRef = database.ref('projects');
    projectsRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            projectsCache = snapshot.val();
        } else {
            // Use premium default fallbacks if database is empty
            projectsCache = DEFAULT_PROJECTS;
        }
        renderProjects('all');
    }, (error) => {
        console.error("Firebase Projects Fetch Error, loading local defaults:", error);
        projectsCache = DEFAULT_PROJECTS;
        renderProjects('all');
    });

    // Render Projects Grid dynamically
    function renderProjects(filterValue) {
        if (!portfolioGrid) return;
        portfolioGrid.style.opacity = '0';
        portfolioGrid.style.transition = 'opacity 0.3s ease-out';

        setTimeout(() => {
            portfolioGrid.innerHTML = '';
            let filteredKeys = Object.keys(projectsCache).reverse().filter(key => {
                const p = projectsCache[key];
                return filterValue === 'all' || p.category === filterValue;
            });

            if (filteredKeys.length > 0) {
                filteredKeys.forEach(key => {
                    const p = projectsCache[key];
                    const iconName = p.icon || 'star';
                    const resultsText = p.results || '99.9% uptime guaranteed';
                    const techList = p.techStack ? p.techStack.split(',') : ['React', 'Firebase'];
                    const tagsMarkup = techList.map(tag => `<span class="tag-badge">${tag.trim()}</span>`).join('');
                    
                    portfolioGrid.innerHTML += `
                    <div class="project-card animate" style="opacity: 1;">
                        <div class="project-img" style="height: 220px; position:relative;">
                            <img src="${p.img || '1.JPG'}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover;">
                            <div class="img-overlay"></div>
                            <div style="position:absolute; bottom:1rem; right:1rem; width:40px; height:40px; border-radius:50%; background:var(--bg-card-raw); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; color:var(--primary); z-index:5;">
                                <i data-lucide="${iconName}" style="width:20px; height:20px;"></i>
                            </div>
                        </div>
                        <div class="project-content">
                            <div class="project-tags">${tagsMarkup}</div>
                            <h3 class="project-title" style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">${p.title}</h3>
                            <p class="project-desc" style="color:var(--text-muted); font-size:0.92rem; line-height:1.6; margin-bottom:1rem;">${p.desc.substring(0, 110)}...</p>
                            
                            <div class="project-results">
                                <span class="results-label">Outcome:</span>
                                <span class="results-text">${resultsText}</span>
                            </div>

                            <div style="margin-top:1.5rem; display:flex; gap:0.8rem;">
                                <button class="project-link open-modal" style="border:none;" data-title="${p.title}" data-desc="${p.desc}" data-url="${p.url || ''}" data-img="${p.img || ''}">
                                    View Case Study <i data-lucide="arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    `;
                });
                
                if (window.lucide) {
                    window.lucide.createIcons();
                }
                bindDynamicModals();
            } else {
                portfolioGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem;">
                    <i data-lucide="folder-open" style="width: 48px; height: 48px; margin: 0 auto 1rem;"></i>
                    <p style="font-weight:600;">No projects added under this category yet.</p>
                </div>`;
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }

            portfolioGrid.style.opacity = '1';
        }, 300);
    }

    // Filter Buttons click binding
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterVal = btn.getAttribute('data-filter');
            renderProjects(filterVal);
        });
    });

    // ==========================================
    // 5. TESTIMONIALS CAROUSEL SLIDER INTERACTION
    // ==========================================
    const testimonialTrack = document.getElementById('testimonial-track');
    const testimonials = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.getElementById('prev-testimonial');
    const nextBtn = document.getElementById('next-testimonial');
    const dotElements = document.querySelectorAll('#carousel-dots .dot');
    
    let currentIndex = 0;
    const totalSlides = testimonials.length;

    if (testimonialTrack && totalSlides > 0) {
        function slideTo(index) {
            if (index < 0) {
                currentIndex = totalSlides - 1;
            } else if (index >= totalSlides) {
                currentIndex = 0;
            } else {
                currentIndex = index;
            }

            testimonialTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // Update dots
            dotElements.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                slideTo(currentIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                slideTo(currentIndex + 1);
            });
        }

        dotElements.forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.getAttribute('data-index'));
                slideTo(idx);
            });
        });

        // Auto transition every 7 seconds
        setInterval(() => {
            slideTo(currentIndex + 1);
        }, 7000);
    }

    // ==========================================
    // 6. PRICING SELECTOR TOGGLE SWITCH LOGIC
    // ==========================================
    const pricingSwitch = document.getElementById('pricing-switch');
    const labelMonthly = document.getElementById('label-monthly');
    const labelProject = document.getElementById('label-project');

    const starterPrice = document.getElementById('starter-price');
    const proPrice = document.getElementById('pro-price');
    const enterprisePrice = document.getElementById('enterprise-price');

    if (pricingSwitch) {
        pricingSwitch.addEventListener('click', () => {
            pricingSwitch.classList.toggle('active');
            const isProjectBased = pricingSwitch.classList.contains('active');
            
            if (isProjectBased) {
                labelMonthly.classList.remove('active');
                labelProject.classList.add('active');
                
                // Show Project pricing (INR)
                starterPrice.innerHTML = '₹14,999<span style="font-size:1.2rem;color:var(--text-muted);font-weight:500;">/project</span>';
                proPrice.innerHTML = '₹39,999<span style="font-size:1.2rem;color:rgba(255,255,255,0.6);font-weight:500;">/project</span>';
                enterprisePrice.innerHTML = '₹89,999<span style="font-size:1.2rem;color:var(--text-muted);font-weight:500;">/project</span>';
            } else {
                labelMonthly.classList.add('active');
                labelProject.classList.remove('active');
                
                // Show Monthly Support SLA pricing
                starterPrice.innerHTML = '₹6,999<span style="font-size:1.2rem;color:var(--text-muted);font-weight:500;">/mo</span>';
                proPrice.innerHTML = '₹19,999<span style="font-size:1.2rem;color:rgba(255,255,255,0.6);font-weight:500;">/mo</span>';
                enterprisePrice.innerHTML = '₹49,999<span style="font-size:1.2rem;color:var(--text-muted);font-weight:500;">/mo</span>';
            }
        });
    }



    // ==========================================
    // 7. CALENDAR CONSULTATION MODAL SCHEDULER
    // ==========================================
    const calendarModal = document.getElementById('calendar-modal');
    const bookConsultBtn = document.getElementById('book-consult-btn');
    const navBookBtn = document.getElementById('nav-book-btn');
    const calendarClose = document.getElementById('calendar-close');
    const datesGrid = document.getElementById('calendar-dates-grid');
    const timeSlots = document.querySelectorAll('#calendar-time-slots .time-slot');
    const selectedDateVal = document.getElementById('selected-date-val');
    const selectedTimeVal = document.getElementById('selected-time-val');
    const calBookingForm = document.getElementById('calendar-booking-form');
    const bookingSuccessMsg = document.getElementById('booking-success-msg');

    if (calendarModal) {
        const triggers = [bookConsultBtn, navBookBtn];
        triggers.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    generateCalendarDates();
                    calendarModal.classList.add('active');
                });
            }
        });

        if (calendarClose) {
            calendarClose.addEventListener('click', () => {
                calendarModal.classList.remove('active');
                bookingSuccessMsg.style.display = 'none';
            });
        }

        // Close on outside card click
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) {
                calendarModal.classList.remove('active');
                bookingSuccessMsg.style.display = 'none';
            }
        });
    }

    // Generate upcoming 5 business days
    function generateCalendarDates() {
        if (!datesGrid) return;
        datesGrid.innerHTML = '';
        
        // Render headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(d => {
            datesGrid.innerHTML += `<div class="calendar-day-header">${d}</div>`;
        });

        const today = new Date();
        let renderedCount = 0;
        let dayCounter = 0;
        let selectedSet = false;

        // Render grids
        while (renderedCount < 14) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + dayCounter);
            
            const isWeekend = nextDate.getDay() === 0 || nextDate.getDay() === 6;
            const formattedDate = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            let classList = "calendar-day";
            if (isWeekend) classList += " disabled";
            
            if (!isWeekend && !selectedSet) {
                classList += " selected";
                if (selectedDateVal) selectedDateVal.value = formattedDate;
                selectedSet = true;
            }

            datesGrid.innerHTML += `
                <div class="${classList}" data-date="${formattedDate}">
                    <span style="font-weight: 700; display:block;">${nextDate.getDate()}</span>
                </div>
            `;

            renderedCount++;
            dayCounter++;
        }

        // Rebind click listeners to active days
        document.querySelectorAll('.calendar-day:not(.disabled)').forEach(dayNode => {
            dayNode.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayNode.classList.add('selected');
                const dt = dayNode.getAttribute('data-date');
                if (selectedDateVal) selectedDateVal.value = dt;
            });
        });
    }

    // Time slots selection
    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            timeSlots.forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            const tm = slot.getAttribute('data-time');
            if (selectedTimeVal) selectedTimeVal.value = tm;
        });
    });

    // Calendar booking submit to Firebase
    if (calBookingForm) {
        calBookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Honeypot bot protection check
            const honeypot = document.getElementById('calendar-honeypot') ? document.getElementById('calendar-honeypot').value : '';
            if (honeypot.trim() !== '') {
                console.warn("Spam bot detected and blocked silently.");
                // Return fake success to spoof the bot
                bookingSuccessMsg.innerHTML = `<i data-lucide="check" style="vertical-align:middle; width:16px;"></i> Booked! Briefing scheduled on ${sanitizeInput(selectedDateVal.value)} at ${sanitizeInput(selectedTimeVal.value)}. Check your email.`;
                bookingSuccessMsg.style.display = 'block';
                if (window.lucide) window.lucide.createIcons();
                calBookingForm.reset();
                setTimeout(() => {
                    calendarModal.classList.remove('active');
                    bookingSuccessMsg.style.display = 'none';
                }, 3000);
                return;
            }

            // Rate Limit protection check
            if (isRateLimited('calendar')) {
                const timeRemaining = getCooldownTimeRemaining('calendar');
                const mins = Math.ceil(timeRemaining / 60);
                bookingSuccessMsg.textContent = `Too many requests. Please wait ${mins} minutes before booking another consultation.`;
                bookingSuccessMsg.style.color = "#ef4444";
                bookingSuccessMsg.style.display = 'block';
                return;
            }

            const email = sanitizeInput(document.getElementById('cal-email').value);
            const date = sanitizeInput(selectedDateVal.value);
            const time = sanitizeInput(selectedTimeVal.value);

            const btn = calBookingForm.querySelector('button');
            const orig = btn.innerText;
            btn.innerText = "Scheduling Consultation...";

            try {
                const bookingsRef = database.ref('bookings');
                await bookingsRef.push({
                    email,
                    date,
                    time,
                    timestamp: new Date().toISOString()
                });

                // Success response
                bookingSuccessMsg.innerHTML = `<i data-lucide="check" style="vertical-align:middle; width:16px;"></i> Booked! Briefing scheduled on ${date} at ${time}. Check your email.`;
                bookingSuccessMsg.style.display = 'block';
                if (window.lucide) {
                    window.lucide.createIcons();
                }
                calBookingForm.reset();
            } catch (err) {
                console.error("Booking Error:", err);
                bookingSuccessMsg.textContent = "Error scheduling. Try again.";
                bookingSuccessMsg.style.color = "#ef4444";
                bookingSuccessMsg.style.display = 'block';
            } finally {
                btn.innerText = orig;
                setTimeout(() => {
                    calendarModal.classList.remove('active');
                    bookingSuccessMsg.style.display = 'none';
                }, 3000);
            }
        });
    }

    // ==========================================
    // 8. CONTACT FORM SUBMIT OVERHAUL (BUDGET + SMS)
    // ==========================================
    const contactForm = document.querySelector('.contact-form');
    const budgetRange = document.getElementById('budget-range');
    const budgetValue = document.getElementById('budget-value');

    // Budget slider dynamic display
    if (budgetRange && budgetValue) {
        budgetRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (val >= 100000) {
                budgetValue.textContent = `Current: ₹1,00,000+`;
            } else {
                budgetValue.textContent = `Current: ₹${val.toLocaleString('en-IN')}`;
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('.submit-btn');
            const originalText = btn.innerHTML;

            // Honeypot bot protection check
            const honeypot = document.getElementById('contact-honeypot') ? document.getElementById('contact-honeypot').value : '';
            if (honeypot.trim() !== '') {
                console.warn("Spam bot detected and blocked silently.");
                // Return fake success to spoof the bot
                btn.innerHTML = 'Request Sent Securely! <i data-lucide="check"></i>';
                btn.style.color = '#10b981';
                if (window.lucide) window.lucide.createIcons();
                contactForm.reset();
                if (budgetValue) budgetValue.textContent = 'Current: ₹20,000';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.color = '';
                    if (window.lucide) window.lucide.createIcons();
                }, 3000);
                return;
            }

            // Rate Limit protection check
            if (isRateLimited('contact')) {
                const timeRemaining = getCooldownTimeRemaining('contact');
                const mins = Math.ceil(timeRemaining / 60);
                btn.innerHTML = `Too many requests. Wait ${mins}m! <i data-lucide="x"></i>`;
                btn.style.color = '#ef4444';
                if (window.lucide) window.lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.color = '';
                    if (window.lucide) window.lucide.createIcons();
                }, 3000);
                return;
            }

            const name = sanitizeInput(document.getElementById('name').value);
            const phone = sanitizeInput(document.getElementById('phone').value);
            const email = sanitizeInput(document.getElementById('email').value);
            const interest = sanitizeInput(document.getElementById('interest').value);
            const budget = budgetRange ? budgetRange.value : '20000';
            const message = sanitizeInput(document.getElementById('message').value);

            // Show loading
            btn.innerHTML = 'Sending Secure Request... <i data-lucide="loader" class="spin"></i>';
            if (window.lucide) {
                window.lucide.createIcons();
            }

            try {
                // Save to Firebase Database
                const contactsRef = database.ref('contacts');
                await contactsRef.push({
                    name,
                    phone,
                    email,
                    interest,
                    budget: parseInt(budget),
                    message,
                    timestamp: new Date().toISOString()
                });

                // Success feedback animation
                btn.innerHTML = 'Request Sent Securely! <i data-lucide="check"></i>';
                btn.style.color = '#10b981'; // Green color
                if (window.lucide) {
                    window.lucide.createIcons();
                }

                contactForm.reset();
                if (budgetValue) budgetValue.textContent = 'Current: ₹20,000';

            } catch (err) {
                console.error("Firebase Save Error:", err);
                btn.innerHTML = 'Failed to Send! <i data-lucide="x"></i>';
                btn.style.color = '#ef4444';
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            } finally {
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.color = '';
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }, 3000);
            }
        });
    }

    // ==========================================
    // 9. INSTANT CALLBACK WIDGET LOGIC
    // ==========================================
    const callbackForm = document.getElementById('callback-form');
    const callbackSuccess = document.getElementById('callback-success');
    if (callbackForm) {
        callbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneVal = document.getElementById('callback-phone').value;
            const btn = callbackForm.querySelector('button');
            const orig = btn.innerText;

            // Honeypot bot protection check
            const honeypot = document.getElementById('callback-honeypot') ? document.getElementById('callback-honeypot').value : '';
            if (honeypot.trim() !== '') {
                console.warn("Spam bot detected and blocked silently.");
                if (callbackSuccess) {
                    callbackSuccess.textContent = "Callback requested! Rithish V will call you in under 10 minutes.";
                    callbackSuccess.style.color = "#10b981";
                    callbackSuccess.style.display = "block";
                }
                callbackForm.reset();
                setTimeout(() => {
                    if (callbackSuccess) callbackSuccess.style.display = "none";
                }, 4000);
                return;
            }

            // Rate Limit protection check
            if (isRateLimited('callback')) {
                const timeRemaining = getCooldownTimeRemaining('callback');
                const mins = Math.ceil(timeRemaining / 60);
                if (callbackSuccess) {
                    callbackSuccess.textContent = `Too many requests. Please wait ${mins}m.`;
                    callbackSuccess.style.color = "#ef4444";
                    callbackSuccess.style.display = "block";
                }
                setTimeout(() => {
                    if (callbackSuccess) callbackSuccess.style.display = "none";
                }, 4000);
                return;
            }

            const phone = sanitizeInput(phoneVal);
            btn.innerText = "Requesting...";

            try {
                const cbRef = database.ref('callbacks');
                await cbRef.push({
                    phone,
                    timestamp: new Date().toISOString()
                });

                if (callbackSuccess) {
                    callbackSuccess.textContent = "Callback requested! Rithish V will call you in under 10 minutes.";
                    callbackSuccess.style.color = "#10b981";
                    callbackSuccess.style.display = "block";
                }
                callbackForm.reset();
            } catch (err) {
                console.error("Callback database error:", err);
                if (callbackSuccess) {
                    callbackSuccess.textContent = "Error scheduling callback. Try direct WhatsApp.";
                    callbackSuccess.style.color = "#ef4444";
                    callbackSuccess.style.display = "block";
                }
            } finally {
                btn.innerText = orig;
                setTimeout(() => {
                    if (callbackSuccess) callbackSuccess.style.display = "none";
                }, 4000);
            }
        });
    }

    // ==========================================
    // 10. MODAL DETAILED DEEP DIVES POPUPS
    // ==========================================
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalImg = document.getElementById('modal-img');
    const modalLink = document.getElementById('modal-link');
    const imgPlaceholder = document.querySelector('.modal-img-placeholder');
    const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-redirect');

    function bindDynamicModals() {
        if (!modal) return;
        const freshBtns = document.querySelectorAll('.open-modal');
        
        freshBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const title = btn.getAttribute('data-title');
                const desc = btn.getAttribute('data-desc');
                let url = btn.getAttribute('data-url');
                const img = btn.getAttribute('data-img');

                if (modalTitle) modalTitle.textContent = title;
                if (modalDesc) modalDesc.textContent = desc;

                if (url && url.length > 1) {
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        // Support relative path for local redirects (bakery, gym, etc.)
                        if (url.includes('amman') || url.includes('gym') || url.includes('mavis') || url.includes('tirupur') || url.includes('salon') || url.includes('thenmanam')) {
                            // Local directory redirect
                            url = '../' + url + '/index.html';
                        } else {
                            url = 'https://' + url;
                        }
                    }
                    if (modalLink) {
                        modalLink.style.display = 'inline-flex';
                        modalLink.href = url;
                        modalLink.textContent = "Visit Live Project";
                    }
                } else {
                    if (modalLink) modalLink.style.display = 'none';
                }

                if (img && modalImg) {
                    modalImg.src = img;
                    modalImg.style.display = 'block';
                    if (imgPlaceholder) imgPlaceholder.style.display = 'none';
                } else {
                    if (modalImg) modalImg.style.display = 'none';
                    if (imgPlaceholder) imgPlaceholder.style.display = 'flex';
                }

                modal.classList.add('active');
            });
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
        });
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // ==========================================
    // 11. SCROLL REVEAL OBSERVER Setup
    // ==========================================
    const animateElements = document.querySelectorAll('.section-title, .section-desc, .service-card, .price-card, .about-text, .founder-premium-card, .tech-orb, .case-study-card');
    const generalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.animation = 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                generalObserver.unobserve(entry.target);
            }
        });
    }, scrollObserverOptions);

    animateElements.forEach(el => {
        generalObserver.observe(el);
    });

    // ==========================================
    // 12. FAQ ACCORDION EXPANSION MECHANISM
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.faq-answer').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + 50 + "px";
            }
        });
    });

    // ==========================================
    // 13. DYNAMIC SCROLL HEADER ACTIVE LINKS
    // ==========================================
    const sections = document.querySelectorAll('section[id]');
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        // Navbar Scrolled Backdrop blur hook
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        const scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href*=${sectionId}]`);

            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    });

    // ==========================================
    // 14. MOBILE TOGGLE CLOSE CLICKS
    // ==========================================
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-link, .btn-primary-sm');
    const navCloseBtn = document.querySelector('.nav-close-btn');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('active')) {
                    icon.setAttribute('data-lucide', 'x');
                } else {
                    icon.setAttribute('data-lucide', 'menu');
                }
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }
        });

        navLinksItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
            });
        });

        if (navCloseBtn) {
            navCloseBtn.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
            });
        }
    }

    // ==========================================
    // 15. NEWSLETTER SUBSCRIPTION LOGIC
    // ==========================================
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('newsletter-btn');
            const originalText = btn.innerHTML;
            const emailInput = document.getElementById('newsletter-email');
            const msgEl = document.querySelector('.subscribe-msg');

            // Honeypot bot protection check
            const honeypot = document.getElementById('newsletter-honeypot') ? document.getElementById('newsletter-honeypot').value : '';
            if (honeypot.trim() !== '') {
                console.warn("Spam bot detected and blocked silently.");
                if (msgEl) {
                    msgEl.textContent = 'Thanks for subscribing! Check your inbox for tech updates.';
                    msgEl.style.color = '#10b981';
                    msgEl.style.display = 'block';
                }
                emailInput.value = '';
                btn.innerHTML = 'Subscribed! <i data-lucide="check"></i>';
                if (window.lucide) window.lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 3000);
                return;
            }

            // Rate Limit protection check
            if (isRateLimited('newsletter')) {
                const timeRemaining = getCooldownTimeRemaining('newsletter');
                const mins = Math.ceil(timeRemaining / 60);
                if (msgEl) {
                    msgEl.textContent = `Too many requests. Wait ${mins}m.`;
                    msgEl.style.color = '#ef4444';
                    msgEl.style.display = 'block';
                }
                btn.innerHTML = 'Error <i data-lucide="x"></i>';
                if (window.lucide) window.lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    if (msgEl) msgEl.style.display = 'none';
                }, 3000);
                return;
            }

            const email = sanitizeInput(emailInput.value);

            // Show loading
            btn.innerHTML = 'Subscribing... <i data-lucide="loader" class="spin"></i>';
            if (window.lucide) {
                window.lucide.createIcons();
            }

            try {
                // Save subscriber to Firebase
                const subsRef = database.ref('subscribers');
                await subsRef.push({
                    email: email,
                    timestamp: new Date().toISOString()
                });

                // Show success message
                if (msgEl) {
                    msgEl.textContent = 'Thanks for subscribing! Check your inbox for tech updates.';
                    msgEl.style.color = '#10b981';
                    msgEl.style.display = 'block';
                }
                emailInput.value = '';

                btn.innerHTML = 'Subscribed! <i data-lucide="check"></i>';
                if (window.lucide) {
                    window.lucide.createIcons();
                }

            } catch (error) {
                console.error("Error subscribing: ", error);
                if (msgEl) {
                    msgEl.textContent = 'Error subscribing. Try again.';
                    msgEl.style.color = '#ef4444';
                    msgEl.style.display = 'block';
                }

                btn.innerHTML = 'Error <i data-lucide="x"></i>';
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            } finally {
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    if (msgEl && msgEl.style.color !== 'rgb(16, 185, 129)') {
                        msgEl.style.display = 'none';
                    }
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }, 3000);
            }
        });
    }

    // ==========================================
    // 16. ABOUT & TEAM SECTION TABS LOGIC
    // ==========================================
    const tabButtons = document.querySelectorAll('.about-tab-btn');
    const tabContents = document.querySelectorAll('.about-tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                if (content.getAttribute('id') === `tab-${targetTab}`) {
                    content.style.display = 'block';
                    content.classList.add('active');
                } else {
                    content.style.display = 'none';
                    content.classList.remove('active');
                }
            });
            
            // Re-render Lucide icons if any are in the newly shown tab
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });
    });
});

/**
 * Young Techs - Lighthouse Score Optimization Script
 * Resolves Accessibility, SEO, and Interactive DOM warnings.
 */
document.addEventListener("DOMContentLoaded", () => {
    try {
        // 1. FORM ACCESSIBILITY: Associate a native aria-label with the budget range input
        const budgetRange = document.getElementById("budget-range");
        if (budgetRange) {
            budgetRange.setAttribute("aria-label", "Project budget range slider in Indian Rupees");
        }

        // 2. ARIA PROHIBITED ATTRIBUTES: Fix invalid aria-label on the pricing switch container
        const pricingSwitch = document.getElementById("pricing-switch");
        if (pricingSwitch) {
            // A 'div' wrapper cannot have an aria-label unless it has an interactive role.
            // We convert it semantically into a functional region for screen readers.
            pricingSwitch.setAttribute("role", "region");
            pricingSwitch.setAttribute("aria-live", "polite");
            pricingSwitch.removeAttribute("aria-label");
        }

        // 3. SEO & IDENTICAL LINKS: Inject distinct, descriptive context into generic "Learn More" anchors
        const serviceLinks = document.querySelectorAll("a.btn-learn-more");
        serviceLinks.forEach(link => {
            const href = link.getAttribute("href") || "";
            if (href.includes("web-development")) {
                link.setAttribute("aria-label", "Learn more about custom Web Development solutions");
            } else if (href.includes("mobile-app-development")) {
                link.setAttribute("aria-label", "Learn more about cross-platform Mobile App Development");
            }
        });

        // 4. EMPTY HEADINGS BEST PRACTICE: Provide fallback structural text for the dynamic project modal
        const modalTitle = document.getElementById("modal-title");
        if (modalTitle && !modalTitle.innerText.trim()) {
            modalTitle.innerText = "Project Technical Specifications";
        }
    } catch (error) {
        console.error("Lighthouse Optimization Script Error:", error);
    }
});
