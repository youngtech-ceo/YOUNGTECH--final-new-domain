// Project Materials & Sources Controller for Young Tech
// Wrapped in an IIFE to prevent namespace conflicts

(function() {
    // Firebase Configuration (Matching index/blog/admin config)
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
    
    const database = window.firebase ? firebase.database() : null;
    if (!database) {
        console.error("Firebase database could not be initialized.");
        return;
    }
    const materialsRef = database.ref('materials');

    // Local State
    let materialsCache = {};
    let activeCategory = 'all';
    let searchQuery = '';

    document.addEventListener('DOMContentLoaded', () => {
        const gridContainer = document.getElementById('materials-grid');
        const searchInput = document.getElementById('materials-search');
        const filtersContainer = document.getElementById('materials-filters');

        // Initialize Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // 1. Fetch Materials from Firebase
        materialsRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                materialsCache = snapshot.val();
            } else {
                materialsCache = {};
            }
            handleRouting();
        }, (error) => {
            console.error("Firebase fetch error: ", error);
            if (gridContainer) {
                gridContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 4rem;">
                        <i data-lucide="alert-triangle" style="width: 48px; height: 48px; margin: 0 auto 1rem;"></i>
                        <p style="font-weight:600;">Failed to load project materials from database.</p>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem;">${error.message}</p>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        });

        // 2. Bind Filter Tabs
        if (filtersContainer) {
            filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeCategory = btn.getAttribute('data-filter');
                    renderCatalog();
                });
            });
        }

        // 3. Bind Search Input
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                renderCatalog();
            });
        }

        // 4. Handle Lightbox Modal close
        const lightbox = document.getElementById('lightbox-modal');
        const lightboxClose = document.getElementById('lightbox-close-btn');
        if (lightbox && lightboxClose) {
            lightboxClose.addEventListener('click', () => {
                lightbox.classList.remove('active');
            });
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    lightbox.classList.remove('active');
                }
            });
        }

        // 5. Handle popstate routing (back/forward history)
        window.addEventListener('popstate', () => {
            handleRouting();
        });
        window.addEventListener('hashchange', () => {
            handleRouting();
        });
    });

    // Helper: Extract YouTube video ID to create dynamic embed player
    function getYouTubeEmbedUrl(url) {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url;
    }

    // Dynamic state routing
    function handleRouting() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id') || window.location.hash.substring(1);

        const catalogView = document.getElementById('materials-catalog-view');
        const readerView = document.getElementById('materials-reader-view');

        if (projectId && materialsCache[projectId]) {
            // Show single project reader view
            catalogView.style.display = 'none';
            readerView.style.display = 'block';
            renderProjectReader(projectId, materialsCache[projectId]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Show all catalog grid view
            readerView.style.display = 'none';
            catalogView.style.display = 'block';
            renderCatalog();
        }
    }

    // Render the grid list of projects
    function renderCatalog() {
        const gridContainer = document.getElementById('materials-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        const keys = Object.keys(materialsCache).reverse();
        let renderedCount = 0;

        keys.forEach(key => {
            const item = materialsCache[key];
            if (!item) return;

            // Search Filter
            const matchesSearch = item.title.toLowerCase().includes(searchQuery) || 
                                  (item.summary && item.summary.toLowerCase().includes(searchQuery));
            
            // Category Filter
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;

            if (matchesSearch && matchesCategory) {
                const compCount = item.components ? item.components.length : 0;
                const coverImg = item.img || '1.JPG';

                const card = document.createElement('div');
                card.className = 'material-card';
                card.innerHTML = `
                    <div class="material-card-img">
                        <span class="material-card-category">${item.category || 'Arduino'}</span>
                        <img src="${coverImg}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="material-card-content">
                        <div class="material-card-meta">
                            <span><i data-lucide="calendar"></i> ${new Date(item.timestamp || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <h3 class="material-card-title">${item.title}</h3>
                        <p class="material-card-desc">${item.summary || 'Click to explore wiring, parts, schematic, and Arduino code for this science project.'}</p>
                        <div class="material-card-footer">
                            <span><i data-lucide="shopping-bag" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${compCount} Parts Required</span>
                            <span style="color: var(--primary); display:flex; align-items:center; gap:4px;">Get Code <i data-lucide="arrow-right" style="width:14px; height:14px;"></i></span>
                        </div>
                    </div>
                `;

                // Add navigate event
                card.addEventListener('click', () => {
                    history.pushState(null, '', `?id=${key}`);
                    handleRouting();
                });

                gridContainer.appendChild(card);
                renderedCount++;
            }
        });

        if (renderedCount === 0) {
            gridContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem;">
                    <i data-lucide="search-code" style="width: 48px; height: 48px; margin: 0 auto 1rem; color: var(--primary);"></i>
                    <p style="font-weight:600; font-size:1.1rem;">No projects match your filter query.</p>
                    <p style="font-size:0.9rem; margin-top:0.5rem;">Try searching for something else or clearing the filters.</p>
                </div>
            `;
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Render detailed project view
    function renderProjectReader(id, project) {
        const container = document.getElementById('reader-view-container');
        if (!container) return;

        // Build components table rows
        let componentsRowsHtml = '';
        if (project.components && project.components.length > 0) {
            project.components.forEach(comp => {
                const buyBtn = comp.buyUrl ? `<a href="${comp.buyUrl}" target="_blank" class="btn-buy"><i data-lucide="shopping-cart" style="width:12px; height:12px;"></i> Buy Online</a>` : '-';
                componentsRowsHtml += `
                    <tr>
                        <td><strong>${comp.name}</strong></td>
                        <td><span style="background: rgba(255,255,255,0.05); padding: 0.25rem 0.6rem; border-radius: 4px; font-weight:700;">x${comp.qty}</span></td>
                        <td>${buyBtn}</td>
                    </tr>
                `;
            });
        } else {
            componentsRowsHtml = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No components list specified.</td></tr>';
        }

        // YouTube Embed iframe
        const embedUrl = getYouTubeEmbedUrl(project.youtube);
        const videoHtml = embedUrl ? `
            <div class="video-container">
                <iframe src="${embedUrl}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
        ` : '';

        // Tabbed Diagram Panel switcher
        let diagramTabsHtml = '';
        let diagramPanesHtml = '';
        let tabIndex = 0;

        if (project.circuitImg) {
            diagramTabsHtml += `<button class="diagram-tab-btn active" data-tab="circuit">Circuit Diagram</button>`;
            diagramPanesHtml += `
                <div class="diagram-pane active" id="pane-circuit">
                    <img src="${project.circuitImg}" alt="Circuit Diagram Layout" class="zoomable-diagram">
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.8rem;"><i data-lucide="zoom-in" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Click diagram to zoom</p>
                </div>
            `;
            tabIndex++;
        }

        if (project.buildImg) {
            const activeClass = tabIndex === 0 ? 'active' : '';
            diagramTabsHtml += `<button class="diagram-tab-btn ${activeClass}" data-tab="build">Completed Build</button>`;
            diagramPanesHtml += `
                <div class="diagram-pane ${activeClass}" id="pane-build">
                    <img src="${project.buildImg}" alt="Completed Project Build" class="zoomable-diagram">
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.8rem;"><i data-lucide="zoom-in" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Click diagram to zoom</p>
                </div>
            `;
            tabIndex++;
        }

        let diagramsSectionHtml = '';
        if (diagramTabsHtml) {
            diagramsSectionHtml = `
                <div class="diagram-container">
                    <div class="diagram-tabs">
                        ${diagramTabsHtml}
                    </div>
                    <div class="diagram-panes">
                        ${diagramPanesHtml}
                    </div>
                </div>
            `;
        }

        // Downloads section (Google Drive links)
        let downloadSectionHtml = '';
        if (project.codeLink) {
            const libDownloadBtnHtml = project.librariesLink ? `
                <a href="${project.librariesLink}" target="_blank" class="code-btn" style="background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3); padding: 0.8rem 1.5rem; text-decoration: none; color: #a855f7; display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 50px; font-weight: 700; transition: var(--transition);">
                    <i data-lucide="folder-archive"></i> Download Required Libraries (Google Drive)
                </a>
            ` : '';

            downloadSectionHtml = `
                <h3><i data-lucide="download-cloud"></i> Code & Resource Downloads</h3>
                <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 1.5rem;">Click the links below to access the shared Google Drive folder containing the target firmware source code sketches and libraries required for this build.</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                    <a href="${project.codeLink}" target="_blank" class="code-btn" style="background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.4); padding: 0.8rem 1.5rem; text-decoration: none; color: var(--primary); display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 50px; font-weight: 700; transition: var(--transition);">
                        <i data-lucide="external-link"></i> Download Arduino Source Code (Google Drive)
                    </a>
                    ${libDownloadBtnHtml}
                </div>
            `;
        }

        container.innerHTML = `
            <!-- Utility Toolbar -->
            <div class="utility-bar">
                <button id="back-to-catalog" class="btn-secondary" style="border-radius: 50px; padding: 0.6rem 1.4rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border-color); font-weight:600;">
                    <i data-lucide="arrow-left"></i> Back to DIY Corner
                </button>
                <button id="btn-print-guide" class="btn-outline" style="border-radius: 50px; padding: 0.6rem 1.4rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight:600;">
                    <i data-lucide="printer"></i> Print / Save PDF Guide
                </button>
            </div>

            <article class="reader-view">
                <!-- Header -->
                <div class="reader-header">
                    <span style="background: var(--primary); color:#fff; font-size:0.75rem; font-weight:800; padding:0.25rem 0.8rem; border-radius:50px; text-transform:uppercase; letter-spacing:0.5px;">${project.category || 'Arduino'}</span>
                    <h1 class="reader-title">${project.title}</h1>
                    <div class="reader-meta">
                        <span><i data-lucide="calendar"></i> ${new Date(project.timestamp || Date.now()).toLocaleDateString()}</span>
                        <span><i data-lucide="user"></i> Young Tech Creator</span>
                    </div>
                </div>

                <!-- Video Tutorial Embed -->
                ${videoHtml}

                <!-- Introduction Summary -->
                <div class="reader-content">
                    <p style="font-size:1.15rem; color:var(--text-main); font-weight:500; line-height:1.7; margin-bottom:2rem;">
                        ${project.summary || ''}
                    </p>

                    <!-- Components Table -->
                    <h3><i data-lucide="shopping-bag"></i> Components & Materials Required</h3>
                    <table class="materials-table">
                        <thead>
                            <tr>
                                <th>Component Description</th>
                                <th>Quantity</th>
                                <th>Where to Buy</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${componentsRowsHtml}
                        </tbody>
                    </table>

                    <!-- Diagrams & Schematics -->
                    ${diagramsSectionHtml ? '<h3><i data-lucide="network"></i> Circuit Wiring & Schematic Layout</h3>' + diagramsSectionHtml : ''}

                    <!-- Step-by-Step Instructions -->
                    <h3><i data-lucide="list-checks"></i> Assembly Guide & Step-by-Step Instructions</h3>
                    <div style="margin-bottom: 2rem;">
                        ${project.instructions ? project.instructions : '<p>Follow the circuit diagram layout and upload the source code to get the project working.</p>'}
                    </div>

                    <!-- Downloads Section -->
                    ${downloadSectionHtml}
                </div>
            </article>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        // --- Event Listeners inside Reader View ---

        // Back button
        document.getElementById('back-to-catalog').addEventListener('click', () => {
            history.pushState(null, '', window.location.pathname);
            handleRouting();
        });

        // Print button
        document.getElementById('btn-print-guide').addEventListener('click', () => {
            window.print();
        });

        // Tab switching events
        const tabButtons = container.querySelectorAll('.diagram-tab-btn');
        const panes = container.querySelectorAll('.diagram-pane');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = btn.getAttribute('data-tab');
                const pane = document.getElementById(`pane-${targetTab}`);
                if (pane) pane.classList.add('active');
            });
        });

        // Lightbox zoom events
        const zoomImgs = container.querySelectorAll('.zoomable-diagram');
        const lightbox = document.getElementById('lightbox-modal');
        const lightboxImg = document.getElementById('lightbox-img');
        zoomImgs.forEach(img => {
            img.addEventListener('click', () => {
                if (lightbox && lightboxImg) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('active');
                }
            });
        });
    }

})();
