// server.js - Complete XS Platform Server
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// MongoDB Connection
mongoose.connect('mongodb+srv://dallaherick0_db_user:pXGtcukipK83r6F5@cluster0.rsxrzym.mongodb.net/XXX?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    createdAt: { type: Date, default: Date.now },
    cart: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        addedAt: { type: Date, default: Date.now }
    }],
    wishlist: [{
        productId: String,
        name: String,
        price: Number,
        addedAt: { type: Date, default: Date.now }
    }]
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    type: { type: String, enum: ['product', 'service'] },
    location: String,
    rating: { type: Number, default: 0 },
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session middleware - FIXED: Use your MongoDB connection string
app.use(session({
    secret: 'xs-platform-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: 'mongodb+srv://dallaherick0_db_user:pXGtcukipK83r6F5@cluster0.rsxrzym.mongodb.net/XXX?retryWrites=true&w=majority'
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        req.user = null; // Don't block, just set to null
        return next();
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

// Ensure directories exist
const ensureDirectories = async () => {
    const dirs = ['customer', 'css', 'js'];
    for (const dir of dirs) {
        const dirPath = path.join(__dirname, dir);
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`Created directory: ${dirPath}`);
        }
    }
};

// Template rendering function - FIXED: Better error handling
async function renderTemplate(pageName, user = null) {
    try {
        // Ensure directories exist first
        await ensureDirectories();
        
        // Check if header.html exists, if not create a basic one
        const headerPath = path.join(__dirname, 'customer', 'header.html');
        let header;
        
        try {
            header = await fs.readFile(headerPath, 'utf-8');
        } catch {
            // If header doesn't exist, create a simple one
            header = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XS Platform</title>
    <link rel="stylesheet" href="/css/header.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body>
<header class="main-header">
    <!-- Header will be loaded by JavaScript -->
</header>
<main class="main-content">
    {{content}}
</main>
<script src="/js/header.js"></script>
</body>
</html>`;
            await fs.writeFile(headerPath, header);
        }
        
        // Check if requested page exists
        const pagePath = path.join(__dirname, 'customer', `${pageName}.html`);
        
        try {
            await fs.access(pagePath);
        } catch {
            // Page doesn't exist
            return renderErrorPage(404, 'Page not found');
        }
        
        // Read page content
        const pageContent = await fs.readFile(pagePath, 'utf-8');
        
        // Extract body content
        const bodyMatch = pageContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : pageContent;
        
        // Replace placeholders
        let html = header.replace('{{content}}', bodyContent);
        
        // Add user data to script if logged in
        if (user) {
            const userScript = `
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        if (window.XSHeader && window.XSHeader.setCurrentUser) {
                            window.XSHeader.setCurrentUser(${JSON.stringify({
                                _id: user._id,
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName
                            })});
                        }
                    });
                </script>
            `;
            html = html.replace('</body>', `${userScript}</body>`);
        }
        
        return html;
        
    } catch (error) {
        console.error('Template rendering error:', error);
        return renderErrorPage(500, 'Internal server error');
    }
}

// Error page renderer
function renderErrorPage(statusCode, message) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error ${statusCode} - XS Platform</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f8f8f8; margin: 0; padding: 20px; }
                .error-container { text-align: center; padding: 100px 20px; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                .error-code { font-size: 72px; color: #003366; font-weight: bold; margin-bottom: 20px; }
                .error-message { font-size: 20px; color: #666; margin-bottom: 40px; }
                .back-home { display: inline-block; padding: 12px 30px; background: #003366; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
                .back-home:hover { background: #0066cc; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-code">${statusCode}</div>
                <div class="error-message">${message}</div>
                <a href="/" class="back-home">Return to Homepage</a>
            </div>
        </body>
        </html>
    `;
}

// =============== ROUTES ===============

// Home route
app.get('/', async (req, res) => {
    try {
        const user = req.session.user || null;
        const html = await renderTemplate('home', user);
        res.send(html);
    } catch (error) {
        res.status(500).send(renderErrorPage(500, 'Server error'));
    }
});

// Page routes
app.get('/:page', async (req, res) => {
    try {
        const page = req.params.page;
        const user = req.session.user || null;
        
        // Protected pages check
        const protectedPages = ['profile', 'wishlist', 'orders', 'checkout'];
        if (protectedPages.includes(page) && !user) {
            return res.redirect('/auth/login');
        }
        
        const html = await renderTemplate(page, user);
        res.send(html);
    } catch (error) {
        res.status(404).send(renderErrorPage(404, 'Page not found'));
    }
});

// Auth sub-routes
app.get('/auth/:subpage', async (req, res) => {
    try {
        const subpage = req.params.subpage;
        const user = req.session.user || null;
        
        // If already logged in and trying to access login/register, redirect to home
        if (user && (subpage === 'login' || subpage === 'register')) {
            return res.redirect('/');
        }
        
        const html = await renderTemplate(`auth/${subpage}`, user);
        res.send(html);
    } catch (error) {
        res.status(404).send(renderErrorPage(404, 'Page not found'));
    }
});

// =============== API ROUTES ===============

// Register API
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName
        });
        
        await user.save();
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Set session
        req.session.user = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed' 
        });
    }
});

// Login API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Set session
        req.session.user = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed' 
        });
    }
});

// Logout API
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ 
        success: true, 
        message: 'Logged out successfully' 
    });
});

// Get current user (for header.js)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        if (!req.userId) {
            return res.json({ 
                success: false, 
                message: 'Not authenticated',
                user: null 
            });
        }
        
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.json({ 
                success: false, 
                message: 'User not found',
                user: null 
            });
        }
        
        res.json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.json({ 
            success: false, 
            message: 'Server error',
            user: null 
        });
    }
});

// Get cart count
app.get('/api/shop/cart/count', authenticateToken, async (req, res) => {
    try {
        if (!req.userId) {
            return res.json({ success: true, count: 0 });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.json({ success: true, count: 0 });
        }
        
        const count = user.cart.reduce((total, item) => total + (item.quantity || 0), 0);
        res.json({ success: true, count });
        
    } catch (error) {
        console.error('Cart count error:', error);
        res.json({ success: true, count: 0 });
    }
});

// Get wishlist count
app.get('/api/shop/wishlist/count', authenticateToken, async (req, res) => {
    try {
        if (!req.userId) {
            return res.json({ success: true, count: 0 });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.json({ success: true, count: 0 });
        }
        
        res.json({ success: true, count: user.wishlist.length || 0 });
        
    } catch (error) {
        console.error('Wishlist count error:', error);
        res.json({ success: true, count: 0 });
    }
});

// Static file routes
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/customer', express.static(path.join(__dirname, 'customer')));

// 404 handler
app.use(async (req, res) => {
    const html = renderErrorPage(404, 'Page not found');
    res.status(404).send(html);
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    const html = renderErrorPage(500, 'Internal server error');
    res.status(500).send(html);
});

// Start server
app.listen(PORT, () => {
    console.log(`XS Platform Server running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👉 Homepage: http://localhost:${PORT}/`);
    console.log(`👉 Shop: http://localhost:${PORT}/shop`);
    console.log(`👉 Login: http://localhost:${PORT}/auth/login`);
    console.log(`\nServer started successfully`);
});