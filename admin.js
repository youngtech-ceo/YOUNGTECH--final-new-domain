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
    lucide.createIcons();

    // References
    const messagesRef = database.ref('contacts');
    const subscribersRef = database.ref('subscribers');

    // DOM Elements
    const messagesBody = document.getElementById('messages-body');
    const subscribersBody = document.getElementById('subscribers-body');
    const emailAllBtn = document.getElementById('email-all-btn');

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
            emailAllBtn.href = `mailto:?bcc=${emails.join(',')}&subject=Updates from Young Technology`;

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
            emailAllBtn.href = '#';
        }
    }, (error) => {
        subscribersBody.innerHTML = `<tr><td colspan="3" style="color:#ef4444; font-weight:bold; padding: 2rem;">Firebase Error: ${error.message}</td></tr>`;
        console.error("Firebase Subscribers Error:", error);
    });

    // --- Projects CRUD Logic ---
    const projectsRef = database.ref('projects');
    const projectsBody = document.getElementById('projects-body');
    const projectFormContainer = document.getElementById('project-form-container');
    const projectForm = document.getElementById('project-form');
    const addProjectBtn = document.getElementById('add-project-btn');
    const cancelProjectBtn = document.getElementById('cancel-project-btn');

    addProjectBtn.addEventListener('click', () => {
        projectForm.reset();
        document.getElementById('project-id').value = '';
        document.getElementById('project-form-title').innerText = 'Add New Project';
        projectFormContainer.style.display = 'block';
    });

    cancelProjectBtn.addEventListener('click', () => {
        projectFormContainer.style.display = 'none';
        projectForm.reset();
    });

    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('project-id').value;
        const projectData = {
            title: document.getElementById('project-title').value,
            icon: document.getElementById('project-icon').value,
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

    projectsRef.on('value', (snapshot) => {
        projectsBody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Store HTML string to batch insert
            let htmlStr = '';
            Object.keys(data).reverse().forEach(key => {
                const proj = data[key];
                if (!proj) return;
                
                htmlStr += `
                    <tr>
                        <td><img src="${proj.img}" alt="${proj.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"></td>
                        <td>
                            <strong style="color: var(--text-main); font-size: 1.05rem;">${proj.title}</strong><br>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">${proj.desc}</span>
                        </td>
                        <td>
                            <div style="display:flex; align-items:center; gap:0.5rem;" title="${proj.icon}">
                                <i data-lucide="${proj.icon}" style="width:20px; height:20px;"></i>
                            </div>
                        </td>
                        <td>
                            <button class="edit-proj" data-id="${key}" style="background: var(--primary); color: white; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; margin-right: 0.5rem; border:none; cursor:pointer;"
                                data-title="${proj.title}" data-icon="${proj.icon}" data-img="${proj.img}" data-url="${proj.url}" data-desc="${proj.desc}">Edit</button>
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

    // --- Admin Navigation Tabs Logic ---
    const tabs = document.querySelectorAll('.admin-sidebar a[href^="#"]');
    const sections = document.querySelectorAll('.admin-card');
    
    // Auto-hide sections that aren't the primary one dynamically based on layout, if logic is missing from raw html markup originally. 
    // Usually 'messages' is defaulted visible and others hidden visually.
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

});
