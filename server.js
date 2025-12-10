const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// MongoDB Connection
mongoose.connect('mongodb+srv://dallaherick0_db_user:pXGtcukipK83r6F5@cluster0.rsxrzym.mongodb.net/XXX?retryWrites=true&w=majority', {

})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️  Server running without database');
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// File structure configuration
const FILE_STRUCTURE = {
    root: __dirname,
    customer: {
        html: path.join(__dirname, 'customer', 'html'),
        css: path.join(__dirname, 'customer', 'css'),
        js: path.join(__dirname, 'customer', 'js')
    }
};

// Ensure customer directories exist
async function ensureDirectories() {
    try {
        const dirs = [
            FILE_STRUCTURE.customer.html,
            FILE_STRUCTURE.customer.css,
            FILE_STRUCTURE.customer.js
        ];
        
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

// API: Check if page exists (used by header.js)
app.get('/api/header/nav/check/:page', async (req, res) => {
    const pageName = req.params.page;
    const pagePath = path.join(FILE_STRUCTURE.customer.html, `${pageName}.html`);
    
    try {
        await fs.access(pagePath);
        res.json({ exists: true, page: pageName });
    } catch (error) {
        res.json({ exists: false, page: pageName });
    }
});

// API: Get authentication status
app.get('/api/auth/me', async (req, res) => {
    // Simplified - in production, check session/cookie
    res.json({ 
        authenticated: false,
        user: null 
    });
});

// API: Logout
app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out' });
});

// API: Get cart count
app.get('/api/shop/cart/count', async (req, res) => {
    res.json({ count: 0 }); // Placeholder
});

// API: Get wishlist count
app.get('/api/shop/wishlist/count', async (req, res) => {
    res.json({ count: 0 }); // Placeholder
});

// Navigation route - loads customer pages with header
app.get('/customer/nav/:page', async (req, res) => {
    const pageName = req.params.page;
    const validPages = [
        'home', 'shop', 'deals', 'resources', 'support', 
        'auth', 'profile', 'wishlist', 'cart', 'orders', 'quote'
    ];

    // Check if page is valid
    if (!validPages.includes(pageName)) {
        return res.redirect('/error?code=404&page=' + encodeURIComponent(pageName));
    }

    try {
        // Check if page exists
        const pagePath = path.join(FILE_STRUCTURE.customer.html, `${pageName}.html`);
        await fs.access(pagePath);
        
        // Read page content
        let pageContent = await fs.readFile(pagePath, 'utf8');
        
        // Read header content
        const headerPath = path.join(FILE_STRUCTURE.customer.html, 'header.html');
        let headerContent = '';
        
        try {
            headerContent = await fs.readFile(headerPath, 'utf8');
        } catch (error) {
            console.log('⚠️  Header not found, using default');
            headerContent = '<header>XS Platform Header</header>';
        }
        
        // Inject header into the page
        if (pageContent.includes('<div id="header-container"></div>')) {
            pageContent = pageContent.replace(
                '<div id="header-container"></div>',
                `<div id="header-container">${headerContent}</div>`
            );
        } else {
            // Add header at the beginning of body if no container found
            const bodyIndex = pageContent.indexOf('<body>');
            if (bodyIndex !== -1) {
                pageContent = pageContent.slice(0, bodyIndex + 6) + 
                             `<div id="header-container">${headerContent}</div>` +
                             pageContent.slice(bodyIndex + 6);
            }
        }
        
        // Send the page
        res.send(pageContent);
        
    } catch (error) {
        console.error(`Page load error for ${pageName}:`, error);
        res.redirect('/error?code=404&page=' + encodeURIComponent(pageName));
    }
});

// Serve individual customer pages directly
app.get('/customer/:page', async (req, res) => {
    const pageName = req.params.page;
    const pagePath = path.join(FILE_STRUCTURE.customer.html, `${pageName}.html`);
    
    try {
        await fs.access(pagePath);
        let pageContent = await fs.readFile(pagePath, 'utf8');
        
        // Inject header if it's not already there
// Always inject header - check for container div
if (pageContent.includes('<div id="header-container"></div>')) {
    pageContent = pageContent.replace(
        '<div id="header-container"></div>',
        `<div id="header-container">${headerContent}</div>`
    );
} else {
    // If no container found, add header at body start
    const bodyStart = pageContent.indexOf('<body>');
    if (bodyStart !== -1) {
        const insertPos = bodyStart + 6; // After <body>
        pageContent = pageContent.slice(0, insertPos) + 
                     `<div id="header-container">${headerContent}</div>` +
                     pageContent.slice(insertPos);
    }
}
        
        res.send(pageContent);
        
    } catch (error) {
        console.error(`Error serving ${pageName}:`, error);
        res.redirect('/error?code=404&page=' + encodeURIComponent(pageName));
    }
});

// Serve CSS and JS files
app.use('/customer/css', express.static(FILE_STRUCTURE.customer.css));
app.use('/customer/js', express.static(FILE_STRUCTURE.customer.js));

// Error page
app.get('/error', (req, res) => {
    const errorCode = req.query.code || '404';
    const requestedPage = req.query.page || 'unknown';
    
    const errorPage = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Error ${errorCode} - XS Platform</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                background: #f8f8f8; 
                margin: 0; 
                padding: 20px; 
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .error-container { 
                text-align: center; 
                padding: 40px; 
                background: white; 
                border-radius: 10px; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
                max-width: 500px;
                width: 100%;
            }
            .error-code { 
                font-size: 72px; 
                color: #003366; 
                font-weight: bold; 
                margin: 0 0 20px;
            }
            .error-message { 
                font-size: 18px; 
                color: #666; 
                margin-bottom: 30px;
            }
            .back-home { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #003366; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: 600; 
                transition: background 0.3s;
            }
            .back-home:hover { 
                background: #0066cc; 
            }
            .page-info {
                font-size: 14px;
                color: #999;
                margin-top: 20px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-code">${errorCode}</div>
            <div class="error-message">
                ${errorCode === '404' ? 'Page not found' : 'Something went wrong'}
            </div>
            <a href="/customer/home" class="back-home">Return to Homepage</a>
            <div class="page-info">
                Requested: ${requestedPage}.html
            </div>
        </div>
    </body>
    </html>`;
    
    res.status(parseInt(errorCode) || 404).send(errorPage);
});

// Home route redirect
app.get('/', (req, res) => {
    res.redirect('/customer/home');
});

// Initialize and start server
async function startServer() {
    // Ensure directories exist
    await ensureDirectories();
    
    // Create basic home page if it doesn't exist
    const homePagePath = path.join(FILE_STRUCTURE.customer.html, 'home.html');
    try {
        await fs.access(homePagePath);
    } catch {
        const basicHome = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XS Platform - Home</title>
    <link rel="stylesheet" href="/customer/css/header.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body>
    <div id="header-container"></div>
    <main style="padding: 20px; text-align: center;">
        <h1>Welcome to XS Platform</h1>
        <p>Electronics e-commerce and service booking platform.</p>
        <a href="/customer/shop" style="display: inline-block; padding: 10px 20px; background: #003366; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">Shop Now</a>
        <a href="/customer/auth" style="display: inline-block; padding: 10px 20px; border: 2px solid #003366; color: #003366; text-decoration: none; border-radius: 5px; margin: 10px;">Login/Register</a>
    </main>
    <script src="/customer/js/header.js"></script>
</body>
</html>`;
        await fs.writeFile(homePagePath, basicHome);
        console.log('📄 Created basic home.html');
    }
    
    // Start server
    app.listen(PORT, () => {
        console.log(`
🚀 XS Platform Server Started
───────────────────────────────
📍 Port: ${PORT}
📂 Root: ${__dirname}
📁 Customer HTML: ${FILE_STRUCTURE.customer.html}
📁 Customer CSS: ${FILE_STRUCTURE.customer.css}
📁 Customer JS: ${FILE_STRUCTURE.customer.js}

🌐 URLs:
   • Homepage: http://localhost:${PORT}/customer/home
   • Shop: http://localhost:${PORT}/customer/shop
   • Auth: http://localhost:${PORT}/customer/auth
   • Profile: http://localhost:${PORT}/customer/profile
   • Error page: http://localhost:${PORT}/error

✅ Server ready! Create HTML files in customer/html/ folder.
        `);
    });
}

// Start the server
startServer().catch(console.error);