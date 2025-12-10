// header-footer.js - Shared JavaScript for all pages
(function() {
    'use strict';
    
    // Global state
    let currentUser = null;
    let cartCount = 0;
    let wishlistCount = 0;
    
    // API Configuration
    const API_CONFIG = {
        BASE_URL: 'http://localhost:3000/api', // Change this to your backend URL
        ENDPOINTS: {
            AUTH: {
                CHECK: '/auth/check',
                LOGOUT: '/auth/logout'
            },
            CART: {
                COUNT: '/cart/count'
            },
            WISHLIST: {
                COUNT: '/wishlist/count'
            },
            SEARCH: {
                QUICK: '/search/quick'
            },
            USER: {
                PROFILE: '/user/profile'
            }
        }
    };
    
    // Create overlays for mobile menu and filter sidebar
    function createOverlays() {
        // Mobile menu overlay
        if (!document.getElementById('mobile-menu-overlay')) {
            const mobileOverlay = document.createElement('div');
            mobileOverlay.className = 'mobile-menu-overlay';
            mobileOverlay.id = 'mobile-menu-overlay';
            document.body.appendChild(mobileOverlay);
        }
        
        // Filter sidebar overlay
        if (!document.getElementById('filter-sidebar-overlay')) {
            const filterOverlay = document.createElement('div');
            filterOverlay.className = 'filter-sidebar-overlay';
            filterOverlay.id = 'filter-sidebar-overlay';
            document.body.appendChild(filterOverlay);
        }
    }
    
    // API Helper Functions
    async function apiRequest(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            credentials: 'include'
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    clearAuth();
                    return null;
                }
                throw new Error(`API request failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            return null;
        }
    }
    
    function getToken() {
        return localStorage.getItem('xs_token') || sessionStorage.getItem('xs_token');
    }
    
    function clearAuth() {
        localStorage.removeItem('xs_token');
        sessionStorage.removeItem('xs_token');
        currentUser = null;
        updateAuthUI();
    }
    
    // Authentication Functions
    async function checkAuth() {
        const token = getToken();
        if (!token) {
            updateAuthUI();
            return false;
        }
        
        try {
            const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.CHECK);
            if (data && data.user) {
                currentUser = data.user;
                updateAuthUI();
                await loadUserCounts();
                return true;
            } else {
                clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            updateAuthUI();
            return false;
        }
    }
    
    async function logout() {
        try {
            await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuth();
            window.location.href = 'index.html';
        }
    }
    
    // Load user counts (cart, wishlist)
    async function loadUserCounts() {
        if (!currentUser) {
            updateCartCountUI(0);
            updateWishlistCountUI(0);
            return;
        }
        
        try {
            // Load cart count
            const cartData = await apiRequest(API_CONFIG.ENDPOINTS.CART.COUNT);
            if (cartData && cartData.count !== undefined) {
                updateCartCountUI(cartData.count);
            }
            
            // Load wishlist count
            const wishlistData = await apiRequest(API_CONFIG.ENDPOINTS.WISHLIST.COUNT);
            if (wishlistData && wishlistData.count !== undefined) {
                updateWishlistCountUI(wishlistData.count);
            }
        } catch (error) {
            console.error('Error loading user counts:', error);
        }
    }
    
    // Quick search function for header search
    async function performQuickSearch(query) {
        if (!query.trim()) return null;
        
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH.QUICK}?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Quick search error:', error);
            return null;
        }
    }
    
    // Navigate to search page with query
    function navigateToSearchPage(query) {
        if (query && query.trim()) {
            window.location.href = `search-results.html?q=${encodeURIComponent(query.trim())}`;
        }
    }
    
    // Update authentication UI
    function updateAuthUI() {
        const loggedOutState = document.getElementById('logged-out-state');
        const loggedInState = document.getElementById('logged-in-state');
        const mobileLoggedOutState = document.getElementById('mobile-logged-out-state');
        const mobileLoggedInState = document.getElementById('mobile-logged-in-state');
        
        if (currentUser) {
            // Show logged in state
            if (loggedOutState) loggedOutState.style.display = 'none';
            if (loggedInState) loggedInState.style.display = 'flex';
            if (mobileLoggedOutState) mobileLoggedOutState.style.display = 'none';
            if (mobileLoggedInState) mobileLoggedInState.style.display = 'block';
            
            // Update user info
            const userName = document.getElementById('mobile-user-name');
            const userEmail = document.getElementById('mobile-user-email');
            if (userName) userName.textContent = currentUser.name || 'Welcome!';
            if (userEmail) userEmail.textContent = currentUser.email || '';
        } else {
            // Show logged out state
            if (loggedOutState) loggedOutState.style.display = 'block';
            if (loggedInState) loggedInState.style.display = 'none';
            if (mobileLoggedOutState) mobileLoggedOutState.style.display = 'block';
            if (mobileLoggedInState) mobileLoggedInState.style.display = 'none';
        }
    }
    
    // Set active navigation link based on current page
    function setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Make logo clickable and redirect to homepage
    function initLogoClick() {
        const logos = document.querySelectorAll('.logo, .mobile-logo');
        logos.forEach(logo => {
            logo.style.cursor = 'pointer';
            logo.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
        });
    }
    
    // Remove Home button from navigation
    function removeHomeButton() {
        const homeLinks = document.querySelectorAll('a[href="index.html"].nav-link, a[href="index.html"].mobile-nav-link');
        homeLinks.forEach(link => {
            link.parentNode.removeChild(link);
        });
    }
    
    // Mobile menu functionality
    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        const mobileMenuPanel = document.getElementById('mobile-menu-panel');
        const overlay = document.getElementById('mobile-menu-overlay');
        
        if (!mobileMenuBtn || !mobileMenuPanel || !overlay) return;
        
        // Open mobile menu
        function openMobileMenu() {
            mobileMenuPanel.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Close mobile menu
        function closeMobileMenu() {
            mobileMenuPanel.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Toggle mobile menu on button click
        mobileMenuBtn.addEventListener('click', openMobileMenu);
        
        // Close on close button click
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMobileMenu);
        }
        
        // Close on overlay click
        overlay.addEventListener('click', closeMobileMenu);
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenuPanel.classList.contains('active')) {
                closeMobileMenu();
            }
        });
        
        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenuPanel.querySelectorAll('a, button');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (!this.classList.contains('mobile-menu-close') && 
                    !this.classList.contains('mobile-action-btn')) {
                    closeMobileMenu();
                }
            });
        });
    }
    
    // Mobile search functionality
    function initMobileSearch() {
        const mobileSearchBtn = document.getElementById('mobile-search-btn');
        const mobileSearchClose = document.getElementById('mobile-search-close');
        const mobileSearchBar = document.getElementById('mobile-search-bar');
        const mobileSearchInput = document.querySelector('.mobile-search-input');
        
        if (!mobileSearchBtn || !mobileSearchBar) return;
        
        // Open mobile search
        function openMobileSearch() {
            mobileSearchBar.classList.add('active');
            setTimeout(() => {
                if (mobileSearchInput) mobileSearchInput.focus();
            }, 100);
        }
        
        // Close mobile search
        function closeMobileSearch() {
            mobileSearchBar.classList.remove('active');
            if (mobileSearchInput) mobileSearchInput.value = '';
        }
        
        // Open search on button click
        mobileSearchBtn.addEventListener('click', openMobileSearch);
        
        // Close search on close button click
        if (mobileSearchClose) {
            mobileSearchClose.addEventListener('click', closeMobileSearch);
        }
        
        // Search on Enter key in mobile search
        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const query = this.value.trim();
                    if (query) {
                        closeMobileSearch();
                        navigateToSearchPage(query);
                    }
                }
            });
        }
        
        // Close search on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileSearchBar.classList.contains('active')) {
                closeMobileSearch();
            }
        });
    }
    
    // Filter sidebar functionality
    function initFilterSidebar() {
        const filterBtn = document.getElementById('filter-btn');
        const filterSidebar = document.getElementById('filter-sidebar');
        const filterSidebarClose = document.getElementById('filter-sidebar-close');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const sidebarResetBtn = document.getElementById('sidebar-reset-filters-btn');
        const overlay = document.getElementById('filter-sidebar-overlay');
        
        if (!filterBtn || !filterSidebar || !overlay) return;
        
        // Open filter sidebar
        function openFilterSidebar() {
            filterSidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Close filter sidebar
        function closeFilterSidebar() {
            filterSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Open sidebar on filter button click
        filterBtn.addEventListener('click', openFilterSidebar);
        
        // Close sidebar on close button click
        if (filterSidebarClose) {
            filterSidebarClose.addEventListener('click', closeFilterSidebar);
        }
        
        // Close sidebar on overlay click
        overlay.addEventListener('click', closeFilterSidebar);
        
        // Apply filters
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                const sidebarFilters = {};
                const sidebarSelects = filterSidebar.querySelectorAll('.filter-dropdown');
                
                sidebarSelects.forEach(select => {
                    const filterId = select.id.replace('sidebar-', '');
                    const filterValue = select.value;
                    if (filterValue) {
                        sidebarFilters[filterId] = filterValue;
                    }
                });
                
                if (Object.keys(sidebarFilters).length > 0) {
                    closeFilterSidebar();
                    navigateToSearchPageWithFilters(sidebarFilters);
                } else {
                    showMessage('Please select at least one filter');
                }
            });
        }
        
        // Reset sidebar filters
        if (sidebarResetBtn) {
            sidebarResetBtn.addEventListener('click', function() {
                const sidebarSelects = filterSidebar.querySelectorAll('.filter-dropdown');
                sidebarSelects.forEach(select => {
                    select.selectedIndex = 0;
                });
                showMessage('Sidebar filters have been reset');
            });
        }
        
        // Close sidebar on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && filterSidebar.classList.contains('active')) {
                closeFilterSidebar();
            }
        });
    }
    
    // Navigate to search page with filters
    function navigateToSearchPageWithFilters(filters) {
        const params = new URLSearchParams(filters).toString();
        window.location.href = `search-results.html?${params}`;
    }
    
    // Main search functionality
    function initSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchIcon = document.querySelector('.search-bar-top .fa-search');
        
        if (!searchInput) return;
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    navigateToSearchPage(query);
                }
            }
        });
        
        // Search on icon click
        if (searchIcon) {
            searchIcon.addEventListener('click', function() {
                const searchInput = document.querySelector('.search-input');
                const query = searchInput.value.trim();
                if (query) {
                    navigateToSearchPage(query);
                }
            });
        }
        
        // Optional: Add autocomplete/suggestions
        searchInput.addEventListener('input', debounce(async function() {
            const query = this.value.trim();
            if (query.length >= 2) {
                const suggestions = await performQuickSearch(query);
                // Implement suggestion dropdown if needed
                console.log('Search suggestions:', suggestions);
            }
        }, 300));
    }
    
    // Filter functionality (desktop filter bar)
    function initFilters() {
        const filterSelects = document.querySelectorAll('.filter-dropdown:not(#sidebar-type-filter):not(#sidebar-category-filter):not(#sidebar-location-filter):not(#sidebar-price-filter):not(#sidebar-rating-filter)');
        const resetBtn = document.getElementById('reset-filters-btn');
        
        if (!filterSelects.length) return;
        
        let activeFilters = {};
        
        // Handle filter changes
        filterSelects.forEach(select => {
            select.addEventListener('change', function() {
                const filterId = this.id;
                const filterValue = this.value;
                
                if (filterValue) {
                    activeFilters[filterId] = filterValue;
                } else {
                    delete activeFilters[filterId];
                }
                
                updateActiveFilters();
            });
        });
        
        // Reset filters
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                filterSelects.forEach(select => {
                    select.selectedIndex = 0;
                });
                activeFilters = {};
                updateActiveFilters();
                showMessage('Filters have been reset');
            });
        }
        
        function updateActiveFilters() {
            if (Object.keys(activeFilters).length > 0) {
                navigateToSearchPageWithFilters(activeFilters);
            }
        }
    }
    
    // Button functionality
    function initButtons() {
        // Cart button
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', function() {
                window.location.href = 'cart.html';
            });
        }
        
        // Wishlist button
        const wishlistBtn = document.getElementById('wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', function() {
                window.location.href = 'wishlist.html';
            });
        }
        
        // Request quote button
        const quoteBtn = document.getElementById('request-quote-btn');
        if (quoteBtn) {
            quoteBtn.addEventListener('click', function() {
                window.location.href = 'booking-form.html';
            });
        }
        
        // Notification button
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', function() {
                showMessage('Notifications page is coming soon!');
            });
        }
        
        // User dropdown
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function() {
                userDropdown.classList.remove('show');
            });
        }
        
        // Mobile user dropdown
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', logout);
        }
        
        // Desktop logout
        const desktopLogoutBtn = document.getElementById('logout-btn');
        if (desktopLogoutBtn) {
            desktopLogoutBtn.addEventListener('click', logout);
        }
        
        // Mobile buttons
        const mobileWishlistBtn = document.getElementById('mobile-wishlist-btn');
        if (mobileWishlistBtn) {
            mobileWishlistBtn.addEventListener('click', function() {
                closeMobileMenu();
                window.location.href = 'wishlist.html';
            });
        }
        
        const mobileCartBtn = document.getElementById('mobile-cart-btn');
        if (mobileCartBtn) {
            mobileCartBtn.addEventListener('click', function() {
                closeMobileMenu();
                window.location.href = 'cart.html';
            });
        }
        
        const mobileQuoteBtn = document.getElementById('mobile-quote-btn');
        if (mobileQuoteBtn) {
            mobileQuoteBtn.addEventListener('click', function() {
                closeMobileMenu();
                window.location.href = 'booking-form.html';
            });
        }
        
        // Close mobile menu helper
        function closeMobileMenu() {
            const mobileMenuPanel = document.getElementById('mobile-menu-panel');
            const overlay = document.getElementById('mobile-menu-overlay');
            if (mobileMenuPanel && mobileMenuPanel.classList.contains('active')) {
                mobileMenuPanel.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }
    
    // Update cart count UI
    function updateCartCountUI(count) {
        cartCount = count;
        const cartElement = document.querySelector('.cart-count');
        const mobileCartElement = document.querySelector('.mobile-cart-count');
        
        if (cartElement) {
            cartElement.textContent = count;
            cartElement.style.display = count > 0 ? 'inline' : 'none';
        }
        if (mobileCartElement) {
            mobileCartElement.textContent = count;
            mobileCartElement.style.display = count > 0 ? 'inline' : 'none';
        }
    }
    
    // Update wishlist count UI
    function updateWishlistCountUI(count) {
        wishlistCount = count;
        const wishlistElement = document.querySelector('.wishlist-count');
        const mobileWishlist = document.querySelector('.mobile-wishlist-count');
        
        if (wishlistElement) {
            wishlistElement.textContent = count;
            wishlistElement.style.display = count > 0 ? 'inline' : 'none';
        }
        if (mobileWishlist) {
            mobileWishlist.textContent = count;
            mobileWishlist.style.display = count > 0 ? 'inline' : 'none';
        }
    }
    
    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Show message notification
    function showMessage(message) {
        console.log('Message:', message);
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'xs-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-blue);
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
            font-size: 14px;
        `;
        
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
        
        // Add animation styles if not present
        if (!document.querySelector('#xs-animations')) {
            const style = document.createElement('style');
            style.id = 'xs-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Initialize all header functionality
    async function initializeHeader() {
        createOverlays();
        setActiveNavLink();
        initLogoClick();
        removeHomeButton();
        initMobileMenu();
        initMobileSearch();
        initFilterSidebar();
        initButtons();
        initSearch();
        initFilters();
        
        // Check authentication
        await checkAuth();
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('XS Platform Header initialized');
        initializeHeader();
    });
    
    // Export to global scope
    window.XSHeader = {
        // Public methods for other pages to use
        updateCartCount: updateCartCountUI,
        updateWishlistCount: updateWishlistCountUI,
        showMessage: showMessage,
        setActiveNavLink: setActiveNavLink,
        getCartCount: function() { return cartCount; },
        getWishlistCount: function() { return wishlistCount; },
        setCartCount: function(count) { updateCartCountUI(count); },
        setWishlistCount: function(count) { updateWishlistCountUI(count); },
        getCurrentUser: function() { return currentUser; },
        logout: logout,
        checkAuth: checkAuth
    };
})();