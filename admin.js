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

// Authorized MFA Credentials
const AUTHORIZED_EMAIL = "rithishv1303@gmail.com";
const AUTH_HASH = "0d2ad5f2caadc01314a936b238fbcfd25d1d63bb1dd4806fb142e02142fff7d6"; // SHA-256 of Rithish@1303

// SHA-256 helper
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const authOverlay = document.getElementById('admin-auth-overlay');
    const adminDashboard = document.getElementById('admin-dashboard');
    const authError = document.getElementById('admin-auth-error');
    
    // Credentials Controls
    const credentialsForm = document.getElementById('admin-credentials-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('request-otp-btn'); // Reuses the ID for style/lucide compatibility

    // Check if session is already authenticated
    const savedToken = sessionStorage.getItem('admin_token');
    const savedTime = sessionStorage.getItem('admin_timestamp');
    const now = Date.now();
    const isSessionValid = savedToken === AUTH_HASH && savedTime && (now - parseInt(savedTime) < 2 * 60 * 60 * 1000); // 2 hours

    if (isSessionValid) {
        revealDashboard();
    } else {
        if (credentialsForm) {
            credentialsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleAdminLogin();
            });
        }
    }

    async function handleAdminLogin() {
        if (!emailInput || !passwordInput || !loginBtn) return;
        
        const enteredEmail = emailInput.value.trim().toLowerCase();
        const enteredPasscode = passwordInput.value;
        const enteredHash = await sha256(enteredPasscode);

        if (authError) authError.style.display = 'none';

        // 1. Credentials matching check
        if (enteredEmail !== AUTHORIZED_EMAIL || enteredHash !== AUTH_HASH) {
            if (authError) {
                authError.textContent = "Access Denied: Invalid email or security passcode.";
                authError.style.color = "#ef4444";
                authError.style.display = "block";
                
                // Shake feedback
                passwordInput.style.borderColor = "#ef4444";
                passwordInput.style.transform = "translateX(5px)";
                setTimeout(() => passwordInput.style.transform = "translateX(-5px)", 80);
                setTimeout(() => passwordInput.style.transform = "translateX(5px)", 160);
                setTimeout(() => passwordInput.style.transform = "translateX(0)", 240);
            }
            return;
        }

        // Credentials matched successfully! Proceed with login
        loginBtn.disabled = true;
        const origText = loginBtn.innerHTML;
        loginBtn.innerHTML = 'Logging in securely... <i data-lucide="loader" class="spin"></i>';
        if (window.lucide) window.lucide.createIcons();

        try {
            // Silently authenticate with Firebase Auth for Server-Side Database Protection
            try {
                if (window.firebase && firebase.auth) {
                    await firebase.auth().signInWithEmailAndPassword(enteredEmail, enteredPasscode);
                    console.log("Firebase Auth established successfully.");
                }
            } catch (authError) {
                console.warn("Firebase Auth login bypassed. Ensure auth provider is enabled in Firebase console: ", authError.message);
                // Gracefully continue so dashboard bindings still work locally
            }

            // Save active session token
            sessionStorage.setItem('admin_token', AUTH_HASH);
            sessionStorage.setItem('admin_timestamp', Date.now().toString());

            // Reveal dashboard
            revealDashboard();

        } catch (error) {
            console.error("Login verification error: ", error);
            if (authError) {
                authError.textContent = `Error completing secure login: ${error.message}`;
                authError.style.color = "#ef4444";
                authError.style.display = "block";
            }
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = origText;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    function revealDashboard() {
        if (authOverlay) authOverlay.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'grid';
        
        // Initialize dashboard and Firebase bindings ONLY after authentication
        initDashboardBindings();
    }

    function initDashboardBindings() {
        // References
        const messagesRef = database.ref('contacts');
        const subscribersRef = database.ref('subscribers');
        const callbacksRef = database.ref('callbacks');
        const bookingsRef = database.ref('bookings');
        const ordersRef = database.ref('orders');

        // DOM Elements
        const messagesBody = document.getElementById('messages-body');
        const subscribersBody = document.getElementById('subscribers-body');
        const callbacksBody = document.getElementById('callbacks-body');
        const bookingsBody = document.getElementById('bookings-body');
        const emailAllBtn = document.getElementById('email-all-btn');
        const ordersBody = document.getElementById('orders-body');
        const orderFormContainer = document.getElementById('order-form-container');
        const orderForm = document.getElementById('order-form');
        const addOrderBtn = document.getElementById('add-order-btn');
        const cancelOrderBtn = document.getElementById('cancel-order-btn');

        // Load Messages
        messagesRef.on('value', (snapshot) => {
            messagesBody.innerHTML = '';
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).reverse().forEach(key => {
                    const msg = data[key];
                    if (!msg) return; // Fault-tolerance for empty array slots
                    
                    const safeDate = new Date(msg.timestamp || Date.now()).toLocaleDateString();
                    const safeName = msg.name || 'Anonymous';
                    const safeEmail = msg.email || '-';
                    const safeInt = msg.interest || 'General';
                    const safeMsg = msg.message || '-';

                    messagesBody.innerHTML += `
                        <tr>
                            <td>${safeDate}</td>
                            <td>${safeName}</td>
                            <td><a href="mailto:${safeEmail}" style="color:var(--primary)">${safeEmail}</a></td>
                            <td>${safeInt}</td>
                            <td>${safeMsg}</td>
                            <td><button class="btn-danger delete-msg" data-id="${key}">Delete</button></td>
                        </tr>
                    `;
                });

                // Delete message listener
                document.querySelectorAll('.delete-msg').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if(confirm('Delete this message?')) {
                            database.ref('contacts/' + e.target.getAttribute('data-id')).remove();
                        }
                    });
                });
            } else {
                messagesBody.innerHTML = '<tr><td colspan="6">No messages found.</td></tr>';
            }
        }, (error) => {
            messagesBody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; font-weight:bold; padding: 2rem;">Firebase Error: ${error.message}</td></tr>`;
            console.error("Firebase Messages Error:", error);
        });

        // Load Subscribers
        subscribersRef.on('value', (snapshot) => {
            subscribersBody.innerHTML = '';
            let emails = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).reverse().forEach(key => {
                    const sub = data[key];
                    if (!sub) return;

                    const safeEmail = sub.email || '-';
                    if (safeEmail !== '-') emails.push(safeEmail);
                    
                    const safeDate = new Date(sub.timestamp || Date.now()).toLocaleDateString();
                    
                    subscribersBody.innerHTML += `
                        <tr>
                            <td>${safeDate}</td>
                            <td>${safeEmail}</td>
                            <td><button class="btn-danger delete-sub" data-id="${key}">Delete</button></td>
                        </tr>
                    `;
                });

                // Set Email All link
                if (emailAllBtn) {
                    emailAllBtn.href = `mailto:?bcc=${emails.join(',')}&subject=Updates from Young Technology`;
                }

                // Delete sub listener
                document.querySelectorAll('.delete-sub').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if(confirm('Delete this subscriber?')) {
                            database.ref('subscribers/' + e.target.getAttribute('data-id')).remove();
                        }
                    });
                });
            } else {
                subscribersBody.innerHTML = '<tr><td colspan="3">No subscribers found.</td></tr>';
                if (emailAllBtn) emailAllBtn.href = '#';
            }
        }, (error) => {
            subscribersBody.innerHTML = `<tr><td colspan="3" style="color:#ef4444; font-weight:bold; padding: 2rem;">Firebase Error: ${error.message}</td></tr>`;
            console.error("Firebase Subscribers Error:", error);
        });

        // Load Callbacks
        callbacksRef.on('value', (snapshot) => {
            if (!callbacksBody) return;
            callbacksBody.innerHTML = '';
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).reverse().forEach(key => {
                    const cb = data[key];
                    if (!cb) return;

                    const safeDate = new Date(cb.timestamp || Date.now()).toLocaleString('en-IN');
                    const safePhone = cb.phone || '-';

                    callbacksBody.innerHTML += `
                        <tr>
                            <td>${safeDate}</td>
                            <td><a href="tel:${safePhone}" style="color:var(--primary); font-weight:700;">${safePhone}</a></td>
                            <td><button class="btn-danger delete-callback" data-id="${key}">Delete</button></td>
                        </tr>
                    `;
                });

                // Delete callback listener
                document.querySelectorAll('.delete-callback').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if (confirm('Delete this callback request?')) {
                            database.ref('callbacks/' + e.target.getAttribute('data-id')).remove();
                        }
                    });
                });
            } else {
                callbacksBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem;">No callback requests found.</td></tr>';
            }
        }, (error) => {
            callbacksBody.innerHTML = `<tr><td colspan="3" style="color:#ef4444; font-weight:bold; padding: 2rem;">Firebase Error: ${error.message}</td></tr>`;
            console.error("Firebase Callbacks Error:", error);
        });

        // Load Bookings
        bookingsRef.on('value', (snapshot) => {
            if (!bookingsBody) return;
            bookingsBody.innerHTML = '';
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).reverse().forEach(key => {
                    const b = data[key];
                    if (!b) return;

                    const safeTimestamp = new Date(b.timestamp || Date.now()).toLocaleString('en-IN');
                    const safeDate = b.date || '-';
                    const safeTime = b.time || '-';
                    const safeEmail = b.email || '-';

                    bookingsBody.innerHTML += `
                        <tr>
                            <td>${safeTimestamp}</td>
                            <td><strong>${safeDate}</strong></td>
                            <td><span style="background:var(--badge-bg); color:var(--primary); padding:0.25rem 0.5rem; border-radius:4px; font-weight:600;">${safeTime}</span></td>
                            <td><a href="mailto:${safeEmail}" style="color:var(--primary)">${safeEmail}</a></td>
                            <td><button class="btn-danger delete-booking" data-id="${key}">Delete</button></td>
                        </tr>
                    `;
                });

                // Delete booking listener
                document.querySelectorAll('.delete-booking').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if (confirm('Delete this booking?')) {
                            database.ref('bookings/' + e.target.getAttribute('data-id')).remove();
                        }
                    });
                });
            } else {
                bookingsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No consultation bookings found.</td></tr>';
            }
        }, (error) => {
            bookingsBody.innerHTML = `<tr><td colspan="5" style="color:#ef4444; font-weight:bold; padding: 2rem;">Firebase Error: ${error.message}</td></tr>`;
            console.error("Firebase Bookings Error:", error);
        });

        // --- Projects CRUD Logic ---
        const projectsRef = database.ref('projects');
        const projectsBody = document.getElementById('projects-body');
        const projectFormContainer = document.getElementById('project-form-container');
        const projectForm = document.getElementById('project-form');
        const addProjectBtn = document.getElementById('add-project-btn');
        const cancelProjectBtn = document.getElementById('cancel-project-btn');

        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => {
                projectForm.reset();
                document.getElementById('project-id').value = '';
                document.getElementById('project-form-title').innerText = 'Add New Project';
                projectFormContainer.style.display = 'block';
            });
        }

        if (cancelProjectBtn) {
            cancelProjectBtn.addEventListener('click', () => {
                projectFormContainer.style.display = 'none';
                projectForm.reset();
            });
        }

        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('project-id').value;
                const projectData = {
                    title: document.getElementById('project-title').value,
                    icon: document.getElementById('project-icon').value,
                    category: document.getElementById('project-category').value,
                    techStack: document.getElementById('project-techstack').value,
                    results: document.getElementById('project-results').value,
                    img: document.getElementById('project-img').value,
                    url: document.getElementById('project-url').value,
                    desc: document.getElementById('project-desc').value,
                    timestamp: Date.now()
                };

                if (id) {
                    projectsRef.child(id).update(projectData);
                } else {
                    projectsRef.push().set(projectData);
                }
                
                projectFormContainer.style.display = 'none';
                projectForm.reset();
            });
        }

        projectsRef.on('value', (snapshot) => {
            if (!projectsBody) return;
            projectsBody.innerHTML = '';
            if (snapshot.exists()) {
                const data = snapshot.val();
                let htmlStr = '';
                Object.keys(data).reverse().forEach(key => {
                    const proj = data[key];
                    if (!proj) return;
                    
                    const catText = proj.category ? proj.category.toUpperCase() : 'WEB';
                    
                    htmlStr += `
                        <tr>
                            <td><img src="${proj.img || '1.JPG'}" alt="${proj.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"></td>
                            <td>
                                <strong style="color: var(--text-main); font-size: 1.05rem;">${proj.title}</strong>
                                <span style="background:var(--primary); color:#fff; font-size:0.7rem; font-weight:700; padding:0.15rem 0.4rem; border-radius:4px; margin-left:0.5rem; display:inline-block; line-height:1.2;">${catText}</span><br>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">${proj.desc}</span><br>
                                <span style="font-size: 0.8rem; font-weight:600; color: var(--accent);">Stack: ${proj.techStack || '-'}</span> | 
                                <span style="font-size: 0.8rem; font-weight:600; color: #10b981;">Outcome: ${proj.results || '-'}</span>
                            </td>
                            <td>
                                <div style="display:flex; align-items:center; gap:0.5rem;" title="${proj.icon}">
                                    <i data-lucide="${proj.icon}" style="width:20px; height:20px;"></i>
                                </div>
                            </td>
                            <td>
                                <button class="edit-proj" data-id="${key}" style="background: var(--primary); color: white; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; margin-right: 0.5rem; border:none; cursor:pointer;"
                                    data-title="${proj.title}" data-icon="${proj.icon}" data-category="${proj.category || 'web'}" data-techstack="${proj.techStack || ''}" data-results="${proj.results || ''}" data-img="${proj.img || ''}" data-url="${proj.url || ''}" data-desc="${proj.desc || ''}">Edit</button>
                                <button class="btn-danger delete-proj" data-id="${key}">Delete</button>
                            </td>
                        </tr>
                    `;
                });
                projectsBody.innerHTML = htmlStr;
                
                // Re-render dynamically injected icons
                if(window.lucide) {
                    window.lucide.createIcons();
                }

                // Bind Edit events
                document.querySelectorAll('.edit-proj').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        document.getElementById('project-id').value = id;
                        document.getElementById('project-title').value = e.target.getAttribute('data-title');
                        document.getElementById('project-icon').value = e.target.getAttribute('data-icon');
                        document.getElementById('project-category').value = e.target.getAttribute('data-category');
                        document.getElementById('project-techstack').value = e.target.getAttribute('data-techstack');
                        document.getElementById('project-results').value = e.target.getAttribute('data-results');
                        document.getElementById('project-img').value = e.target.getAttribute('data-img');
                        document.getElementById('project-url').value = e.target.getAttribute('data-url');
                        document.getElementById('project-desc').value = e.target.getAttribute('data-desc');
                        document.getElementById('project-form-title').innerText = 'Edit Project';
                        projectFormContainer.style.display = 'block';
                        document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
                    });
                });

                // Bind Delete events
                document.querySelectorAll('.delete-proj').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if(confirm('Are you absolutely sure you want to delete this project?')) {
                            projectsRef.child(e.target.getAttribute('data-id')).remove();
                        }
                    });
                });
            } else {
                projectsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No projects found in database. Add your first project above!</td></tr>';
            }
        }, (error) => {
            projectsBody.innerHTML = `<tr><td colspan="4" style="color:#ef4444; font-weight:bold; padding: 2rem;">Firebase Error: ${error.message}</td></tr>`;
            console.error("Firebase Projects Error:", error);
        });

        // Helper to generate unique Order ID
        function generateOrderId() {
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let result = 'YT-';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }

        // --- Project Tracking Orders CRUD Logic ---
        if (addOrderBtn) {
            addOrderBtn.addEventListener('click', () => {
                orderForm.reset();
                document.getElementById('order-db-id').value = '';
                document.getElementById('order-progress-label').innerText = '50';
                document.getElementById('order-form-title').innerText = 'Add New Tracking Order';
                orderFormContainer.style.display = 'block';
            });
        }

        if (cancelOrderBtn) {
            cancelOrderBtn.addEventListener('click', () => {
                orderFormContainer.style.display = 'none';
                orderForm.reset();
            });
        }

        if (orderForm) {
            orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const dbId = document.getElementById('order-db-id').value;
                
                const customerName = document.getElementById('order-customer-name').value.trim();
                const customerEmail = document.getElementById('order-customer-email').value.trim();
                const customerMobile = document.getElementById('order-customer-mobile').value.trim();
                const projectName = document.getElementById('order-project-name').value.trim();
                const projectType = document.getElementById('order-project-type').value;
                const milestoneStage = parseInt(document.getElementById('order-milestone-stage').value);
                const startDate = document.getElementById('order-start-date').value;
                const targetDate = document.getElementById('order-target-date').value;
                const progressPercent = parseInt(document.getElementById('order-progress-percent').value);
                const updateDesc = document.getElementById('order-update-desc').value.trim();
                
                let orderId = '';
                
                if (dbId) {
                    try {
                        const snap = await ordersRef.child(dbId).once('value');
                        if (snap.exists()) {
                            orderId = snap.val().orderId;
                        }
                    } catch (err) {
                        console.error("Error reading order ID:", err);
                    }
                }
                
                if (!orderId) {
                    let isUnique = false;
                    let attempts = 0;
                    while (!isUnique && attempts < 10) {
                        orderId = generateOrderId();
                        try {
                            const snap = await ordersRef.orderByChild('orderId').equalTo(orderId).once('value');
                            if (!snap.exists()) {
                                isUnique = true;
                            }
                        } catch (err) {
                            isUnique = true;
                        }
                        attempts++;
                    }
                }
                
                const orderData = {
                    orderId: orderId,
                    customerName: customerName,
                    customerEmail: customerEmail,
                    customerMobile: customerMobile,
                    projectName: projectName,
                    projectType: projectType,
                    milestoneStage: milestoneStage,
                    startDate: startDate,
                    targetDate: targetDate,
                    progressPercent: progressPercent,
                    updateDesc: updateDesc,
                    lastUpdated: Date.now()
                };

                try {
                    if (dbId) {
                        await ordersRef.child(dbId).update(orderData);
                        alert(`Order updated successfully!`);
                    } else {
                        const newRef = ordersRef.push();
                        await newRef.set(orderData);
                        alert(`New Order Created!\nOrder ID: ${orderId}\nGive this ID to the customer to track their project.`);
                    }
                    orderFormContainer.style.display = 'none';
                    orderForm.reset();
                } catch (err) {
                    console.error("Firebase Error saving order:", err);
                    alert("Error saving order: " + err.message);
                }
            });
        }

        ordersRef.on('value', (snapshot) => {
            if (!ordersBody) return;
            ordersBody.innerHTML = '';
            if (snapshot.exists()) {
                const data = snapshot.val();
                let htmlStr = '';
                Object.keys(data).reverse().forEach(key => {
                    const order = data[key];
                    if (!order) return;
                    
                    let typeLabel = 'Web Dev';
                    let typeBadgeClass = 'rgba(99, 102, 241, 0.15)';
                    let typeColor = 'var(--primary)';
                    if (order.projectType === 'app') {
                        typeLabel = 'Mobile App';
                        typeBadgeClass = 'rgba(168, 85, 247, 0.15)';
                        typeColor = 'var(--secondary)';
                    } else if (order.projectType === 'realtime') {
                        typeLabel = 'Realtime IoT';
                        typeBadgeClass = 'rgba(6, 182, 212, 0.15)';
                        typeColor = 'var(--accent)';
                    }

                    const milestoneLabels = {
                        1: "1. Requirement & Design",
                        2: "2. Frontend/Hardware Prototype",
                        3: "3. Core Development",
                        4: "4. Quality Testing",
                        5: "5. Ready for Deployment",
                        6: "6. Completed & Handover"
                    };
                    const milestoneText = milestoneLabels[order.milestoneStage] || '1. Requirements & Design';

                    htmlStr += `
                        <tr>
                            <td>
                                <strong style="color: var(--primary); font-size: 1.1rem; font-family: var(--font-heading);">${order.orderId}</strong>
                            </td>
                            <td>
                                <strong style="color: var(--text-main);">${order.customerName}</strong><br>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">${order.customerEmail}</span><br>
                                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">${order.customerMobile}</span>
                            </td>
                            <td>
                                <strong style="color: var(--text-main);">${order.projectName}</strong><br>
                                <span style="background:${typeBadgeClass}; color:${typeColor}; font-size:0.75rem; font-weight:700; padding:0.15rem 0.4rem; border-radius:4px; display:inline-block; margin-top:0.25rem;">${typeLabel}</span>
                            </td>
                            <td>
                                <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-main);">${milestoneText}</span><br>
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                                    <div style="flex: 1; min-width: 100px; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${order.progressPercent}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary));"></div>
                                    </div>
                                    <span style="font-size: 0.8rem; font-weight: 700; color: #10b981;">${order.progressPercent}%</span>
                                </div>
                                <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 0.25rem; font-style: italic;">Update: "${order.updateDesc.substring(0, 45)}${order.updateDesc.length > 45 ? '...' : ''}"</span>
                            </td>
                            <td>
                                <button class="edit-order btn-primary" data-id="${key}" style="padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; margin-right: 0.5rem; cursor:pointer; background: var(--primary); border:none;"
                                    data-orderid="${order.orderId}"
                                    data-name="${order.customerName}" 
                                    data-email="${order.customerEmail}" 
                                    data-mobile="${order.customerMobile}" 
                                    data-project="${order.projectName}" 
                                    data-type="${order.projectType}" 
                                    data-milestone="${order.milestoneStage}" 
                                    data-start="${order.startDate}" 
                                    data-target="${order.targetDate}" 
                                    data-progress="${order.progressPercent}" 
                                    data-desc="${order.updateDesc}">Edit</button>
                                <button class="btn-danger delete-order" data-id="${key}">Delete</button>
                            </td>
                        </tr>
                    `;
                });
                ordersBody.innerHTML = htmlStr;

                // Bind Edit Order Click Events
                document.querySelectorAll('.edit-order').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        document.getElementById('order-db-id').value = id;
                        document.getElementById('order-customer-name').value = e.target.getAttribute('data-name');
                        document.getElementById('order-customer-email').value = e.target.getAttribute('data-email');
                        document.getElementById('order-customer-mobile').value = e.target.getAttribute('data-mobile');
                        document.getElementById('order-project-name').value = e.target.getAttribute('data-project');
                        document.getElementById('order-project-type').value = e.target.getAttribute('data-type');
                        document.getElementById('order-milestone-stage').value = e.target.getAttribute('data-milestone');
                        document.getElementById('order-start-date').value = e.target.getAttribute('data-start');
                        document.getElementById('order-target-date').value = e.target.getAttribute('data-target');
                        
                        const progress = e.target.getAttribute('data-progress');
                        document.getElementById('order-progress-percent').value = progress;
                        document.getElementById('order-progress-label').innerText = progress;
                        
                        document.getElementById('order-update-desc').value = e.target.getAttribute('data-desc');
                        
                        document.getElementById('order-form-title').innerText = 'Edit Tracking Order';
                        orderFormContainer.style.display = 'block';
                        document.getElementById('orders').scrollIntoView({ behavior: 'smooth' });
                    });
                });

                // Bind Delete Order Click Events
                document.querySelectorAll('.delete-order').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if(confirm('Are you absolutely sure you want to delete this project tracking order?')) {
                            ordersRef.child(e.target.getAttribute('data-id')).remove();
                        }
                    });
                });
            } else {
                ordersBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No tracking orders found. Click "Add Order" to create one.</td></tr>';
            }
        }, (error) => {
            ordersBody.innerHTML = `<tr><td colspan="5" style="color:#ef4444; font-weight:bold; padding: 2rem;">Firebase Error: ${error.message}</td></tr>`;
            console.error("Firebase Orders Error:", error);
        });

        // --- Admin Navigation Tabs Logic ---
        const tabs = document.querySelectorAll('.admin-sidebar a[href^="#"]');
        const sections = document.querySelectorAll('.admin-card');
        
        sections.forEach(s => {
            if(s.id !== 'messages') s.style.display = 'none';
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const targetId = tab.getAttribute('href').substring(1);
                sections.forEach(s => {
                    if(s.id === targetId) {
                        s.style.display = 'block';
                    } else {
                        s.style.display = 'none';
                    }
                });
            });
        });
    }

    // ==========================================
    // SECURITY CONTROL: Anti-Inspection & DevTools Block
    // ==========================================
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
        }
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
        }
    });

    // Active anti-debugger loop to freeze inspector
    setInterval(function() {
        try {
            (function debuggerProtection(i) {
                if (('' + i / i).length !== 1 || i % 20 === 0) {
                    (function() {}
                    .constructor('debugger')());
                } else {
                    (function() {}
                    .constructor('debugger')());
                }
                debuggerProtection(++i);
            })(0);
        } catch (e) {}
    }, 100);
});
