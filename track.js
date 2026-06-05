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
if (window.firebase) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------
    // 1. LIGHT & DARK THEME SWITCHER LOGIC
    // ------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

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



    // ------------------------------------------
    // 3. TRACKING QUERY LOOP & INTEGRATION
    // ------------------------------------------
    const trackForm = document.getElementById('track-form');
    const searchCard = document.getElementById('search-card');
    const dashboardCard = document.getElementById('dashboard-card');
    const errorMsg = document.getElementById('track-error-msg');
    
    const displayProjectName = document.getElementById('display-project-name');
    const displayClientName = document.getElementById('display-client-name');
    const displayOrderId = document.getElementById('display-order-id');
    const projectTypeBadge = document.getElementById('project-type-badge');
    const displayProgressPercent = document.getElementById('display-progress-percent');
    const barFill = document.getElementById('bar-fill');
    const displayLastUpdated = document.getElementById('display-last-updated');
    const displayUpdateNotes = document.getElementById('display-update-notes');
    const displayStartDate = document.getElementById('display-start-date');
    const displayTargetDate = document.getElementById('display-target-date');
    const btnBackToSearch = document.getElementById('btn-back-to-search');

    if (trackForm) {
        trackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const orderIdVal = document.getElementById('track-order-id').value.trim().toUpperCase();
            const mobileVal = document.getElementById('track-mobile').value.trim();

            if (errorMsg) errorMsg.style.display = 'none';

            const btnSubmit = document.getElementById('btn-track-submit');
            const origHTML = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Connecting Secure Pipeline... <i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i>';
            if (window.lucide) window.lucide.createIcons();

            try {
                // Fetch orders from Firebase
                const ordersRef = database.ref('orders');
                const snapshot = await ordersRef.orderByChild('orderId').equalTo(orderIdVal).once('value');

                if (snapshot.exists()) {
                    let matchedOrder = null;
                    snapshot.forEach(child => {
                        const order = child.val();
                        // Check if mobile matches (strip non-numeric if required, but simple string matching is standard)
                        if (order.customerMobile === mobileVal) {
                            matchedOrder = order;
                        }
                    });

                    if (matchedOrder) {
                        // Found a match! Render dashboard details
                        renderDashboard(matchedOrder);
                    } else {
                        showError("Access Denied: Mobile number does not match registered order.");
                    }
                } else {
                    showError("Invalid Order ID. Check your ID and try again.");
                }

            } catch (err) {
                console.error("Firebase Search Error: ", err);
                showError("Error connecting to database: " + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = origHTML;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    function showError(message) {
        if (errorMsg) {
            errorMsg.innerText = message;
            errorMsg.style.display = 'block';
            
            // Subtle shake animation
            searchCard.style.transform = "translateX(5px)";
            setTimeout(() => searchCard.style.transform = "translateX(-5px)", 80);
            setTimeout(() => searchCard.style.transform = "translateX(5px)", 160);
            setTimeout(() => searchCard.style.transform = "translateX(0)", 240);
        }
    }

    function renderDashboard(order) {
        // Render base texts
        displayProjectName.innerText = order.projectName;
        displayClientName.innerText = order.customerName;
        displayOrderId.innerText = order.orderId;
        displayLastUpdated.innerText = new Date(order.lastUpdated).toLocaleString('en-IN');
        displayUpdateNotes.innerText = order.updateDesc;
        
        // Format dates
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        displayStartDate.innerText = new Date(order.startDate).toLocaleDateString('en-IN', options);
        displayTargetDate.innerText = new Date(order.targetDate).toLocaleDateString('en-IN', options);

        // Project Type Badge
        projectTypeBadge.className = 'project-badge'; // Clear existing classes
        let typeBadgeHTML = "";
        if (order.projectType === 'app') {
            projectTypeBadge.classList.add('badge-app');
            typeBadgeHTML = '<i data-lucide="smartphone" style="width:14px;height:14px;"></i> Mobile App';
        } else if (order.projectType === 'realtime') {
            projectTypeBadge.classList.add('badge-realtime');
            typeBadgeHTML = '<i data-lucide="wifi" style="width:14px;height:14px;"></i> Realtime IoT Development';
        } else {
            projectTypeBadge.classList.add('badge-web');
            typeBadgeHTML = '<i data-lucide="globe" style="width:14px;height:14px;"></i> Web Application';
        }
        projectTypeBadge.innerHTML = typeBadgeHTML;

        // Render Milestones Steps
        const currentMilestone = parseInt(order.milestoneStage) || 1;
        for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            if (stepEl) {
                stepEl.className = "milestone-step"; // Clear existing classes
                const iconContainer = stepEl.querySelector('.milestone-icon');
                
                if (i < currentMilestone) {
                    stepEl.classList.add('completed');
                    if (iconContainer) {
                        iconContainer.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i>';
                    }
                } else if (i === currentMilestone) {
                    stepEl.classList.add('active');
                    // Retain default icon structure for current active step
                    resetMilestoneDefaultIcon(i, iconContainer);
                } else {
                    // Future steps
                    resetMilestoneDefaultIcon(i, iconContainer);
                }
            }
        }

        // Show dashboard, hide search
        searchCard.style.display = 'none';
        dashboardCard.style.display = 'block';

        // Trigger progress percent & bar fill transition
        setTimeout(() => {
            displayProgressPercent.innerText = `${order.progressPercent}%`;
            barFill.style.width = `${order.progressPercent}%`;
        }, 150);

        if (window.lucide) window.lucide.createIcons();
    }

    function resetMilestoneDefaultIcon(stepIndex, container) {
        if (!container) return;
        const iconClasses = {
            1: 'file-text',
            2: 'layout',
            3: 'code',
            4: 'check-square',
            5: 'cloud-lightning',
            6: 'award'
        };
        const iconName = iconClasses[stepIndex] || 'star';
        container.innerHTML = `<i data-lucide="${iconName}" style="width:14px;height:14px;"></i>`;
    }

    if (btnBackToSearch) {
        btnBackToSearch.addEventListener('click', () => {
            dashboardCard.style.display = 'none';
            searchCard.style.display = 'block';
            
            // Reset fields
            barFill.style.width = "0%";
            displayProgressPercent.innerText = "0%";
        });
    }

    // Initialize lucide icons for elements loaded on start
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
