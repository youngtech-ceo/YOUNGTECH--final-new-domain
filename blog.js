// Blog Controller for Young Tech
// Handles Firebase Real-time Database interactions, Search, Filters, and SPA routing for sharing articles

// Firebase Configuration
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

// Initialize Firebase if not already initialized
if (window.firebase && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const blogsRef = database.ref('posts');

// Local cache
let blogsCache = {};
let activeCategory = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    // Initial UI Elements
    const gridContainer = document.getElementById('blog-grid');
    const searchInput = document.getElementById('blog-search');
    const filtersContainer = document.getElementById('blog-filters');

    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 1. Fetch Blog Posts from Firebase Database
    blogsRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            blogsCache = snapshot.val();
        } else {
            blogsCache = {};
        }
        
        // Handle initial routing or normal view render
        handleInitialRouting();
        
    }, (error) => {
        console.error("Firebase fetch error: ", error);
        if (gridContainer) {
            gridContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 4rem;">
                    <i data-lucide="alert-triangle" style="width: 48px; height: 48px; margin: 0 auto 1rem;"></i>
                    <p style="font-weight:600;">Failed to load insights from database.</p>
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
                renderBlogLayout();
            });
        });
    }

    // 3. Bind Search Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderBlogLayout();
        });
    }

    // 4. Handle Browser History / Back-Button navigation
    window.addEventListener('popstate', (e) => {
        handleInitialRouting();
    });
});

// Function to inspect URL params and render the appropriate page state
function handleInitialRouting() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id') || window.location.hash.substring(1);

    if (postId && blogsCache[postId]) {
        showPostReader(postId, false); // display the article directly (skip pushState)
    } else {
        closePostReader(false); // display the normal catalog view
    }
}

// Render the main catalog layout (Featured post + Grid cards)
function renderBlogLayout() {
    const featuredContainer = document.getElementById('featured-post-container');
    const gridContainer = document.getElementById('blog-grid');
    
    if (!gridContainer) return;

    // Convert cache object to reverse sorted array (newest first)
    const allPosts = Object.keys(blogsCache).map(key => ({
        id: key,
        ...blogsCache[key]
    })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (allPosts.length === 0) {
        featuredContainer.style.display = 'none';
        gridContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem;">
                <i data-lucide="book-open" style="width: 48px; height: 48px; margin: 0 auto 1rem;"></i>
                <p style="font-weight:600;">No articles published yet.</p>
                <p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.25rem;">Check back soon for insights!</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // Apply category & search filters
    let filteredPosts = allPosts.filter(post => {
        const matchesCategory = (activeCategory === 'all' || post.category === activeCategory);
        const matchesSearch = !searchQuery || 
                              post.title.toLowerCase().includes(searchQuery) ||
                              (post.summary && post.summary.toLowerCase().includes(searchQuery)) ||
                              (post.content && post.content.toLowerCase().includes(searchQuery)) ||
                              (post.tags && post.tags.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    // 1. Render Featured Post at top (Only if on 'All' category and search query is empty)
    if (activeCategory === 'all' && !searchQuery && filteredPosts.length > 0) {
        const featured = filteredPosts[0];
        featuredContainer.innerHTML = `
            <div class="featured-post" onclick="showPostReader('${featured.id}')">
                <div class="featured-img-wrapper">
                    <img src="${featured.coverImg || '1.JPG'}" alt="${featured.title}">
                </div>
                <div class="featured-content">
                    <span class="featured-badge">${featured.category || 'Tech'}</span>
                    <h2 class="featured-title">${featured.title}</h2>
                    <p class="featured-desc">${featured.summary || ''}</p>
                    <div class="featured-meta">
                        <span><i data-lucide="user"></i> ${featured.author || 'Rithish V'}</span>
                        <span><i data-lucide="calendar"></i> ${featured.date || ''}</span>
                        <span><i data-lucide="clock"></i> ${featured.readTime || '5 min read'}</span>
                    </div>
                    <span style="font-weight:700; color:var(--primary); font-size:0.95rem; display:flex; align-items:center; gap:0.4rem;">
                        Read Full Article <i data-lucide="arrow-right" style="width:16px; height:16px;"></i>
                    </span>
                </div>
            </div>
        `;
        featuredContainer.style.display = 'block';
        
        // Exclude featured post from the grid cards below it
        filteredPosts = filteredPosts.slice(1);
    } else {
        featuredContainer.style.display = 'none';
    }

    // 2. Render Cards Grid
    gridContainer.innerHTML = '';
    
    if (filteredPosts.length === 0) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem;">
                <i data-lucide="search-code" style="width: 48px; height: 48px; margin: 0 auto 1rem;"></i>
                <p style="font-weight:600;">No articles match your criteria.</p>
                <p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.25rem;">Try refining your keywords or filters.</p>
            </div>
        `;
    } else {
        filteredPosts.forEach(post => {
            const initial = post.author ? post.author.charAt(0).toUpperCase() : 'Y';
            
            gridContainer.innerHTML += `
                <div class="blog-card" onclick="showPostReader('${post.id}')">
                    <div class="blog-card-img">
                        <span class="blog-card-category">${post.category || 'Tech'}</span>
                        <img src="${post.coverImg || '1.JPG'}" alt="${post.title}">
                    </div>
                    <div class="blog-card-content">
                        <div class="blog-card-meta">
                            <span><i data-lucide="calendar"></i> ${post.date || ''}</span>
                            <span><i data-lucide="clock"></i> ${post.readTime || '4 min read'}</span>
                        </div>
                        <h3 class="blog-card-title">${post.title}</h3>
                        <p class="blog-card-desc">${post.summary ? post.summary.substring(0, 120) + (post.summary.length > 120 ? '...' : '') : ''}</p>
                        <div class="blog-card-author">
                            <div class="author-avatar">${initial}</div>
                            <div class="author-info">
                                <h5>${post.author || 'Rithish V'}</h5>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // Reinitialize icons in rendered HTML
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Display full article view
function showPostReader(postId, pushToHistory = true) {
    const post = blogsCache[postId];
    if (!post) return;

    const catalogView = document.getElementById('blog-catalog-view');
    const readerContainer = document.getElementById('reader-view-container');
    
    if (!catalogView || !readerContainer) return;

    // Split comma separated tags
    let tagsHTML = '';
    if (post.tags) {
        tagsHTML = post.tags.split(',').map(tag => 
            `<span class="tag-badge" style="background:var(--badge-bg); color:var(--primary); font-size:0.8rem; font-weight:600; padding:0.25rem 0.75rem; border-radius:50px; border:1px solid var(--border-color);">${tag.trim()}</span>`
        ).join('');
    }

    // Render full post details
    readerContainer.innerHTML = `
        <button class="reader-back-btn" onclick="closePostReader()">
            <i data-lucide="arrow-left" style="width:16px; height:16px;"></i> Back to Articles
        </button>
        
        <div class="reader-header">
            <span class="featured-badge" style="margin-bottom:1rem;">${post.category || 'Tech'}</span>
            <h1 class="reader-title">${post.title}</h1>
            <div class="reader-meta-bar">
                <span><i data-lucide="user"></i> Written by <strong>${post.author || 'Rithish V'}</strong></span>
                <span><i data-lucide="calendar"></i> ${post.date || ''}</span>
                <span><i data-lucide="clock"></i> ${post.readTime || '5 min read'}</span>
                <button onclick="sharePost('${postId}')" style="background:transparent; border:none; color:var(--primary); display:inline-flex; align-items:center; gap:0.4rem; cursor:pointer; font-weight:600; padding:0; margin-left:auto;">
                    <i data-lucide="share-2" style="width:16px; height:16px;"></i> Share Link
                </button>
            </div>
        </div>

        <div class="reader-cover">
            <img src="${post.coverImg || '1.JPG'}" alt="${post.title}">
        </div>

        <div class="reader-body">
            ${post.content || ''}
        </div>

        <div class="reader-tags">
            ${tagsHTML}
        </div>

        <div class="reader-author-bio">
            <div class="bio-avatar">${post.author ? post.author.charAt(0).toUpperCase() : 'Y'}</div>
            <div class="bio-details">
                <h4>${post.author || 'Rithish V'}</h4>
                <p>Engineering lead and technology strategist at Young Tech. Passionate about custom software design, database clusters, high-fidelity user experiences, and micro-interactions.</p>
            </div>
        </div>
    `;

    // Hide grid, show article reader
    catalogView.style.display = 'none';
    readerContainer.style.display = 'block';

    // Refresh icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Update URL parameters dynamically for easy sharing
    if (pushToHistory) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + postId;
        window.history.pushState({ postId: postId }, post.title, newUrl);
    }

    // Smooth scroll back to top of reading pane
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Close article reader and return to grid list
function closePostReader(pushToHistory = true) {
    const catalogView = document.getElementById('blog-catalog-view');
    const readerContainer = document.getElementById('reader-view-container');

    if (!catalogView || !readerContainer) return;

    // Hide article reader, show grid catalog
    readerContainer.style.display = 'none';
    catalogView.style.display = 'block';

    // Clear URL parameters
    if (pushToHistory) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({}, 'Blog | Young Tech', newUrl);
    }

    // Render list
    renderBlogLayout();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility function to share/copy link
function sharePost(postId) {
    const shareUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + postId;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Article share link copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy link: ', err);
            prompt('Copy this link to share:', shareUrl);
        });
    } else {
        prompt('Copy this link to share:', shareUrl);
    }
}
