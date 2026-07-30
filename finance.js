// Standalone Finance Panel Controller for Young Tech
// Handles Secure Gateway, Real-time calculations, Chart.js integrations, and CRUD operations

// Firebase global compat configurations
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
if (window.firebase && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// Security Credentials
const AUTHORIZED_EMAIL = "rithishv1303@gmail.com";
const AUTH_HASH = "0d2ad5f2caadc01314a936b238fbcfd25d1d63bb1dd4806fb142e02142fff7d6"; // SHA-256 hash of Rithish@1303

// SHA-256 hashing utility
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Global Application State
let paymentsData = {};
let expendituresData = {};
let ordersData = {};

// Chart Instances (to prevent canvas overlap errors on redraws)
let trendChartInstance = null;
let expenseChartInstance = null;
let categoryChartInstance = null;
let statusChartInstance = null;

// Currency Formatter Utility (Indian Rupees ₹)
const rupeeFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
});

document.addEventListener('DOMContentLoaded', () => {
    // Inject Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Set Header Date String
    const headerDate = document.getElementById('header-date-string');
    if (headerDate) {
        headerDate.textContent = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Bind Security Authentication
    initSecurityGate();
});

// =========================================================================
// 1. SECURITY & SESSION MANAGER
// =========================================================================
function initSecurityGate() {
    const authOverlay = document.getElementById('finance-auth-overlay');
    const dashboardLayout = document.getElementById('finance-dashboard');
    const loginForm = document.getElementById('finance-login-form');
    const emailInput = document.getElementById('finance-email');
    const passwordInput = document.getElementById('finance-password');
    const loginBtn = document.getElementById('finance-login-btn');
    const authError = document.getElementById('finance-auth-error');
    const logoutBtn = document.getElementById('finance-logout-btn');

    // Check session validity (shared with admin dashboard)
    const savedToken = sessionStorage.getItem('admin_token');
    const savedTime = sessionStorage.getItem('admin_timestamp');
    const now = Date.now();
    const isSessionValid = savedToken === AUTH_HASH && savedTime && (now - parseInt(savedTime) < 2 * 60 * 60 * 1000); // 2 hours

    if (isSessionValid) {
        revealDashboard();
    } else {
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleLogin();
            });
        }
    }

    async function handleLogin() {
        const enteredEmail = emailInput.value.trim().toLowerCase();
        const enteredPasscode = passwordInput.value;
        const enteredHash = await sha256(enteredPasscode);

        if (authError) authError.style.display = 'none';

        if (enteredEmail !== AUTHORIZED_EMAIL || enteredHash !== AUTH_HASH) {
            if (authError) {
                authError.textContent = "Access Denied: Invalid email or security passcode.";
                authError.style.display = "block";
                
                // Visual feedback shake
                passwordInput.style.borderColor = "#ef4444";
                passwordInput.style.transform = "translateX(5px)";
                setTimeout(() => passwordInput.style.transform = "translateX(-5px)", 80);
                setTimeout(() => passwordInput.style.transform = "translateX(5px)", 160);
                setTimeout(() => passwordInput.style.transform = "translateX(0)", 240);
            }
            return;
        }

        // Credentials matched! Log in
        loginBtn.disabled = true;
        const origText = loginBtn.innerHTML;
        loginBtn.innerHTML = 'Establishing secure gateway... <i data-lucide="loader" class="spin"></i>';
        if (window.lucide) window.lucide.createIcons();

        try {
            // Sign in to Firebase Auth silently
            if (window.firebase && firebase.auth) {
                await firebase.auth().signInWithEmailAndPassword(enteredEmail, enteredPasscode);
            }

            // Save active token
            sessionStorage.setItem('admin_token', AUTH_HASH);
            sessionStorage.setItem('admin_timestamp', Date.now().toString());

            revealDashboard();
        } catch (error) {
            console.error("Firebase auth error: ", error);
            // Fallback: Proceed locally if firebase auth provider isn't fully set up,
            // as long as passcode hash matches.
            sessionStorage.setItem('admin_token', AUTH_HASH);
            sessionStorage.setItem('admin_timestamp', Date.now().toString());
            revealDashboard();
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = origText;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    function revealDashboard() {
        if (authOverlay) authOverlay.style.display = 'none';
        if (dashboardLayout) dashboardLayout.style.display = 'grid';
        
        // Start dashboard initializations
        initDashboard();
    }

    // Logout Action
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to lock the session and logout?')) {
                sessionStorage.removeItem('admin_token');
                sessionStorage.removeItem('admin_timestamp');
                if (window.firebase && firebase.auth) {
                    firebase.auth().signOut().catch(() => {});
                }
                window.location.reload();
            }
        });
    }
}

// =========================================================================
// 2. DASHBOARD INITIALIZATION & NAVIGATION
// =========================================================================
function initDashboard() {
    // Navigation tabs logic
    const tabs = document.querySelectorAll('.sidebar-nav a');
    const sections = {
        overview: document.getElementById('section-overview'),
        sales: document.getElementById('section-sales'),
        expenditures: document.getElementById('section-expenditures'),
        reports: document.getElementById('section-reports')
    };
    const titleSpan = document.getElementById('current-section-title');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle active tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Toggle sections
            const target = tab.getAttribute('href').substring(1);
            Object.keys(sections).forEach(key => {
                if (sections[key]) {
                    sections[key].style.display = (key === target) ? 'block' : 'none';
                }
            });

            // Update title
            if (titleSpan) {
                const cleanName = tab.textContent.trim();
                titleSpan.innerHTML = `Finance <span class="gradient-text">${cleanName}</span>`;
            }
            
            // Re-layout Chart.js charts on tab switch to ensure proper rendering width
            if (target === 'overview') {
                updateCharts();
            }
        });
    });

    // Start fetching Firebase Database Realtime Bindings
    bindFirebaseData();
}

// =========================================================================
// 3. FIREBASE REAL-TIME DATABASE BINDINGS
// =========================================================================
function bindFirebaseData() {
    const ordersRef = database.ref('orders');
    const paymentsRef = database.ref('payments');
    const expendituresRef = database.ref('expenditures');

    let isOrdersLoaded = false;
    let isPaymentsLoaded = false;
    let isExpendituresLoaded = false;

    // A. Bind active projects/orders for CRM Dropdown Linker
    ordersRef.on('value', (snapshot) => {
        ordersData = snapshot.val() || {};
        isOrdersLoaded = true;
        updateOrderDropdown();
        checkAndRecalculate();
    });

    // B. Bind Payments & Sales Data
    paymentsRef.on('value', (snapshot) => {
        paymentsData = snapshot.val() || {};
        isPaymentsLoaded = true;
        renderPaymentsTable();
        checkAndRecalculate();
    });

    // C. Bind General Expenditures Data
    expendituresRef.on('value', (snapshot) => {
        expendituresData = snapshot.val() || {};
        isExpendituresLoaded = true;
        renderExpendituresTable();
        checkAndRecalculate();
    });

    // Run recalculations when all nodes emit values
    function checkAndRecalculate() {
        if (isPaymentsLoaded && isExpendituresLoaded) {
            recalculateFinancials();
        }
    }

    // Initialize UI form handlers
    initFormHandlers();
}

// Populate the Project Link dropdown in the sales form
function updateOrderDropdown() {
    const linkSelect = document.getElementById('payment-order-link');
    if (!linkSelect) return;

    linkSelect.innerHTML = '<option value="">-- Standalone (No Order Link) --</option>';
    
    // Sort orders by last updated or ID
    Object.keys(ordersData).reverse().forEach(key => {
        const order = ordersData[key];
        if (!order) return;
        
        linkSelect.innerHTML += `
            <option value="${key}">${order.orderId} - ${order.customerName} (${order.projectName})</option>
        `;
    });
}

// =========================================================================
// 4. FINANCIAL ACCOUNTING CALCULATIONS
// =========================================================================
function recalculateFinancials() {
    let totalRevenue = 0;      // Sum of amountPaid from projects
    let totalDirectCosts = 0;   // Sum of direct project expenses
    let totalGeneralExpenses = 0; // Sum of general business expenditures
    let totalPendingPayments = 0; // Contract Value - Amount Paid

    // 1. Calculate project payments metrics
    Object.keys(paymentsData).forEach(key => {
        const payment = paymentsData[key];
        if (!payment) return;

        totalRevenue += parseFloat(payment.amountPaid || 0);
        totalDirectCosts += parseFloat(payment.expenses || 0);
        
        const contract = parseFloat(payment.contractValue || 0);
        const paid = parseFloat(payment.amountPaid || 0);
        if (contract > paid) {
            totalPendingPayments += (contract - paid);
        }
    });

    // 2. Calculate general business expenditures
    Object.keys(expendituresData).forEach(key => {
        const exp = expendituresData[key];
        if (!exp) return;

        totalGeneralExpenses += parseFloat(exp.amount || 0);
    });

    const totalExpenditures = totalDirectCosts + totalGeneralExpenses;
    const netProfit = totalRevenue - totalExpenditures;
    
    // Profit Margin %
    let profitMargin = 0;
    if (totalRevenue > 0) {
        profitMargin = (netProfit / totalRevenue) * 100;
    }

    // Update KPI Card UI elements
    document.getElementById('kpi-total-revenue').textContent = rupeeFormatter.format(totalRevenue);
    document.getElementById('kpi-total-expenses').textContent = rupeeFormatter.format(totalExpenditures);
    
    const profitEl = document.getElementById('kpi-net-profit');
    profitEl.textContent = rupeeFormatter.format(netProfit);
    
    // Color-code profit KPI indicator
    const trendEl = document.getElementById('kpi-profit-trend');
    if (netProfit >= 0) {
        profitEl.style.color = 'var(--success)';
        trendEl.innerHTML = '<i data-lucide="trending-up" style="width:12px;"></i> Realized Profit';
        trendEl.style.color = 'var(--success)';
    } else {
        profitEl.style.color = 'var(--danger)';
        trendEl.innerHTML = '<i data-lucide="trending-down" style="width:12px;"></i> Capital Loss';
        trendEl.style.color = 'var(--danger)';
    }

    document.getElementById('kpi-profit-margin').textContent = `${profitMargin.toFixed(1)}%`;
    document.getElementById('kpi-pending-payments').textContent = rupeeFormatter.format(totalPendingPayments);

    // Update Aggregated summary in Reports section
    document.getElementById('pl-total-revenue').textContent = rupeeFormatter.format(totalRevenue);
    document.getElementById('pl-total-expenses').textContent = rupeeFormatter.format(totalExpenditures);
    
    const plProfitEl = document.getElementById('pl-net-profit');
    plProfitEl.textContent = rupeeFormatter.format(netProfit);
    plProfitEl.style.color = (netProfit >= 0) ? 'var(--success)' : 'var(--danger)';
    
    document.getElementById('pl-profit-margin').textContent = `${profitMargin.toFixed(1)}%`;

    if (window.lucide) window.lucide.createIcons();

    // Render reports breakdown lists
    renderReportBreakdowns(totalDirectCosts, totalGeneralExpenses);

    // Render charts
    updateCharts();
}

// =========================================================================
// 5. CHART.JS VISUALIZATION CONTROLLER
// =========================================================================
function updateCharts() {
    // Retrieve canvases
    const trendCtx = document.getElementById('trendChart')?.getContext('2d');
    const expenseCtx = document.getElementById('expenseChart')?.getContext('2d');
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');

    if (!trendCtx || !expenseCtx || !categoryCtx || !statusCtx) return;

    // Aggregate monthly data for Trend Chart (Revenue, Expenses, Profits)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRev = new Array(12).fill(0);
    const monthlyExp = new Array(12).fill(0);
    const monthlyProf = new Array(12).fill(0);

    // Process Payments into monthly buckets
    Object.keys(paymentsData).forEach(key => {
        const p = paymentsData[key];
        if (!p || !p.date) return;
        const pDate = new Date(p.date);
        const monthIndex = pDate.getMonth();
        
        monthlyRev[monthIndex] += parseFloat(p.amountPaid || 0);
        monthlyExp[monthIndex] += parseFloat(p.expenses || 0); // direct cost
    });

    // Process Expenditures into monthly buckets
    Object.keys(expendituresData).forEach(key => {
        const e = expendituresData[key];
        if (!e || !e.date) return;
        const eDate = new Date(e.date);
        const monthIndex = eDate.getMonth();
        
        monthlyExp[monthIndex] += parseFloat(e.amount || 0); // general cost
    });

    // Calculate monthly net profit
    for (let i = 0; i < 12; i++) {
        monthlyProf[i] = monthlyRev[i] - monthlyExp[i];
    }

    // Chart colors matching glassmorphic design system
    const purpleGlow = 'rgba(168, 85, 247, 0.85)';
    const indigoGlow = 'rgba(99, 102, 241, 0.85)';
    const redGlow = 'rgba(239, 68, 68, 0.85)';
    const greenGlow = 'rgba(16, 185, 129, 0.9)';
    const cyanGlow = 'rgba(6, 182, 212, 0.85)';

    // A. TREND CHART (Bar & Line Hybrid)
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(trendCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Revenue Inflow',
                    data: monthlyRev,
                    backgroundColor: indigoGlow,
                    borderRadius: 6,
                    borderWidth: 0,
                    order: 2
                },
                {
                    label: 'Expenditure Cost',
                    data: monthlyExp,
                    backgroundColor: redGlow,
                    borderRadius: 6,
                    borderWidth: 0,
                    order: 2
                },
                {
                    label: 'Net P&L (Profit/Loss)',
                    data: monthlyProf,
                    borderColor: greenGlow,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: greenGlow,
                    pointHoverRadius: 6,
                    type: 'line',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Outfit' } } }
            },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // B. EXPENSE ALLOCATION PIE CHART
    const expCategories = {
        "Developer Payouts": 0,
        "Infrastructure / Hosting": 0,
        "Software / SaaS": 0,
        "Marketing / Ads": 0,
        "Office / Operations": 0,
        "Taxes & Fees": 0,
        "Miscellaneous": 0
    };

    // Aggregate general expenditures
    Object.keys(expendituresData).forEach(key => {
        const e = expendituresData[key];
        if (!e) return;
        const cat = e.category || 'Miscellaneous';
        if (expCategories[cat] !== undefined) {
            expCategories[cat] += parseFloat(e.amount || 0);
        } else {
            expCategories["Miscellaneous"] += parseFloat(e.amount || 0);
        }
    });

    // Add direct project expenses as a category
    let projectCosts = 0;
    Object.keys(paymentsData).forEach(key => {
        const p = paymentsData[key];
        if (p) projectCosts += parseFloat(p.expenses || 0);
    });

    const expLabels = ["Direct Project Costs", ...Object.keys(expCategories)];
    const expValues = [projectCosts, ...Object.values(expCategories)];

    // Filter out categories with zero value for cleaner visual representation
    const filteredExp = expLabels.reduce((acc, label, index) => {
        if (expValues[index] > 0) {
            acc.labels.push(label);
            acc.values.push(expValues[index]);
        }
        return acc;
    }, { labels: [], values: [] });

    if (expenseChartInstance) expenseChartInstance.destroy();
    expenseChartInstance = new Chart(expenseCtx, {
        type: 'pie',
        data: {
            labels: filteredExp.labels.length ? filteredExp.labels : ["No Expenses"],
            datasets: [{
                data: filteredExp.values.length ? filteredExp.values : [1],
                backgroundColor: [
                    purpleGlow, indigoGlow, redGlow, cyanGlow, 'rgba(245, 158, 11, 0.85)', 'rgba(16, 185, 129, 0.85)', 'rgba(236, 72, 153, 0.85)', 'rgba(107, 114, 128, 0.85)'
                ],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
                }
            }
        }
    });

    // C. INCOME BY PROJECT CATEGORY DOUGHNUT CHART
    const typeRevenue = {
        web: 0,
        app: 0,
        other: 0
    };

    Object.keys(paymentsData).forEach(key => {
        const p = paymentsData[key];
        if (!p) return;
        const type = p.projectType || 'other';
        if (typeRevenue[type] !== undefined) {
            typeRevenue[type] += parseFloat(p.amountPaid || 0);
        } else {
            typeRevenue['other'] += parseFloat(p.amountPaid || 0);
        }
    });

    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Web Development', 'Mobile Apps', 'Other Services'],
            datasets: [{
                data: [typeRevenue.web, typeRevenue.app, typeRevenue.other],
                backgroundColor: [indigoGlow, purpleGlow, cyanGlow],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
                }
            },
            cutout: '65%'
        }
    });

    // D. PAYMENT STATUS DISTRIBUTION
    let statusPaidCount = 0;
    let statusPartialCount = 0;
    let statusUnpaidCount = 0;

    Object.keys(paymentsData).forEach(key => {
        const p = paymentsData[key];
        if (!p) return;
        if (p.paymentStatus === 'paid') statusPaidCount++;
        else if (p.paymentStatus === 'partially') statusPartialCount++;
        else statusUnpaidCount++;
    });

    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fully Paid', 'Partially Paid', 'Unpaid'],
            datasets: [{
                data: [statusPaidCount, statusPartialCount, statusUnpaidCount],
                backgroundColor: [greenGlow, 'rgba(245, 158, 11, 0.85)', redGlow],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
                }
            },
            cutout: '65%'
        }
    });
}

// =========================================================================
// 6. SALES & PROJECT PAYMENTS MANAGER (CRUD)
// =========================================================================
function renderPaymentsTable() {
    const body = document.getElementById('payments-body');
    const statusFilter = document.getElementById('sales-status-filter').value;
    const searchQuery = document.getElementById('sales-search').value.toLowerCase().trim();

    if (!body) return;
    body.innerHTML = '';

    const keys = Object.keys(paymentsData).reverse();
    let rowsHtml = '';
    let matchCount = 0;

    keys.forEach(key => {
        const p = paymentsData[key];
        if (!p) return;

        // Apply Status Filter
        if (statusFilter !== 'all' && p.paymentStatus !== statusFilter) return;

        // Apply Search Filter
        const clientName = (p.clientName || '').toLowerCase();
        const projectName = (p.projectName || '').toLowerCase();
        const txnId = (p.paymentId || '').toLowerCase();
        if (searchQuery && !clientName.includes(searchQuery) && !projectName.includes(searchQuery) && !txnId.includes(searchQuery)) return;

        matchCount++;

        const contract = parseFloat(p.contractValue || 0);
        const received = parseFloat(p.amountPaid || 0);
        const pending = contract - received;
        const expenses = parseFloat(p.expenses || 0);
        const profit = received - expenses;

        // Project Type Badge styling
        let typeText = 'Web Dev';
        let typeColor = 'var(--primary)';
        let typeBg = 'rgba(99, 102, 241, 0.15)';
        if (p.projectType === 'app') {
            typeText = 'Mobile App';
            typeColor = 'var(--secondary)';
            typeBg = 'rgba(168, 85, 247, 0.15)';
        } else if (p.projectType === 'other') {
            typeText = 'Other';
            typeColor = 'var(--accent)';
            typeBg = 'rgba(6, 182, 212, 0.15)';
        }

        // Status Badge
        let statusText = 'Fully Paid';
        let statusBadge = 'badge-success';
        if (p.paymentStatus === 'partially') {
            statusText = 'Partial';
            statusBadge = 'badge-warning';
        } else if (p.paymentStatus === 'unpaid') {
            statusText = 'Unpaid';
            statusBadge = 'badge-danger';
        }

        const formattedDate = p.date ? new Date(p.date).toLocaleDateString('en-IN') : '-';

        rowsHtml += `
            <tr>
                <td><strong style="color:var(--primary); font-family:var(--font-heading); font-size:0.9rem;">${p.paymentId || 'TXN-000000'}</strong></td>
                <td>
                    <strong style="color:var(--text-main); font-size:0.95rem;">${p.clientName || 'Anonymous'}</strong><br>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${p.projectName || 'General Project'}</span>
                    <span style="background:${typeBg}; color:${typeColor}; font-size:0.68rem; font-weight:700; padding:0.1rem 0.3rem; border-radius:4px; margin-left:0.3rem;">${typeText}</span>
                </td>
                <td><strong>${rupeeFormatter.format(contract)}</strong></td>
                <td style="color:var(--success);"><strong>${rupeeFormatter.format(received)}</strong></td>
                <td style="color:${pending > 0 ? 'var(--warning)' : 'var(--text-muted)'}; font-weight:600;">${rupeeFormatter.format(pending)}</td>
                <td style="color:var(--danger);">${rupeeFormatter.format(expenses)}</td>
                <td style="color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">${rupeeFormatter.format(profit)}</td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                <td><span style="font-size:0.8rem; color:var(--text-muted);">${formattedDate}</span></td>
                <td>
                    <button class="btn-table-action btn-table-edit edit-payment" data-id="${key}" title="Edit"><i data-lucide="edit-3" style="width:16px;"></i></button>
                    <button class="btn-table-action btn-table-delete delete-payment" data-id="${key}" title="Delete"><i data-lucide="trash-2" style="width:16px;"></i></button>
                </td>
            </tr>
        `;
    });

    if (matchCount === 0) {
        body.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 2.5rem; color:var(--text-muted);">No matching payment records found.</td></tr>';
    } else {
        body.innerHTML = rowsHtml;
        bindPaymentTableActions();
    }

    if (window.lucide) window.lucide.createIcons();
}

function bindPaymentTableActions() {
    // Edit Action
    document.querySelectorAll('.edit-payment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.target.closest('.edit-payment');
            const id = btnEl.getAttribute('data-id');
            const p = paymentsData[id];
            if (!p) return;

            document.getElementById('payment-db-id').value = id;
            document.getElementById('payment-order-link').value = p.orderLinkId || '';
            document.getElementById('payment-client-name').value = p.clientName || '';
            document.getElementById('payment-project-name').value = p.projectName || '';
            document.getElementById('payment-project-type').value = p.projectType || 'web';
            document.getElementById('payment-contract-value').value = p.contractValue || 0;
            document.getElementById('payment-amount-paid').value = p.amountPaid || 0;
            document.getElementById('payment-expenses').value = p.expenses || 0;
            document.getElementById('payment-method').value = p.paymentMethod || 'Bank Transfer';
            document.getElementById('payment-status').value = p.paymentStatus || 'paid';
            document.getElementById('payment-date').value = p.date || '';
            document.getElementById('payment-due-date').value = p.dueDate || '';
            document.getElementById('payment-notes').value = p.notes || '';

            document.getElementById('payment-form-title').textContent = `Edit Project Payment [${p.paymentId}]`;
            document.getElementById('payment-form-container').style.display = 'block';
            document.getElementById('payment-form-container').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Delete Action
    document.querySelectorAll('.delete-payment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.target.closest('.delete-payment');
            const id = btnEl.getAttribute('data-id');
            const p = paymentsData[id];
            if (!p) return;

            if (confirm(`Are you absolutely sure you want to delete payment transaction [${p.paymentId}] for ${p.clientName}?\nThis will permanently recalculate all company reports.`)) {
                database.ref('payments/' + id).remove()
                    .then(() => alert("Payment transaction deleted successfully."))
                    .catch(err => alert("Error deleting payment: " + err.message));
            }
        });
    });
}

// =========================================================================
// 7. EXPENDITURE MANAGER (CRUD)
// =========================================================================
function renderExpendituresTable() {
    const body = document.getElementById('expenses-body');
    const categoryFilter = document.getElementById('expenses-category-filter').value;
    const searchQuery = document.getElementById('expenses-search').value.toLowerCase().trim();

    if (!body) return;
    body.innerHTML = '';

    const keys = Object.keys(expendituresData).reverse();
    let rowsHtml = '';
    let matchCount = 0;

    keys.forEach(key => {
        const e = expendituresData[key];
        if (!e) return;

        // Apply Category Filter
        if (categoryFilter !== 'all' && e.category !== categoryFilter) return;

        // Apply Search Filter
        const title = (e.title || '').toLowerCase();
        const vendor = (e.vendor || '').toLowerCase();
        const ref = (e.refId || '').toLowerCase();
        if (searchQuery && !title.includes(searchQuery) && !vendor.includes(searchQuery) && !ref.includes(searchQuery)) return;

        matchCount++;

        // Category Badges
        let badgeColorClass = 'badge-info';
        if (e.category === 'Developer Payouts') badgeColorClass = 'badge-success';
        else if (e.category === 'Infrastructure / Hosting') badgeColorClass = 'badge-warning';
        else if (e.category === 'Software / SaaS') badgeColorClass = 'badge-success';
        else if (e.category === 'Marketing / Ads') badgeColorClass = 'badge-danger';
        else if (e.category === 'Taxes & Fees') badgeColorClass = 'badge-danger';

        const formattedDate = e.date ? new Date(e.date).toLocaleDateString('en-IN') : '-';

        rowsHtml += `
            <tr>
                <td><span style="font-size:0.82rem; color:var(--text-muted);">${formattedDate}</span></td>
                <td>
                    <strong style="color:var(--text-main); font-size:0.95rem;">${e.title || '-'}</strong><br>
                    <span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">${e.notes ? '"' + e.notes.substring(0, 40) + (e.notes.length > 40 ? '...' : '') + '"' : ''}</span>
                </td>
                <td><span class="badge ${badgeColorClass}">${e.category || 'General'}</span></td>
                <td><strong>${e.vendor || '-'}</strong></td>
                <td><span style="font-family:monospace; font-size:0.85rem; color:var(--text-muted);">${e.refId || '-'}</span></td>
                <td style="color:var(--danger); font-weight:700;">-${rupeeFormatter.format(e.amount || 0)}</td>
                <td>
                    <button class="btn-table-action btn-table-edit edit-expense" data-id="${key}" title="Edit"><i data-lucide="edit-3" style="width:16px;"></i></button>
                    <button class="btn-table-action btn-table-delete delete-expense" data-id="${key}" title="Delete"><i data-lucide="trash-2" style="width:16px;"></i></button>
                </td>
            </tr>
        `;
    });

    if (matchCount === 0) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color:var(--text-muted);">No matching business expenditures found.</td></tr>';
    } else {
        body.innerHTML = rowsHtml;
        bindExpenditureTableActions();
    }

    if (window.lucide) window.lucide.createIcons();
}

function bindExpenditureTableActions() {
    // Edit Action
    document.querySelectorAll('.edit-expense').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.target.closest('.edit-expense');
            const id = btnEl.getAttribute('data-id');
            const exp = expendituresData[id];
            if (!exp) return;

            document.getElementById('expense-db-id').value = id;
            document.getElementById('expense-title').value = exp.title || '';
            document.getElementById('expense-category').value = exp.category || 'Developer Payouts';
            document.getElementById('expense-amount').value = exp.amount || 0;
            document.getElementById('expense-date').value = exp.date || '';
            document.getElementById('expense-vendor').value = exp.vendor || '';
            document.getElementById('expense-ref').value = exp.refId || '';
            document.getElementById('expense-notes').value = exp.notes || '';

            document.getElementById('expense-form-title').textContent = `Edit Business Expense: ${exp.title}`;
            document.getElementById('expense-form-container').style.display = 'block';
            document.getElementById('expense-form-container').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Delete Action
    document.querySelectorAll('.delete-expense').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.target.closest('.delete-expense');
            const id = btnEl.getAttribute('data-id');
            const exp = expendituresData[id];
            if (!exp) return;

            if (confirm(`Are you absolutely sure you want to delete the logged expense: "${exp.title}" for ${rupeeFormatter.format(exp.amount)}?\nThis will permanently update company reports.`)) {
                database.ref('expenditures/' + id).remove()
                    .then(() => alert("Expense log deleted successfully."))
                    .catch(err => alert("Error deleting expense log: " + err.message));
            }
        });
    });
}

// =========================================================================
// 8. FORM HANDLERS & CRM INTERACTIVE LINKER
// =========================================================================
function initFormHandlers() {
    // Project Linker interactive auto-fills
    const orderLinkSelect = document.getElementById('payment-order-link');
    const clientNameInput = document.getElementById('payment-client-name');
    const projectNameInput = document.getElementById('payment-project-name');
    const projectTypeSelect = document.getElementById('payment-project-type');

    if (orderLinkSelect) {
        orderLinkSelect.addEventListener('change', () => {
            const selectedKey = orderLinkSelect.value;
            if (!selectedKey) return; // Let user fill details manually

            const order = ordersData[selectedKey];
            if (order) {
                clientNameInput.value = order.customerName || '';
                projectNameInput.value = order.projectName || '';
                projectTypeSelect.value = order.projectType || 'web';
            }
        });
    }

    // Toggle Payment Form
    const addPaymentBtn = document.getElementById('add-payment-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    const paymentFormContainer = document.getElementById('payment-form-container');
    const paymentForm = document.getElementById('payment-form');

    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', () => {
            paymentForm.reset();
            document.getElementById('payment-db-id').value = '';
            document.getElementById('payment-form-title').textContent = 'Record Project Payment';
            paymentFormContainer.style.display = (paymentFormContainer.style.display === 'block') ? 'none' : 'block';
            if (paymentFormContainer.style.display === 'block') {
                paymentFormContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', () => {
            paymentFormContainer.style.display = 'none';
            paymentForm.reset();
        });
    }

    // Toggle Expense Form
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
    const expenseFormContainer = document.getElementById('expense-form-container');
    const expenseForm = document.getElementById('expense-form');

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            expenseForm.reset();
            document.getElementById('expense-db-id').value = '';
            document.getElementById('expense-form-title').textContent = 'Log Business Expense';
            expenseFormContainer.style.display = (expenseFormContainer.style.display === 'block') ? 'none' : 'block';
            if (expenseFormContainer.style.display === 'block') {
                expenseFormContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (cancelExpenseBtn) {
        cancelExpenseBtn.addEventListener('click', () => {
            expenseFormContainer.style.display = 'none';
            expenseForm.reset();
        });
    }

    // A. Submit Payment Record
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dbId = document.getElementById('payment-db-id').value;
            
            // Unique transaction ID generator
            let txnId = 'TXN-';
            if (dbId && paymentsData[dbId]) {
                txnId = paymentsData[dbId].paymentId;
            } else {
                const randomDigits = Math.floor(100000 + Math.random() * 900000);
                txnId += randomDigits;
            }

            const paymentObj = {
                paymentId: txnId,
                orderLinkId: orderLinkSelect.value || '',
                clientName: clientNameInput.value.trim(),
                projectName: projectNameInput.value.trim(),
                projectType: projectTypeSelect.value,
                contractValue: parseFloat(document.getElementById('payment-contract-value').value || 0),
                amountPaid: parseFloat(document.getElementById('payment-amount-paid').value || 0),
                expenses: parseFloat(document.getElementById('payment-expenses').value || 0),
                paymentMethod: document.getElementById('payment-method').value,
                paymentStatus: document.getElementById('payment-status').value,
                date: document.getElementById('payment-date').value,
                dueDate: document.getElementById('payment-due-date').value || '',
                notes: document.getElementById('payment-notes').value.trim(),
                lastUpdated: Date.now()
            };

            const paymentsRef = database.ref('payments');
            if (dbId) {
                paymentsRef.child(dbId).update(paymentObj)
                    .then(() => {
                        alert("Payment transaction updated successfully.");
                        paymentFormContainer.style.display = 'none';
                        paymentForm.reset();
                    })
                    .catch(err => alert("Error updating payment: " + err.message));
            } else {
                paymentsRef.push().set(paymentObj)
                    .then(() => {
                        alert(`New payment recorded successfully!\nTransaction ID: ${txnId}`);
                        paymentFormContainer.style.display = 'none';
                        paymentForm.reset();
                    })
                    .catch(err => alert("Error saving payment: " + err.message));
            }
        });
    }

    // B. Submit Expense Log
    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dbId = document.getElementById('expense-db-id').value;

            const expenseObj = {
                title: document.getElementById('expense-title').value.trim(),
                category: document.getElementById('expense-category').value,
                amount: parseFloat(document.getElementById('expense-amount').value || 0),
                date: document.getElementById('expense-date').value,
                vendor: document.getElementById('expense-vendor').value.trim(),
                refId: document.getElementById('expense-ref').value.trim() || '',
                notes: document.getElementById('expense-notes').value.trim(),
                lastUpdated: Date.now()
            };

            const expendituresRef = database.ref('expenditures');
            if (dbId) {
                expendituresRef.child(dbId).update(expenseObj)
                    .then(() => {
                        alert("Expense record updated successfully.");
                        expenseFormContainer.style.display = 'none';
                        expenseForm.reset();
                    })
                    .catch(err => alert("Error updating expense: " + err.message));
            } else {
                expendituresRef.push().set(expenseObj)
                    .then(() => {
                        alert("Business expense logged successfully.");
                        expenseFormContainer.style.display = 'none';
                        expenseForm.reset();
                    })
                    .catch(err => alert("Error saving expense: " + err.message));
            }
        });
    }

    // Live search filters binding
    document.getElementById('sales-search')?.addEventListener('input', renderPaymentsTable);
    document.getElementById('sales-status-filter')?.addEventListener('change', renderPaymentsTable);
    document.getElementById('expenses-search')?.addEventListener('input', renderExpendituresTable);
    document.getElementById('expenses-category-filter')?.addEventListener('change', renderExpendituresTable);
}

// =========================================================================
// 9. FINANCIAL REPORT SHEET GENERATORS
// =========================================================================
function renderReportBreakdowns(projectCosts, generalExpenses) {
    const monthlyBody = document.getElementById('pl-monthly-body');
    const categoryBody = document.getElementById('pl-category-body');
    const selectedYear = document.getElementById('reports-year-filter').value;

    if (!monthlyBody || !categoryBody) return;

    // 1. Aggregating Monthly Ledger Sheet
    monthlyBody.innerHTML = '';
    const monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Arrays for monthly indices
    const mRev = new Array(12).fill(0);
    const mDirectCost = new Array(12).fill(0);
    const mGenExpense = new Array(12).fill(0);

    // Process Payments
    Object.keys(paymentsData).forEach(key => {
        const p = paymentsData[key];
        if (!p || !p.date) return;
        const pDate = new Date(p.date);
        
        // Filter by Year
        if (selectedYear !== 'all' && pDate.getFullYear().toString() !== selectedYear) return;

        const mIdx = pDate.getMonth();
        mRev[mIdx] += parseFloat(p.amountPaid || 0);
        mDirectCost[mIdx] += parseFloat(p.expenses || 0);
    });

    // Process General Expenditures
    Object.keys(expendituresData).forEach(key => {
        const e = expendituresData[key];
        if (!e || !e.date) return;
        const eDate = new Date(e.date);

        // Filter by Year
        if (selectedYear !== 'all' && eDate.getFullYear().toString() !== selectedYear) return;

        const mIdx = eDate.getMonth();
        mGenExpense[mIdx] += parseFloat(e.amount || 0);
    });

    let reportsHtml = '';
    let cumulativeInflow = 0;
    let cumulativeOutflow = 0;

    for (let i = 0; i < 12; i++) {
        const rev = mRev[i];
        const dCost = mDirectCost[i];
        const gCost = mGenExpense[i];
        const totalCost = dCost + gCost;
        const netPL = rev - totalCost;

        cumulativeInflow += rev;
        cumulativeOutflow += totalCost;

        // Skip rendering months with absolutely zero financial activity to keep reports clean
        if (rev === 0 && totalCost === 0) continue;

        let margin = 0;
        if (rev > 0) margin = (netPL / rev) * 100;

        reportsHtml += `
            <tr>
                <td><strong>${monthsFull[i]}</strong></td>
                <td style="color:var(--primary); font-weight:600;">${rupeeFormatter.format(rev)}</td>
                <td style="color:var(--danger);">${rupeeFormatter.format(dCost)}</td>
                <td style="color:var(--danger);">${rupeeFormatter.format(gCost)}</td>
                <td style="color:var(--danger); font-weight:600;">${rupeeFormatter.format(totalCost)}</td>
                <td style="color:${netPL >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">${rupeeFormatter.format(netPL)}</td>
                <td style="font-weight:600;">${margin.toFixed(1)}%</td>
            </tr>
        `;
    }

    if (reportsHtml === '') {
        monthlyBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color:var(--text-muted);">No financial records logged for the year ${selectedYear}.</td></tr>`;
    } else {
        // Add a grand totals row
        const grandNet = cumulativeInflow - cumulativeOutflow;
        let grandMargin = 0;
        if (cumulativeInflow > 0) grandMargin = (grandNet / cumulativeInflow) * 100;

        reportsHtml += `
            <tr style="background:rgba(99, 102, 241, 0.08); border-top:2px solid var(--border-color); font-weight:bold;">
                <td>Grand Total</td>
                <td style="color:var(--primary); font-size:1.05rem;">${rupeeFormatter.format(cumulativeInflow)}</td>
                <td style="color:var(--danger);">${rupeeFormatter.format(projectCosts)}</td>
                <td style="color:var(--danger);">${rupeeFormatter.format(generalExpenses)}</td>
                <td style="color:var(--danger); font-size:1.05rem;">${rupeeFormatter.format(cumulativeOutflow)}</td>
                <td style="color:${grandNet >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size:1.1rem;">${rupeeFormatter.format(grandNet)}</td>
                <td>${grandMargin.toFixed(1)}%</td>
            </tr>
        `;
        monthlyBody.innerHTML = reportsHtml;
    }

    // 2. Aggregating Expense Category summary table
    categoryBody.innerHTML = '';
    const expCategories = {
        "Developer Payouts": { count: 0, sum: 0 },
        "Infrastructure / Hosting": { count: 0, sum: 0 },
        "Software / SaaS": { count: 0, sum: 0 },
        "Marketing / Ads": { count: 0, sum: 0 },
        "Office / Operations": { count: 0, sum: 0 },
        "Taxes & Fees": { count: 0, sum: 0 },
        "Miscellaneous": { count: 0, sum: 0 }
    };

    // Calculate general expenses count/sum
    let totalGeneralSpent = 0;
    Object.keys(expendituresData).forEach(key => {
        const e = expendituresData[key];
        if (!e) return;
        
        // Filter by Year
        if (e.date && selectedYear !== 'all') {
            if (new Date(e.date).getFullYear().toString() !== selectedYear) return;
        }

        const cat = e.category || 'Miscellaneous';
        if (expCategories[cat] !== undefined) {
            expCategories[cat].count++;
            expCategories[cat].sum += parseFloat(e.amount || 0);
            totalGeneralSpent += parseFloat(e.amount || 0);
        }
    });

    // Add Direct project costs as a category
    let directProjectCount = 0;
    let directProjectSum = 0;
    Object.keys(paymentsData).forEach(key => {
        const p = paymentsData[key];
        if (!p) return;
        
        // Filter by Year
        if (p.date && selectedYear !== 'all') {
            if (new Date(p.date).getFullYear().toString() !== selectedYear) return;
        }

        if (parseFloat(p.expenses || 0) > 0) {
            directProjectCount++;
            directProjectSum += parseFloat(p.expenses || 0);
        }
    });

    const totalBusinessSpent = totalGeneralSpent + directProjectSum;

    let catHtml = '';
    
    // Add Direct Costs Row
    if (directProjectSum > 0) {
        const pct = totalBusinessSpent > 0 ? (directProjectSum / totalBusinessSpent) * 100 : 0;
        catHtml += `
            <tr>
                <td><strong>Direct Project Milestone Costs</strong></td>
                <td>${directProjectCount} projects</td>
                <td style="color:var(--danger); font-weight:600;">${rupeeFormatter.format(directProjectSum)}</td>
                <td style="font-weight:600;">${pct.toFixed(1)}%</td>
            </tr>
        `;
    }

    // Add General Expense Categories rows
    Object.keys(expCategories).forEach(cat => {
        const data = expCategories[cat];
        if (data.sum === 0) return; // Skip empty categories for layout neatness

        const pct = totalBusinessSpent > 0 ? (data.sum / totalBusinessSpent) * 100 : 0;
        catHtml += `
            <tr>
                <td><strong>${cat}</strong></td>
                <td>${data.count} transaction records</td>
                <td style="color:var(--danger); font-weight:600;">${rupeeFormatter.format(data.sum)}</td>
                <td style="font-weight:600;">${pct.toFixed(1)}%</td>
            </tr>
        `;
    });

    if (catHtml === '') {
        categoryBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">No expenditures logged to categorize.</td></tr>';
    } else {
        // Add Grand Total row
        catHtml += `
            <tr style="background:rgba(239, 68, 68, 0.08); border-top:2px solid var(--border-color); font-weight:bold;">
                <td>Total Outflow Balance</td>
                <td>${directProjectCount + Object.values(expCategories).reduce((a,b)=> a+b.count, 0)} logs</td>
                <td style="color:var(--danger); font-size:1.05rem;">${rupeeFormatter.format(totalBusinessSpent)}</td>
                <td>100.0%</td>
            </tr>
        `;
        categoryBody.innerHTML = catHtml;
    }

    // Bind report controls
    document.getElementById('reports-year-filter')?.addEventListener('change', () => {
        recalculateFinancials();
    });
}

// =========================================================================
// 10. ADVANCED EXPORTER UTILITIES (CSV & PDF PRINT)
// =========================================================================
document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    exportCombinedFinancialCSV();
});

document.getElementById('print-report-btn')?.addEventListener('click', () => {
    window.print();
});

function exportCombinedFinancialCSV() {
    const selectedYear = document.getElementById('reports-year-filter').value;
    
    // 1. Build Sales CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== YOUNG TECH COMPANY FINANCIAL LEDGER REPORT ===\n";
    csvContent += `Report Period: FY ${selectedYear === 'all' ? 'All Time' : selectedYear}\n`;
    csvContent += `Generated On: ${new Date().toLocaleString()}\n\n`;

    csvContent += "--- SECTION 1: PROJECT SALES AND PAYMENTS ---\n";
    csvContent += "Transaction ID,Client Name,Project Name,Project Type,Contract Value (INR),Amount Collected (INR),Pending Amount (INR),Direct Milestone Costs (INR),Project Net Profit (INR),Payment Status,Payment Method,Date,Notes\n";

    Object.keys(paymentsData).forEach(key => {
        const p = paymentsData[key];
        if (!p) return;

        const date = p.date ? new Date(p.date) : null;
        if (selectedYear !== 'all' && date && date.getFullYear().toString() !== selectedYear) return;

        const val = parseFloat(p.contractValue || 0);
        const paid = parseFloat(p.amountPaid || 0);
        const pend = val - paid;
        const exp = parseFloat(p.expenses || 0);
        const prof = paid - exp;

        // Escape comma values for safe CSV printing
        const client = `"${(p.clientName || '').replace(/"/g, '""')}"`;
        const project = `"${(p.projectName || '').replace(/"/g, '""')}"`;
        const notes = `"${(p.notes || '').replace(/"/g, '""')}"`;

        csvContent += `${p.paymentId || 'TXN-000000'},${client},${project},${p.projectType || 'web'},${val},${paid},${pend},${exp},${prof},${p.paymentStatus || 'paid'},${p.paymentMethod || 'Bank Transfer'},${p.date || '-'},${notes}\n`;
    });

    csvContent += "\n\n--- SECTION 2: GENERAL BUSINESS EXPENDITURES ---\n";
    csvContent += "Expense Date,Expense Description,Category,Vendor / Paid To,Reference ID,Amount Spent (INR),Notes\n";

    Object.keys(expendituresData).forEach(key => {
        const e = expendituresData[key];
        if (!e) return;

        const date = e.date ? new Date(e.date) : null;
        if (selectedYear !== 'all' && date && date.getFullYear().toString() !== selectedYear) return;

        const title = `"${(e.title || '').replace(/"/g, '""')}"`;
        const vendor = `"${(e.vendor || '').replace(/"/g, '""')}"`;
        const notes = `"${(e.notes || '').replace(/"/g, '""')}"`;

        csvContent += `${e.date || '-'},${title},${e.category || 'General'},${vendor},${e.refId || '-'},${e.amount || 0},${notes}\n`;
    });

    // Trigger Browser File Download
    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `youngtech_financials_report_FY${selectedYear}.csv`);
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
