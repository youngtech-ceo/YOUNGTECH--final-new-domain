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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-link');

    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');

        // Toggle icon between menu and x
        const icon = mobileBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    });

    // Close mobile menu when link is clicked
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileBtn.querySelector('i');
            icon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        });
    });

    // Scroll Animation Observer
    const animateElements = document.querySelectorAll('.section-title, .section-desc, .service-card, .project-card, .price-card, .about-text, .about-image');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.animation = 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animateElements.forEach(el => {
        observer.observe(el);
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all items
            faqItems.forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.faq-answer').style.maxHeight = null;
            });

            // If it wasn't active, open it
            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + 50 + "px"; // Add some padding
            }
        });
    });

    // Contact Form Submission
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('.submit-btn');
            const originalText = btn.innerHTML;

            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const interest = document.getElementById('interest').value;
            const message = document.getElementById('message').value;

            // Show loading state
            btn.innerHTML = 'Sending... <i data-lucide="loader" class="spin"></i>';
            lucide.createIcons();

            try {
                // Save to Firebase
                const contactsRef = database.ref('contacts');
                await contactsRef.push({
                    name,
                    email,
                    interest,
                    message,
                    timestamp: new Date().toISOString()
                });

                // Success state
                btn.innerHTML = 'Message Sent! <i data-lucide="check"></i>';
                btn.classList.replace('btn-primary', 'btn-outline');
                btn.style.borderColor = 'var(--accent)';
                btn.style.color = '#10b981'; // Success color
                lucide.createIcons();

                contactForm.reset();
            } catch (error) {
                console.error("Error saving to Firebase: ", error);
                btn.innerHTML = 'Error Sending! <i data-lucide="x"></i>';
                btn.style.color = '#ef4444';
                lucide.createIcons();
            } finally {
                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    if (btn.classList.contains('btn-outline')) {
                        btn.classList.replace('btn-outline', 'btn-primary');
                    }
                    btn.style.color = '';
                    btn.style.borderColor = '';
                    lucide.createIcons();
                }, 3000);
            }
        });
    }

    // Active Link State on Scroll
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
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

    // Close mobile menu explicitly
    const navCloseBtn = document.querySelector('.nav-close-btn');
    if (navCloseBtn) {
        navCloseBtn.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileBtn.querySelector('i');
            icon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        });
    }

    // Modal Logic
    const modal = document.getElementById('project-modal');
    const openModalBtns = document.querySelectorAll('.open-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');

    if (modal) {
        const modalImg = document.getElementById('modal-img');
        const modalLink = document.getElementById('modal-link');
        const imgPlaceholder = document.querySelector('.modal-img-placeholder');

        openModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const title = btn.getAttribute('data-title');
                const desc = btn.getAttribute('data-desc');
                const url = btn.getAttribute('data-url');
                const img = btn.getAttribute('data-img');

                modalTitle.textContent = title;
                modalDesc.textContent = desc;

                if (url) {
                    modalLink.style.display = 'inline-flex';
                    modalLink.href = url;
                } else {
                    modalLink.style.display = 'none';
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

        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Newsletter Subscription Logic
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('newsletter-btn');
            const originalText = btn.innerHTML;
            const emailInput = document.getElementById('newsletter-email');
            const msgEl = document.querySelector('.subscribe-msg');

            // Show loading
            btn.innerHTML = 'Subscribing... <i data-lucide="loader" class="spin"></i>';
            lucide.createIcons();

            try {
                // Save to Firebase (using same database instance)
                const subsRef = database.ref('subscribers');
                await subsRef.push({
                    email: emailInput.value,
                    timestamp: new Date().toISOString()
                });

                // Show success message
                msgEl.textContent = 'Thanks for subscribing!';
                msgEl.style.color = '#10b981';
                msgEl.style.display = 'block';
                emailInput.value = '';

                btn.innerHTML = 'Subscribed! <i data-lucide="check"></i>';
                btn.classList.replace('btn-primary', 'btn-outline');
                lucide.createIcons();

            } catch (error) {
                console.error("Error subscribing: ", error);
                msgEl.textContent = 'Error subscribing. Try again.';
                msgEl.style.color = '#ef4444';
                msgEl.style.display = 'block';

                btn.innerHTML = 'Error <i data-lucide="x"></i>';
                lucide.createIcons();
            } finally {
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    if (btn.classList.contains('btn-outline')) {
                        btn.classList.replace('btn-outline', 'btn-primary');
                    }
                    if (msgEl.style.color !== 'rgb(16, 185, 129)') msgEl.style.display = 'none'; // Only hide error instantly
                    lucide.createIcons();
                }, 3000);
            }
        });
    }

    // Fetch and bind Stats
    const statsRef = database.ref('stats');
    statsRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const elmProjects = document.getElementById('v-projects');
            const elmSat = document.getElementById('v-satisfaction');
            const elmSupport = document.getElementById('v-support');
            if (elmProjects) elmProjects.textContent = data.projectsCompleted || '150+';
            if (elmSat) elmSat.textContent = data.clientSatisfaction || '99%';
            if (elmSupport) elmSupport.textContent = data.support || '24/7';
        }
    });

    // Fetch and bind Projects
    const projectsRef = database.ref('projects');
    projectsRef.on('value', (snapshot) => {
        const grid = document.getElementById('portfolio-grid-container');
        if (grid) {
            grid.innerHTML = '';
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).reverse().forEach(key => {
                    const p = data[key];
                    const icon = p.icon || 'star';
                    const shortDesc = p.desc.length > 120 ? p.desc.substring(0, 120) + '...' : p.desc;
                    grid.innerHTML += `
                    <div class="project-card">
                        <div class="project-img">
                            <div class="img-overlay"></div>
                            <i data-lucide="${icon}" class="project-icon"></i>
                        </div>
                        <div class="project-content">
                            <h3 class="project-title">${p.title}</h3>
                            <p class="project-desc">${shortDesc}</p>
                            <button class="project-link open-modal" data-title="${p.title}" data-desc="${p.desc}" data-url="${p.url || ''}" data-img="${p.img || ''}">
                                View Case Study <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                    </div>
                    `;
                });
                lucide.createIcons();
                bindDynamicModals();
            } else {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No featured projects added yet. Add some from the Admin Dashboard!</div>';
            }
        }
    });

    function bindDynamicModals() {
        if (!modal) return;
        const freshBtns = document.querySelectorAll('.open-modal');
        const modalImg = document.getElementById('modal-img');
        const modalLink = document.getElementById('modal-link');
        const imgPlaceholder = document.querySelector('.modal-img-placeholder');

        freshBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const title = btn.getAttribute('data-title');
                const desc = btn.getAttribute('data-desc');
                let url = btn.getAttribute('data-url');
                const img = btn.getAttribute('data-img');

                modalTitle.textContent = title;
                modalDesc.textContent = desc;

                if (url && url.length > 1) { // Not just "#" or empty
                    // Auto-append https:// if user only wrote a direct domain
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }
                    modalLink.style.display = 'inline-flex';
                    modalLink.href = url;
                } else {
                    modalLink.style.display = 'none';
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

    // Security: Anti-Inspection & Right-Click Prevention
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
        // Prevent F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
        }
        // Prevent Ctrl+Shift+I (Inspector), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Select)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
        }
        // Prevent Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
        }
    });

});
