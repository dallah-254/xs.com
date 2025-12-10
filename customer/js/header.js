// XS Header Functionality - Complete Navigation System
// File: customer/js/customer-header.js

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        api: {
            auth: '/api/auth/me',
            logout: '/api/auth/logout',
            cartCount: '/api/shop/cart/count',
            wishlistCount: '/api/shop/wishlist/count'
        },
        pages: {
            auth: '/customer/auth',
            profile: '/customer/profile',
            wishlist: '/customer/wishlist',
            cart: '/customer/cart',
            shop: '/customer/shop',
            home: '/customer/home',
            deals: '/customer/deals',
            resources: '/customer/resources',
            support: '/customer/support',
            orders: '/customer/orders',
            quote: '/customer/quote'
        },
        selectors: {
            // Auth states
            loggedOutState: 'logged-out-state',
            loggedInState: 'logged-in-state',
            mobileLoggedOutState: 'mobile-logged-out-state',
            mobileLoggedInState: 'mobile-logged-in-state',
            
            // Buttons
            logoutBtn: 'logout-btn',
            mobileLogoutBtn: 'mobile-logout-btn',
            userMenuBtn: 'user-menu-btn',
            userDropdown: 'user-dropdown',
            
            // Counters
            cartCount: 'cart-count',
            mobileCartCount: 'mobile-cart-count',
            wishlistCount: 'wishlist-count',
            mobileWishlistCount: 'mobile-wishlist-count',
            
            // Navigation
            searchInput: '.search-input',
            mobileSearchInput: '.mobile-search-input',
            
            // Sidebars
            mobileMenuBtn: 'mobile-menu-btn',
            mobileMenuPanel: 'mobile-menu-panel',
            mobileMenuClose: 'mobile-menu-close',
            mobileMenuOverlay: 'mobile-menu-overlay',
            mobileSearchBtn: 'mobile-search-btn',
            mobileSearchBar: 'mobile-search-bar',
            mobileSearchClose: 'mobile-search-close',
            filterBtn: 'filter-btn',
            filterSidebar: 'filter-sidebar',
            filterSidebarClose: 'filter-sidebar-close',
            filterSidebarOverlay: 'filter-sidebar-overlay',
            applyFiltersBtn: 'apply-filters-btn',
            resetFiltersBtn: 'reset-filters-btn',
            sidebarResetBtn: 'sidebar-reset-filters-btn'
        }
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('XS Header initialized');
        initializeHeader();
    });

    // Main initialization
    async function initializeHeader() {
        try {
            // Setup event listeners FIRST
            setupEventListeners();
            
            // Check authentication status
            await checkAuthentication();
            
            // Load cart and wishlist counts
            await loadCounts();
            
        } catch (error) {
            console.error('Header initialization error:', error);
            showMessage('Error loading header', 'error');
        }
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Main navigation links
        setupNavigationLinks();
        
        // Auth buttons
        setupAuthButtons();
        
        // Shopping buttons (cart, wishlist, quote)
        setupShoppingButtons();
        
        // Search functionality
        setupSearch();
        
        // Mobile menu
        setupMobileMenu();
        
        // Mobile search
        setupMobileSearch();
        
        // Filter sidebar
        setupFilterSidebar();
        
        // Desktop filters
        setupDesktopFilters();
    }

    // Setup navigation links
    function setupNavigationLinks() {
        const navLinks = document.querySelectorAll('a[href^="/customer/"]');
        navLinks.forEach(link => {
            // Skip auth links (handled separately)
            if (link.getAttribute('href') === CONFIG.pages.auth) return;
            
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                navigateToPage(href);
            });
        });
    }

    // Setup auth buttons
    function setupAuthButtons() {
        // Login buttons
        const loginButtons = document.querySelectorAll('.login-btn');
        loginButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToPage(CONFIG.pages.auth);
            });
        });

        // Logout buttons
        const logoutButtons = [
            document.getElementById(CONFIG.selectors.logoutBtn),
            document.getElementById(CONFIG.selectors.mobileLogoutBtn)
        ].filter(Boolean);

        logoutButtons.forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                await handleLogout();
            });
        });

        // User menu toggle
        const userMenuBtn = document.getElementById(CONFIG.selectors.userMenuBtn);
        const userDropdown = document.getElementById(CONFIG.selectors.userDropdown);
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });
        }
    }

    // Setup shopping buttons
    function setupShoppingButtons() {
        // Cart button
        const cartButtons = [
            document.getElementById('cart-btn'),
            document.getElementById('mobile-cart-btn')
        ].filter(Boolean);
        
        cartButtons.forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                await navigateToProtectedPage(CONFIG.pages.cart);
            });
        });

        // Wishlist button
        const wishlistButtons = [
            document.getElementById('wishlist-btn'),
            document.getElementById('mobile-wishlist-btn')
        ].filter(Boolean);
        
        wishlistButtons.forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                await navigateToProtectedPage(CONFIG.pages.wishlist);
            });
        });

        // Quote button
        const quoteButtons = [
            document.getElementById('request-quote-btn'),
            document.getElementById('mobile-quote-btn')
        ].filter(Boolean);
        
        quoteButtons.forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                await navigateToProtectedPage(CONFIG.pages.quote);
            });
        });
    }

    // Setup search functionality
    function setupSearch() {
        // Desktop search
        const desktopSearch = document.querySelector(CONFIG.selectors.searchInput);
        if (desktopSearch) {
            desktopSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch(this.value);
                }
            });
        }

        // Mobile search
        const mobileSearch = document.querySelector(CONFIG.selectors.mobileSearchInput);
        if (mobileSearch) {
            mobileSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch(this.value);
                    closeMobileSearch();
                }
            });
        }
    }

    // Setup mobile menu
    function setupMobileMenu() {
        const mobileMenuBtn = document.getElementById(CONFIG.selectors.mobileMenuBtn);
        const mobileMenuPanel = document.getElementById(CONFIG.selectors.mobileMenuPanel);
        const mobileMenuClose = document.getElementById(CONFIG.selectors.mobileMenuClose);
        const overlay = document.getElementById(CONFIG.selectors.mobileMenuOverlay);

        // Create overlay if it doesn't exist
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.id = CONFIG.selectors.mobileMenuOverlay;
            newOverlay.className = 'mobile-menu-overlay';
            document.body.appendChild(newOverlay);
        }

        const mobileOverlay = document.getElementById(CONFIG.selectors.mobileMenuOverlay);

        // Open mobile menu
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', function() {
                mobileMenuPanel.classList.add('active');
                mobileOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        // Close mobile menu
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMobileMenu);
        }

        // Close on overlay click
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMobileMenu);
        }

        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (mobileMenuPanel.classList.contains('active')) {
                    closeMobileMenu();
                }
                if (document.getElementById(CONFIG.selectors.filterSidebar).classList.contains('active')) {
                    closeFilterSidebar();
                }
            }
        });

        function closeMobileMenu() {
            mobileMenuPanel.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Setup mobile search
    function setupMobileSearch() {
        const mobileSearchBtn = document.getElementById(CONFIG.selectors.mobileSearchBtn);
        const mobileSearchBar = document.getElementById(CONFIG.selectors.mobileSearchBar);
        const mobileSearchClose = document.getElementById(CONFIG.selectors.mobileSearchClose);

        if (mobileSearchBtn && mobileSearchBar && mobileSearchClose) {
            mobileSearchBtn.addEventListener('click', function() {
                mobileSearchBar.classList.add('active');
                setTimeout(() => {
                    const input = document.querySelector(CONFIG.selectors.mobileSearchInput);
                    if (input) input.focus();
                }, 100);
            });

            mobileSearchClose.addEventListener('click', closeMobileSearch);

            function closeMobileSearch() {
                mobileSearchBar.classList.remove('active');
                const input = document.querySelector(CONFIG.selectors.mobileSearchInput);
                if (input) input.value = '';
            }
        }
    }

    // Setup filter sidebar
    function setupFilterSidebar() {
        const filterBtn = document.getElementById(CONFIG.selectors.filterBtn);
        const filterSidebar = document.getElementById(CONFIG.selectors.filterSidebar);
        const filterSidebarClose = document.getElementById(CONFIG.selectors.filterSidebarClose);
        
        // Create overlay if it doesn't exist
        if (!document.getElementById(CONFIG.selectors.filterSidebarOverlay)) {
            const overlay = document.createElement('div');
            overlay.id = CONFIG.selectors.filterSidebarOverlay;
            overlay.className = 'filter-sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        const overlay = document.getElementById(CONFIG.selectors.filterSidebarOverlay);
        const applyFiltersBtn = document.getElementById(CONFIG.selectors.applyFiltersBtn);
        const sidebarResetBtn = document.getElementById(CONFIG.selectors.sidebarResetBtn);

        // Open filter sidebar
        if (filterBtn && filterSidebar) {
            filterBtn.addEventListener('click', function() {
                filterSidebar.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        // Close filter sidebar
        if (filterSidebarClose) {
            filterSidebarClose.addEventListener('click', closeFilterSidebar);
        }

        // Close on overlay click
        if (overlay) {
            overlay.addEventListener('click', closeFilterSidebar);
        }

        // Apply filters
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                const filters = collectSidebarFilters();
                if (Object.keys(filters).length > 0) {
                    applyFilters(filters);
                } else {
                    showMessage('Please select at least one filter');
                }
            });
        }

        // Reset sidebar filters
        if (sidebarResetBtn) {
            sidebarResetBtn.addEventListener('click', resetSidebarFilters);
        }

        function closeFilterSidebar() {
            filterSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Setup desktop filters
    function setupDesktopFilters() {
        const resetBtn = document.getElementById(CONFIG.selectors.resetFiltersBtn);
        
        // Filter dropdowns
        const filterSelects = document.querySelectorAll('.filter-dropdown:not(#filter-sidebar select)');
        filterSelects.forEach(select => {
            select.addEventListener('change', function() {
                const filters = collectDesktopFilters();
                if (Object.keys(filters).length > 0) {
                    applyFilters(filters);
                }
            });
        });

        // Reset filters
        if (resetBtn) {
            resetBtn.addEventListener('click', resetDesktopFilters);
        }
    }

    // Check authentication status
    async function checkAuthentication() {
        try {
            const response = await fetch(CONFIG.api.auth, {
                credentials: 'include' // Include cookies for session auth
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    updateAuthUI(true);
                    updateUserInfo(data.user);
                } else {
                    updateAuthUI(false);
                }
            } else {
                updateAuthUI(false);
            }
        } catch (error) {
            console.log('Auth check failed:', error);
            updateAuthUI(false);
        }
    }

    // Update auth UI
    function updateAuthUI(isLoggedIn) {
        // Desktop
        const loggedOutState = document.getElementById(CONFIG.selectors.loggedOutState);
        const loggedInState = document.getElementById(CONFIG.selectors.loggedInState);
        
        if (loggedOutState) loggedOutState.style.display = isLoggedIn ? 'none' : 'flex';
        if (loggedInState) loggedInState.style.display = isLoggedIn ? 'flex' : 'none';

        // Mobile
        const mobileLoggedOutState = document.getElementById(CONFIG.selectors.mobileLoggedOutState);
        const mobileLoggedInState = document.getElementById(CONFIG.selectors.mobileLoggedInState);
        
        if (mobileLoggedOutState) mobileLoggedOutState.style.display = isLoggedIn ? 'none' : 'block';
        if (mobileLoggedInState) mobileLoggedInState.style.display = isLoggedIn ? 'block' : 'none';
    }

    // Update user information
    function updateUserInfo(user) {
        const mobileUserName = document.getElementById('mobile-user-name');
        const mobileUserEmail = document.getElementById('mobile-user-email');
        
        if (mobileUserName && user.name) {
            mobileUserName.textContent = user.name;
        }
        
        if (mobileUserEmail && user.email) {
            mobileUserEmail.textContent = user.email;
        }
    }

    // Load cart and wishlist counts
    async function loadCounts() {
        try {
            const [cartCount, wishlistCount] = await Promise.all([
                fetchCount(CONFIG.api.cartCount),
                fetchCount(CONFIG.api.wishlistCount)
            ]);
            
            updateCounter(CONFIG.selectors.cartCount, cartCount);
            updateCounter(CONFIG.selectors.mobileCartCount, cartCount);
            updateCounter(CONFIG.selectors.wishlistCount, wishlistCount);
            updateCounter(CONFIG.selectors.mobileWishlistCount, wishlistCount);
            
        } catch (error) {
            console.error('Error loading counts:', error);
            // Set default counts
            updateCounter(CONFIG.selectors.cartCount, 0);
            updateCounter(CONFIG.selectors.mobileCartCount, 0);
            updateCounter(CONFIG.selectors.wishlistCount, 0);
            updateCounter(CONFIG.selectors.mobileWishlistCount, 0);
        }
    }

    // Fetch count from API
    async function fetchCount(endpoint) {
        try {
            const response = await fetch(endpoint, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.count || 0;
            }
            return 0;
        } catch (error) {
            console.error(`Error fetching count from ${endpoint}:`, error);
            return 0;
        }
    }

    // Update counter UI
    function updateCounter(selector, count) {
        const element = document.getElementById(selector);
        if (element) {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    // Navigate to protected page (requires auth)
    async function navigateToProtectedPage(pagePath) {
        // First check if user is authenticated
        try {
            const response = await fetch(CONFIG.api.auth, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    navigateToPage(pagePath);
                } else {
                    showMessage('Please login to access this page');
                    navigateToPage(CONFIG.pages.auth);
                }
            } else {
                showMessage('Please login to access this page');
                navigateToPage(CONFIG.pages.auth);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            showMessage('Please login to access this page');
            navigateToPage(CONFIG.pages.auth);
        }
    }

    // Navigate to page
    function navigateToPage(path) {
        window.location.href = path;
    }

    // Handle search
    function handleSearch(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            showMessage('Please enter a search term');
            return;
        }
        
        navigateToPage(`${CONFIG.pages.shop}?search=${encodeURIComponent(trimmedQuery)}`);
    }

    // Handle logout
    async function handleLogout() {
        try {
            const response = await fetch(CONFIG.api.logout, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                showMessage('Logged out successfully');
                updateAuthUI(false);
                
                // Close mobile menu if open
                closeMobileMenu();
                closeFilterSidebar();
                
                // Redirect to home page after delay
                setTimeout(() => {
                    navigateToPage(CONFIG.pages.home);
                }, 1000);
            } else {
                showMessage('Error during logout', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showMessage('Error during logout', 'error');
        }
    }

    // Collect filters from sidebar
    function collectSidebarFilters() {
        const filters = {};
        const sidebarSelects = document.querySelectorAll('#filter-sidebar .filter-dropdown');
        
        sidebarSelects.forEach(select => {
            if (select.value) {
                // Convert sidebar ID to regular filter ID
                const filterId = select.id.replace('sidebar-', '');
                filters[filterId] = select.value;
            }
        });
        
        return filters;
    }

    // Collect filters from desktop
    function collectDesktopFilters() {
        const filters = {};
        const desktopSelects = document.querySelectorAll('.filter-bar-row .filter-dropdown');
        
        desktopSelects.forEach(select => {
            if (select.value) {
                filters[select.id] = select.value;
            }
        });
        
        return filters;
    }

    // Apply filters
    function applyFilters(filters) {
        const params = new URLSearchParams(filters).toString();
        navigateToPage(`${CONFIG.pages.shop}?${params}`);
    }

    // Reset sidebar filters
    function resetSidebarFilters() {
        const sidebarSelects = document.querySelectorAll('#filter-sidebar .filter-dropdown');
        sidebarSelects.forEach(select => {
            select.selectedIndex = 0;
        });
        showMessage('Filters reset');
    }

    // Reset desktop filters
    function resetDesktopFilters() {
        const desktopSelects = document.querySelectorAll('.filter-bar-row .filter-dropdown');
        desktopSelects.forEach(select => {
            select.selectedIndex = 0;
        });
        showMessage('Filters reset');
    }

    // Close mobile menu helper
    function closeMobileMenu() {
        const mobileMenuPanel = document.getElementById(CONFIG.selectors.mobileMenuPanel);
        const mobileOverlay = document.getElementById(CONFIG.selectors.mobileMenuOverlay);
        
        if (mobileMenuPanel) mobileMenuPanel.classList.remove('active');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close filter sidebar helper
    function closeFilterSidebar() {
        const filterSidebar = document.getElementById(CONFIG.selectors.filterSidebar);
        const overlay = document.getElementById(CONFIG.selectors.filterSidebarOverlay);
        
        if (filterSidebar) filterSidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close mobile search helper
    function closeMobileSearch() {
        const mobileSearchBar = document.getElementById(CONFIG.selectors.mobileSearchBar);
        if (mobileSearchBar) {
            mobileSearchBar.classList.remove('active');
        }
    }

    // Show message
    function showMessage(text, type = 'info') {
        console.log(`Message (${type}):`, text);
        
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.xs-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `xs-message xs-message-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#003366'};
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
            animation: xsSlideIn 0.3s ease;
            font-size: 14px;
        `;
        messageDiv.textContent = text;
        
        document.body.appendChild(messageDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.animation = 'xsSlideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
        
        // Add animation styles if not present
        if (!document.querySelector('#xs-animations')) {
            const style = document.createElement('style');
            style.id = 'xs-animations';
            style.textContent = `
                @keyframes xsSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes xsSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Public API
    window.XSHeader = {
        refreshAuth: checkAuthentication,
        refreshCounts: loadCounts,
        showMessage: showMessage,
        navigateToPage: navigateToPage
    };

})();