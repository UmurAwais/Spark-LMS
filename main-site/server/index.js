const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Order = require('./models/Order');
const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');
const StudentProgress = require('./models/StudentProgress');
const Badge = require('./models/Badge');
const StudentBadge = require('./models/StudentBadge');
const Certificate = require('./models/Certificate');
const ActivityLog = require('./models/ActivityLog');
const User = require('./models/User');
const AdminRole = require('./models/AdminRole');

// Role configuration
const { ROLES, PERMISSIONS, hasPermission, getRolePermissions, getRoleDisplayName, getRoleDescription } = require('./config/roles');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Connect to MongoDB with timeout and better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms';
let isMongoDBConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${MONGODB_URI}`);
    isMongoDBConnected = true;
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('   MongoDB is not running or not installed.');
    console.error('   Please check MONGODB_SETUP.md in the project root for setup instructions.');
    console.error('');
    console.error('   Quick fixes:');
    console.error('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.error('   2. Start MongoDB service: net start MongoDB');
    console.error('   3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas');
    console.error('');
    console.error('⚠️  Server will continue running but database operations will fail.');
    console.error('');
  });

// Export connection status checker
function checkMongoConnection(req, res, next) {
  if (!isMongoDBConnected) {
    return res.status(503).json({ 
      ok: false, 
      message: 'Database not connected. Please check server logs for setup instructions.',
      error: 'MongoDB connection not established'
    });
  }
  next();
}

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

// Only initialize if service account exists
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized');
} else {
  console.warn('⚠️  Firebase service account not found. User management features will be limited.');
}


const app = express();
const PORT = process.env.PORT || 4001;

// Enable CORS with explicit options to ensure browser preflight succeeds
const corsOptions = {
  origin: true, // reflect request origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-admin-token"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Basic request logger to help debug network issues
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const coursesUploadDir = path.join(uploadDir, 'courses');
const videosUploadDir = path.join(uploadDir, 'videos');

[uploadDir, coursesUploadDir, videosUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = file.fieldname === 'video' ? videosUploadDir : coursesUploadDir;
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB for videos
});

// Simple health endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ ok: true, message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Serve test page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// Orders endpoint with file upload
app.post('/api/orders', upload.single('screenshot'), async (req, res) => {
  try {
    // Multer will populate req.file and req.body
    const file = req.file;
    const body = req.body || {};

    if (!file) {
      return res.status(400).json({ success: false, message: 'No screenshot uploaded' });
    }

    // Basic validation
    if (!body.firstName || !body.email) {
      // remove uploaded file if validation fails
      fs.unlink(path.join(uploadDir, file.filename), () => {});
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const orderData = {
      uid: body.uid || null,
      firstName: body.firstName,
      lastName: body.lastName || '',
      city: body.city || '',
      phone: body.phone || '',
      email: body.email,
      notes: body.notes || '',
      courseId: body.courseId || '',
      courseTitle: body.courseTitle || '',
      items: body.items ? JSON.parse(body.items) : [],
      amount: body.amount || body.total || '',
      paymentScreenshot: `/uploads/courses/${file.filename}`,
      status: 'Pending'
    };
    
    console.log('📝 Saving order to MongoDB:', { amount: orderData.amount });

    const newOrder = await Order.create(orderData);

    // Log new order activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: 'order',
        title: 'New Order Received',
        message: `${orderData.firstName} ${orderData.lastName} ordered ${orderData.courseTitle}`,
        user: orderData.email,
        time: new Date()
      });
    } catch (e) {
      console.error('Failed to log order activity:', e);
    }

    return res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// GET endpoint to fetch all orders
app.get('/api/orders', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ ok: true, orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch orders' });
  }
});

// Update order status (Admin only)
app.put('/api/admin/orders/:id/status', adminAuth, express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ ok: false, message: 'Order not found' });
    }

    res.json({ ok: true, message: 'Order status updated', order: updatedOrder });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Session Management ---
const sessionsFile = path.join(__dirname, 'sessions.json');

// Create/Update Session
app.post('/api/auth/session', express.json(), async (req, res) => {
  try {
    const { uid, sessionId } = req.body;
    if (!uid || !sessionId) {
      return res.status(400).json({ ok: false, message: 'UID and SessionID required' });
    }

    let sessions = {};
    if (fs.existsSync(sessionsFile)) {
      sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}');
    }

    sessions[uid] = {
      sessionId,
      lastActive: new Date().toISOString()
    };

    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    
    // Log user login activity
    try {
      // Only log if this session is relatively new (e.g., within last minute) or we can just log every session update as 'active'
      // But user asked for "when someone login". Session update happens often.
      // Let's check if we already logged a login for this user recently to avoid spam
      // For now, simple logging
      await ActivityLog.create({
        id: Date.now().toString(),
        type: 'login',
        title: 'User Login',
        message: `User ${uid} logged in`,
        user: uid,
        time: new Date()
      });
    } catch (e) {
      console.error('Failed to log user login:', e);
    }

    res.json({ ok: true, message: 'Session updated' });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Verify Session
app.post('/api/auth/verify-session', express.json(), (req, res) => {
  try {
    const { uid, sessionId } = req.body;
    if (!uid || !sessionId) {
      return res.status(400).json({ ok: false, message: 'UID and SessionID required' });
    }

    if (!fs.existsSync(sessionsFile)) {
      // If no sessions file exists yet, we can't verify, so we force a logout to establish a session
      return res.json({ ok: true, valid: false, message: 'System reset, please login again' });
    }

    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}');
    const userSession = sessions[uid];

    if (!userSession) {
       return res.json({ ok: true, valid: false, message: 'No active session found' });
    }

    if (userSession.sessionId !== sessionId) {
      return res.json({ ok: true, valid: false, message: 'Session mismatch' });
    }

    res.json({ ok: true, valid: true });
  } catch (err) {
    console.error('Verify session error:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Firebase User Management Endpoints ---

// Function to generate unique reference number
async function generateReferenceNumber() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referenceNumber;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate format: UC-XXXX-XXXX-XXXX (similar to Udemy)
    const part1 = Array.from({length: 4}, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    const part2 = Array.from({length: 4}, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    const part3 = Array.from({length: 4}, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    referenceNumber = `UC-${part1}-${part2}-${part3}`;
    
    // Check if this reference number already exists
    const existing = await User.findOne({ referenceNumber });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return referenceNumber;
}

// Get all users (Admin only)
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({ ok: false, message: 'Firebase Admin not initialized' });
    }

    const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users
    
    // Fetch reference numbers from MongoDB
    const userRecords = await User.find({});
    const referenceMap = {};
    userRecords.forEach(user => {
      referenceMap[user.uid] = user.referenceNumber;
    });
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      referenceNumber: referenceMap[user.uid] || null,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      },
      providerData: user.providerData
    }));

    res.json({ ok: true, users });
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create new user (Admin only)
app.post('/api/admin/users/create', adminAuth, express.json(), async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({ ok: false, message: 'Firebase Admin not initialized' });
    }

    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password are required' });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
      emailVerified: false
    });

    // Generate and store reference number
    const referenceNumber = await generateReferenceNumber();
    await User.create({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || '',
      referenceNumber
    });

    res.json({ 
      ok: true, 
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        referenceNumber
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Store user reference number (called after Firebase registration)
app.post('/api/users/register', express.json(), async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ ok: false, message: 'UID and email are required' });
    }

    // Check if user already has a reference number
    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      return res.json({ 
        ok: true, 
        message: 'User already registered',
        referenceNumber: existingUser.referenceNumber
      });
    }

    // Generate and store reference number
    const referenceNumber = await generateReferenceNumber();
    await User.create({
      uid,
      email,
      displayName: displayName || '',
      referenceNumber
    });

    res.json({ 
      ok: true, 
      message: 'User registered successfully',
      referenceNumber
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Send password reset email (Admin only)
app.post('/api/admin/users/reset-password', adminAuth, express.json(), async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({ ok: false, message: 'Firebase Admin not initialized' });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required' });
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // In production, you would send this via email service
    // For now, we'll return it so admin can share it
    res.json({ 
      ok: true, 
      message: `Password reset link generated for ${email}`,
      resetLink: resetLink
    });
  } catch (err) {
    console.error('Error generating reset link:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Send custom email (Admin only) - Mock implementation
app.post('/api/admin/send-email', adminAuth, express.json(), (req, res) => {
  try {
    const { email, subject, body } = req.body;
    
    if (!email || !subject || !body) {
      return res.status(400).json({ ok: false, message: 'Missing required fields' });
    }

    // Here you would integrate with SendGrid, Nodemailer, etc.
    console.log('📧 MOCK EMAIL SENDING:');
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${body}`);
    console.log('------------------------');

    res.json({ ok: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Toggle user disabled status (Admin only)
app.post('/api/admin/users/toggle-status', adminAuth, express.json(), async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({ ok: false, message: 'Firebase Admin not initialized' });
    }

    const { uid, disabled } = req.body;

    if (!uid) {
      return res.status(400).json({ ok: false, message: 'User UID is required' });
    }

    const userRecord = await admin.auth().updateUser(uid, {
      disabled: disabled
    });

    res.json({ 
      ok: true, 
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        disabled: userRecord.disabled
      }
    });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:uid', adminAuth, async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({ ok: false, message: 'Firebase Admin not initialized' });
    }

    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ ok: false, message: 'User UID is required' });
    }

    await admin.auth().deleteUser(uid);

    res.json({ 
      ok: true, 
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Serve uploaded files statically
app.use('/upload', express.static(uploadDir));

// --- Courses & Lectures API (simple JSON storage)
const coursesFile = path.join(__dirname, 'courses.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// List public courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (e) {
    console.error('Error fetching courses:', e);
    res.status(500).json([]);
  }
});

// Get onsite courses
app.get('/api/courses/onsite', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ ok: true, courses });
  } catch (e) {
    console.error('Error fetching onsite courses:', e);
    res.status(500).json({ ok: false, courses: [], message: 'Failed to fetch onsite courses' });
  }
});

// Get online courses
app.get('/api/courses/online', async (req, res) => {
  try {
    const courses = await OnlineCourse.find().sort({ createdAt: -1 });
    res.json({ ok: true, courses });
  } catch (e) {
    console.error('Error fetching online courses:', e);
    res.status(500).json({ ok: false, courses: [], message: 'Failed to fetch online courses' });
  }
});



// Simple admin authentication (POST /api/admin/login { password })
app.post('/api/admin/login', express.json(), async (req, res) => {
  const { password } = req.body || {};
  console.log('Admin login attempt received');
  console.log('Expected password:', ADMIN_PASSWORD);
  console.log('Received password:', password);
  if (!password) {
    console.log('Admin login failed: missing password');
    return res.status(400).json({ error: 'password required' });
  }
  if (password !== ADMIN_PASSWORD) {
    console.log('Admin login failed: invalid password');
    console.log('Password match failed:', password, '!==', ADMIN_PASSWORD);
    return res.status(401).json({ error: 'invalid password' });
  }
  
  // Log admin login
  try {
    await ActivityLog.create({
      id: Date.now().toString(),
      type: 'login',
      title: 'Admin Login',
      message: 'Admin logged into the dashboard',
      user: 'Admin',
      time: new Date()
    });
  } catch (e) {
    console.error('Failed to log admin login:', e);
  }

  // return a simple token (for demo only)
  const token = Buffer.from(password).toString('base64');
  console.log('Admin login success');
  res.json({ ok: true, token, role: 'super_admin', email: 'admin' });
});

// Role-based admin login (for invited admins)
app.post('/api/admin/role-login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    // Find admin role
    const adminRole = await AdminRole.findOne({ email: email.toLowerCase(), status: 'active' });
    
    if (!adminRole) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, adminRole.password);
    
    if (!isValid) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    // Update last login
    adminRole.lastLogin = new Date();
    await adminRole.save();

    // Log login
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: 'login',
        title: `${getRoleDisplayName(adminRole.role)} Login`,
        message: `${email} logged into the dashboard`,
        user: email,
        time: new Date()
      });
    } catch (e) {
      console.error('Failed to log role login:', e);
    }

    // Create token with role info
    const tokenData = JSON.stringify({ email, role: adminRole.role });
    const token = Buffer.from(tokenData).toString('base64');
    
    res.json({ 
      ok: true, 
      token,
      role: adminRole.role,
      email: adminRole.email,
      permissions: getRolePermissions(adminRole.role)
    });
  } catch (err) {
    console.error('Role login error:', err);
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

// Enhanced middleware to protect admin routes with role checking
async function adminAuth(req, res, next) {
  const token = req.get('x-admin-token');
  if (!token) return res.status(401).json({ error: 'missing token' });
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    
    // Check if it's super admin password
    if (decoded === ADMIN_PASSWORD) {
      req.adminRole = 'super_admin';
      req.adminEmail = 'admin';
      return next();
    }
    
    // Check if it's a role-based token
    try {
      const tokenData = JSON.parse(decoded);
      if (tokenData.email && tokenData.role) {
        // Verify role is still active
        const adminRole = await AdminRole.findOne({ 
          email: tokenData.email, 
          role: tokenData.role,
          status: 'active'
        });
        
        if (adminRole) {
          req.adminRole = adminRole.role;
          req.adminEmail = adminRole.email;
          return next();
        }
      }
    } catch (e) {
      // Not a JSON token, invalid
    }
    
    return res.status(403).json({ error: 'forbidden' });
  } catch (err) {
    return res.status(403).json({ error: 'invalid token' });
  }
}

// Middleware to check specific permission
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.adminRole) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!hasPermission(req.adminRole, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// --- Role Management Endpoints ---

// Get all admin roles (Super Admin only)
app.get('/api/admin/roles', adminAuth, requirePermission(PERMISSIONS.VIEW_ROLES), async (req, res) => {
  try {
    const roles = await AdminRole.find().select('-password').sort({ invitedAt: -1 });
    
    const rolesWithDetails = roles.map(role => ({
      _id: role._id,
      email: role.email,
      role: role.role,
      roleDisplay: getRoleDisplayName(role.role),
      roleDescription: getRoleDescription(role.role),
      invitedBy: role.invitedBy,
      invitedAt: role.invitedAt,
      status: role.status,
      lastLogin: role.lastLogin,
      permissions: getRolePermissions(role.role)
    }));
    
    res.json({ ok: true, roles: rolesWithDetails });
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch roles' });
  }
});

// Invite new admin (Super Admin only)
app.post('/api/admin/roles/invite', adminAuth, requirePermission(PERMISSIONS.MANAGE_ROLES), express.json(), async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ ok: false, message: 'Email and role are required' });
    }
    
    // Validate role
    const validRoles = Object.values(ROLES).filter(r => r !== ROLES.SUPER_ADMIN);
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Invalid role' });
    }
    
    // Check if email already exists
    const existing = await AdminRole.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ ok: false, message: 'This email already has an admin role' });
    }
    
    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create admin role
    const adminRole = await AdminRole.create({
      email: email.toLowerCase(),
      role,
      invitedBy: req.adminEmail,
      inviteToken,
      tokenExpiry,
      status: 'pending'
    });
    
    // Generate invitation link
    const inviteLink = `${req.protocol}://${req.get('host')}/admin/accept-invite?token=${inviteToken}`;
    
    // Log activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: 'admin',
        title: 'Admin Role Invited',
        message: `${req.adminEmail} invited ${email} as ${getRoleDisplayName(role)}`,
        user: req.adminEmail,
        time: new Date()
      });
    } catch (e) {
      console.error('Failed to log invitation:', e);
    }
    
    res.json({ 
      ok: true, 
      message: 'Invitation created successfully',
      inviteLink,
      email: adminRole.email,
      role: adminRole.role,
      roleDisplay: getRoleDisplayName(adminRole.role),
      expiresAt: tokenExpiry
    });
  } catch (err) {
    console.error('Error creating invitation:', err);
    res.status(500).json({ ok: false, message: 'Failed to create invitation' });
  }
});

// Accept invitation and set password
app.post('/api/admin/roles/accept-invite', express.json(), async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ ok: false, message: 'Token and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters' });
    }
    
    // Find invitation
    const adminRole = await AdminRole.findOne({ 
      inviteToken: token,
      status: 'pending'
    });
    
    if (!adminRole) {
      return res.status(404).json({ ok: false, message: 'Invalid or expired invitation' });
    }
    
    // Check if token expired
    if (adminRole.tokenExpiry < new Date()) {
      return res.status(400).json({ ok: false, message: 'Invitation has expired' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update admin role
    adminRole.password = hashedPassword;
    adminRole.status = 'active';
    adminRole.inviteToken = undefined;
    adminRole.tokenExpiry = undefined;
    await adminRole.save();
    
    // Log activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: 'admin',
        title: 'Admin Role Activated',
        message: `${adminRole.email} activated their ${getRoleDisplayName(adminRole.role)} account`,
        user: adminRole.email,
        time: new Date()
      });
    } catch (e) {
      console.error('Failed to log activation:', e);
    }
    
    res.json({ 
      ok: true, 
      message: 'Account activated successfully',
      email: adminRole.email,
      role: adminRole.role
    });
  } catch (err) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ ok: false, message: 'Failed to activate account' });
  }
});

// Verify invitation token
app.get('/api/admin/roles/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const adminRole = await AdminRole.findOne({ 
      inviteToken: token,
      status: 'pending'
    }).select('-password');
    
    if (!adminRole) {
      return res.status(404).json({ ok: false, message: 'Invalid invitation' });
    }
    
    if (adminRole.tokenExpiry < new Date()) {
      return res.status(400).json({ ok: false, message: 'Invitation has expired' });
    }
    
    res.json({ 
      ok: true,
      email: adminRole.email,
      role: adminRole.role,
      roleDisplay: getRoleDisplayName(adminRole.role),
      roleDescription: getRoleDescription(adminRole.role),
      expiresAt: adminRole.tokenExpiry
    });
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(500).json({ ok: false, message: 'Failed to verify token' });
  }
});

// Update admin role (Super Admin only)
app.put('/api/admin/roles/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_ROLES), express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ ok: false, message: 'Role is required' });
    }
    
    // Validate role
    const validRoles = Object.values(ROLES).filter(r => r !== ROLES.SUPER_ADMIN);
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Invalid role' });
    }
    
    const adminRole = await AdminRole.findById(id);
    
    if (!adminRole) {
      return res.status(404).json({ ok: false, message: 'Admin role not found' });
    }
    
    const oldRole = adminRole.role;
    adminRole.role = role;
    await adminRole.save();
    
    // Log activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: 'admin',
        title: 'Admin Role Updated',
        message: `${req.adminEmail} changed ${adminRole.email}'s role from ${getRoleDisplayName(oldRole)} to ${getRoleDisplayName(role)}`,
        user: req.adminEmail,
        time: new Date()
      });
    } catch (e) {
      console.error('Failed to log role update:', e);
    }
    
    res.json({ 
      ok: true, 
      message: 'Role updated successfully',
      role: adminRole.role,
      roleDisplay: getRoleDisplayName(adminRole.role)
    });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ ok: false, message: 'Failed to update role' });
  }
});

// Revoke admin access (Super Admin only)
app.delete('/api/admin/roles/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    
    const adminRole = await AdminRole.findById(id);
    
    if (!adminRole) {
      return res.status(404).json({ ok: false, message: 'Admin role not found' });
    }
    
    adminRole.status = 'revoked';
    await adminRole.save();
    
    // Log activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: 'admin',
        title: 'Admin Access Revoked',
        message: `${req.adminEmail} revoked ${adminRole.email}'s ${getRoleDisplayName(adminRole.role)} access`,
        user: req.adminEmail,
        time: new Date()
      });
    } catch (e) {
      console.error('Failed to log revocation:', e);
    }
    
    res.json({ 
      ok: true, 
      message: 'Access revoked successfully'
    });
  } catch (err) {
    console.error('Error revoking access:', err);
    res.status(500).json({ ok: false, message: 'Failed to revoke access' });
  }
});

// Get available roles and their permissions (for UI)
app.get('/api/admin/roles/available', adminAuth, async (req, res) => {
  try {
    const availableRoles = Object.values(ROLES)
      .filter(role => role !== ROLES.SUPER_ADMIN)
      .map(role => ({
        value: role,
        label: getRoleDisplayName(role),
        description: getRoleDescription(role),
        permissions: getRolePermissions(role)
      }));
    
    res.json({ ok: true, roles: availableRoles });
  } catch (err) {
    console.error('Error fetching available roles:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch available roles' });
  }
});

// Create course (admin)
app.post('/api/admin/courses', adminAuth, express.json(), async (req, res) => {
  const { title, excerpt, price, instructor, image, id } = req.body || {};
  if (!title || !id) return res.status(400).json({ error: 'title and id required' });
  
  const exists = await Course.findOne({ id });
  if (exists) return res.status(400).json({ error: 'course id exists' });
  
  const newCourse = await Course.create({ 
    id, 
    title, 
    excerpt: excerpt || '', 
    price: price || 'Free', 
    instructor: instructor || '', 
    image: image || '', 
    lectures: [] 
  });
  
  res.json(newCourse);
});

// Add lecture to course (admin)
app.post('/api/admin/courses/:id/lectures', adminAuth, express.json(), async (req, res) => {
  const id = req.params.id;
  const { title, driveFileId, preview } = req.body || {};
  if (!title || !driveFileId) return res.status(400).json({ error: 'title and driveFileId required' });
  
  const lecture = { id: Date.now().toString(), title, driveFileId, preview: !!preview };
  
  const updatedCourse = await Course.findOneAndUpdate(
    { id },
    { $push: { lectures: lecture } },
    { new: true }
  );
  
  if (!updatedCourse) return res.status(404).json({ error: 'course not found' });
  
  res.json(lecture);
});

// Google Drive listing (service account)
app.get('/api/drive/list', adminAuth, async (req, res) => {
  const credPath = path.join(__dirname, 'drive-credentials.json');
  
  // Check if credentials file exists
  if (!fs.existsSync(credPath)) {
    console.log('⚠️  Google Drive credentials not found at:', credPath);
    console.log('📝 To connect your Google Drive:');
    console.log('   1. Follow the guide in GOOGLE_DRIVE_SETUP.md');
    console.log('   2. Place drive-credentials.json in the server folder');
    console.log('   3. Restart the server');
    console.log('');
    console.log('🔄 Returning mock data for now...');
    
    // Return mock data if credentials are missing
    return res.json({ 
      ok: true,
      mock: true,
      message: 'Using mock data. Follow GOOGLE_DRIVE_SETUP.md to connect your Google Drive.',
      files: [
        { id: '1', name: 'Intro to React.mp4', mimeType: 'video/mp4', webViewLink: '#', thumbnailLink: 'https://via.placeholder.com/150' },
        { id: '2', name: 'Advanced CSS.mp4', mimeType: 'video/mp4', webViewLink: '#', thumbnailLink: 'https://via.placeholder.com/150' },
        { id: '3', name: 'Node.js Basics.mp4', mimeType: 'video/mp4', webViewLink: '#', thumbnailLink: 'https://via.placeholder.com/150' },
        { id: '4', name: 'Firebase Setup.mp4', mimeType: 'video/mp4', webViewLink: '#', thumbnailLink: 'https://via.placeholder.com/150' },
        { id: '5', name: 'Deployment Guide.pdf', mimeType: 'application/pdf', webViewLink: '#', thumbnailLink: 'https://via.placeholder.com/150' },
      ] 
    });
  }

  try {
    console.log('✅ Google Drive credentials found, connecting...');
    const { google } = require('googleapis');
    const keyFile = credPath;
    const auth = new google.auth.GoogleAuth({ 
      keyFilename: keyFile, 
      scopes: ['https://www.googleapis.com/auth/drive.readonly'] 
    });
    const drive = google.drive({ version: 'v3', auth });

    // Query for files (videos, images, and documents)
    const q = req.query.q || "mimeType contains 'video/' or mimeType contains 'image/' or mimeType contains 'application/'";
    
    console.log('📂 Fetching files from Google Drive...');
    const resp = await drive.files.list({ 
      pageSize: 100, 
      q, 
      fields: 'files(id,name,mimeType,webViewLink,thumbnailLink,size,createdTime)',
      orderBy: 'createdTime desc'
    });
    
    const files = resp.data.files || [];
    console.log(`✅ Successfully fetched ${files.length} files from Google Drive`);
    
    if (files.length === 0) {
      console.log('⚠️  No files found. Make sure:');
      console.log('   1. You shared a folder with the service account email');
      console.log('   2. The folder contains video/image files');
      console.log('   3. Permissions have synced (wait a few minutes)');
    }
    
    res.json({ ok: true, files, mock: false });
  } catch (e) {
    console.error('❌ Google Drive error:', e.message || e);
    
    // Provide helpful error messages
    if (e.message.includes('invalid_grant')) {
      console.log('💡 Tip: The service account key might be invalid or expired');
      console.log('   Generate a new key from Google Cloud Console');
    } else if (e.message.includes('Permission denied')) {
      console.log('💡 Tip: Make sure you shared the folder with the service account email');
      console.log('   Check the client_email in drive-credentials.json');
    }
    
    res.status(500).json({ 
      ok: false, 
      message: 'Drive listing failed', 
      error: String(e.message || e),
      hint: 'Check server console for detailed error information'
    });
  }
});


// Course upload endpoint
app.post('/api/courses/upload', adminAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { courseType, ...courseData } = req.body;
    
    // Get uploaded file URLs
    const imageUrl = req.files['image'] ? `/uploads/courses/${req.files['image'][0].filename}` : null;
    const videoUrl = req.files['video'] ? `/uploads/videos/${req.files['video'][0].filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ ok: false, message: 'Image is required' });
    }

    // Create course object with all fields
    const newCourseData = {
      id: courseData.id,
      title: courseData.title,
      excerpt: courseData.excerpt,
      price: courseData.price,
      image: `http://localhost:${PORT}${imageUrl}`,
      rating: parseFloat(courseData.rating) || 4.5,
      ratingCount: courseData.ratingCount || "0 ratings",
      duration: courseData.duration || "2 Months",
      language: courseData.language || "Urdu / Hindi",
      createdAt: new Date().toISOString()
    };

    // Add badge if provided
    if (courseData.badge) {
      newCourseData.badge = { 
        label: courseData.badge, 
        color: courseType === 'online' ? 'bg-[#5022C3] text-white' : 'bg-[#0d9c06] text-white'
      };
    } else {
      newCourseData.badge = courseType === 'online' 
        ? { label: "Premium • Online", color: "bg-[#5022C3] text-white" }
        : { label: "Best One", color: "bg-[#0d9c06] text-white" };
    }

    let createdCourse;

    if (courseType === 'online') {
      newCourseData.videoUrl = videoUrl ? `http://localhost:${PORT}${videoUrl}` : null;
      if (!newCourseData.language.includes('Online')) {
        newCourseData.language += " (Online)";
      }
      createdCourse = await OnlineCourse.create(newCourseData);
    } else {
      if (!newCourseData.language.includes('On-site')) {
        newCourseData.language += " (On-site in Pakistan)";
      }
      createdCourse = await Course.create(newCourseData);
    }

    console.log(`✅ Course added successfully: ${createdCourse.title}`);
    console.log(`   Type: ${courseType}, ID: ${createdCourse.id}`);

    res.json({ 
      ok: true, 
      message: 'Course added successfully',
      course: createdCourse
    });
  } catch (error) {
    console.error('Course upload error:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Update course curriculum
app.post('/api/courses/curriculum', adminAuth, async (req, res) => {
  try {
    const { courseId, lectures } = req.body;
    
    if (!courseId || !lectures) {
      return res.status(400).json({ ok: false, message: 'Missing courseId or lectures' });
    }

    const updatedCourse = await OnlineCourse.findOneAndUpdate(
      { id: courseId },
      { lectures },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }

    res.json({ ok: true, message: 'Curriculum updated successfully', course: updatedCourse });
  } catch (error) {
    console.error('Error updating curriculum:', error);
    res.status(500).json({ ok: false, message: 'Failed to update curriculum' });
  }
});

// Delete onsite course
app.delete('/api/courses/onsite/:courseId', adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const deletedCourse = await Course.findOneAndDelete({ id: courseId });
    
    if (!deletedCourse) {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }
    
    res.json({ ok: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting onsite course:', error);
    res.status(500).json({ ok: false, message: 'Failed to delete course' });
  }
});

// Delete online course
app.delete('/api/courses/online/:courseId', adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const deletedCourse = await OnlineCourse.findOneAndDelete({ id: courseId });
    
    if (!deletedCourse) {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }
    
    res.json({ ok: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting online course:', error);
    res.status(500).json({ ok: false, message: 'Failed to delete course' });
  }
});

// Upload certificate template
app.post('/api/admin/certificates/upload', adminAuth, upload.single('certificate'), async (req, res) => {
  try {
    const { courseId } = req.body;
    const file = req.file;

    if (!courseId || !file) {
      return res.status(400).json({ ok: false, message: 'Missing courseId or certificate file' });
    }

    const certificateUrl = `/uploads/courses/${file.filename}`;
    const fullUrl = `http://localhost:${PORT}${certificateUrl}`;
    
    const updatedCourse = await OnlineCourse.findOneAndUpdate(
      { id: courseId },
      { certificateTemplate: fullUrl },
      { new: true }
    );

    if (!updatedCourse) {
      // Remove uploaded file if course not found
      fs.unlinkSync(file.path);
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }

    console.log(`✅ Certificate uploaded for course: ${updatedCourse.title}`);

    res.json({ 
      ok: true, 
      message: 'Certificate template uploaded successfully', 
      certificateUrl: fullUrl 
    });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({ ok: false, message: 'Failed to upload certificate' });
  }
});

// GET endpoint for onsite courses
app.get('/api/courses/onsite', async (req, res) => {
  try {
    const courses = await Course.find();
    console.log(`✅ Retrieved ${courses.length} onsite courses`);
    res.json({ ok: true, courses });
  } catch (error) {
    console.error('Error fetching onsite courses:', error);
    res.status(500).json({ ok: false, message: error.message, courses: [] });
  }
});

// GET endpoint for online courses
app.get('/api/courses/online', async (req, res) => {
  try {
    const courses = await OnlineCourse.find();
    console.log(`✅ Retrieved ${courses.length} online courses`);
    res.json({ ok: true, courses });
  } catch (error) {
    console.error('Error fetching online courses:', error);
    res.status(500).json({ ok: false, message: error.message, courses: [] });
  }
});

// Get single course with lectures (Generic handler must come AFTER specific routes)
app.get('/api/courses/:id', (req, res) => {
  const id = req.params.id;
  const all = readJSON(coursesFile);
  const course = all.find((c) => String(c.id) === String(id));
  if (!course) return res.status(404).json({ error: 'Not found' });
  res.json(course);
});

// Get single course by ID
app.get('/api/course/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check both files
    const onlineCoursesPath = path.join(__dirname, 'onlineCourses.json');
    const onsiteCoursesPath = path.join(__dirname, 'courses.json');
    
    let course = null;
    
    // Check online courses
    if (fs.existsSync(onlineCoursesPath)) {
      const onlineCourses = JSON.parse(fs.readFileSync(onlineCoursesPath, 'utf8'));
      course = onlineCourses.find(c => c.id === id);
    }
    
    // Check onsite courses if not found
    if (!course && fs.existsSync(onsiteCoursesPath)) {
      const onsiteCourses = JSON.parse(fs.readFileSync(onsiteCoursesPath, 'utf8'));
      course = onsiteCourses.find(c => c.id === id);
    }
    
    if (course) {
      res.json({ ok: true, course });
    } else {
      res.status(404).json({ ok: false, message: 'Course not found' });
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Delete course endpoint
app.delete('/api/courses/:type/:id', adminAuth, (req, res) => {
  try {
    const { type, id } = req.params;
    
    const jsonFilePath = type === 'online' 
      ? path.join(__dirname, 'onlineCourses.json')
      : path.join(__dirname, 'courses.json');

    if (!fs.existsSync(jsonFilePath)) {
      return res.status(404).json({ ok: false, message: 'Courses file not found' });
    }

    // Read existing courses
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    let coursesArray = JSON.parse(fileContent);
    
    // Filter out the course
    coursesArray = coursesArray.filter(c => c.id !== id);

    // Write back
    fs.writeFileSync(jsonFilePath, JSON.stringify(coursesArray, null, 2), 'utf8');

    res.json({ ok: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Course delete error:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// --- Contact Form Endpoints ---
const contactsFile = path.join(__dirname, 'contacts.json');

// Get all contact form submissions
app.get('/api/contacts', adminAuth, (req, res) => {
  try {
    if (!fs.existsSync(contactsFile)) {
      return res.json({ ok: true, contacts: [] });
    }
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8') || '[]');
    // Sort by date desc
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ ok: true, contacts });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create contact form submission (public endpoint)
app.post('/api/contacts', express.json(), (req, res) => {
  try {
    const { name, phone, course, message } = req.body;
    
    if (!name || !phone || !course || !message) {
      return res.status(400).json({ ok: false, message: 'All fields are required' });
    }

    const newContact = {
      id: Date.now(),
      name,
      phone,
      course,
      message,
      createdAt: new Date().toISOString()
    };

    let contacts = [];
    if (fs.existsSync(contactsFile)) {
      contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8') || '[]');
    }
    
    contacts.push(newContact);
    
    // Keep only last 1000 contacts to prevent file from growing too large
    if (contacts.length > 1000) {
      contacts = contacts.slice(-1000);
    }

    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));
    
    res.json({ ok: true, contact: newContact });
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Delete contact submission
app.delete('/api/contacts/:id', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    
    if (!fs.existsSync(contactsFile)) {
      return res.status(404).json({ ok: false, message: 'No contacts found' });
    }

    let contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8') || '[]');
    const initialLength = contacts.length;
    
    contacts = contacts.filter(c => c.id !== parseInt(id));
    
    if (contacts.length === initialLength) {
      return res.status(404).json({ ok: false, message: 'Contact not found' });
    }

    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));
    
    res.json({ ok: true, message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Student Dashboard Endpoints ---
const studentProgressFile = path.join(__dirname, 'student_progress.json');
const badgesFile = path.join(__dirname, 'badges.json');
const studentBadgesFile = path.join(__dirname, 'student_badges.json');

// Get student's enrolled courses
app.post('/api/student/courses', express.json(), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required' });
    }

    // Fetch orders from MongoDB
    console.log(`Fetching courses for student: ${email}`);
    const studentOrders = await Order.find({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } // Case-insensitive match
    });
    console.log(`Found ${studentOrders.length} orders for ${email}`);
    
    // Get unique course IDs
    const courseIds = [...new Set(studentOrders.map(order => order.courseId?.toString().trim()))].filter(Boolean);
    
    if (courseIds.length === 0) {
      return res.json({ ok: true, courses: [] });
    }
    
    // Fetch course details from MongoDB
    const [onlineCourses, onsiteCourses] = await Promise.all([
      OnlineCourse.find({ id: { $in: courseIds } }),
      Course.find({ id: { $in: courseIds } })
    ]);
    
    const allCourses = [...onlineCourses, ...onsiteCourses];

    // Get enrolled courses with progress
    const enrolledCoursesPromises = courseIds.map(async (courseId) => {
      const course = allCourses.find(c => String(c.id).trim() === String(courseId));
      if (!course) return null;

      // Get progress from MongoDB
      let progress = 0;
      const studentProgress = await StudentProgress.findOne({ email, courseId });
      
      if (studentProgress) {
        // Calculate progress percentage
        let totalLectures = 0;
        
        // Count total lectures (handle both flat and nested structure)
        if (course.lectures) {
          course.lectures.forEach(section => {
            if (section.lectures && Array.isArray(section.lectures)) {
              totalLectures += section.lectures.length;
            } else {
              totalLectures += 1;
            }
          });
        }
        
        const completedLectures = studentProgress.completedLectures?.length || 0;
        progress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
      }

      // Find order to get status
      const order = studentOrders.find(o => String(o.courseId).trim() === String(courseId));
      const status = order ? (order.status || 'Pending') : 'Pending';

      return {
        id: course.id,
        title: course.title,
        excerpt: course.excerpt,
        image: course.image,
        price: course.price,
        rating: course.rating,
        ratingCount: course.ratingCount,
        duration: course.duration,
        language: course.language,
        badge: course.badge,
        lectures: course.lectures,
        status,
        progress,
        hoursWatched: Math.floor(progress / 10), // Estimate hours based on progress
        certificateTemplate: course.certificateTemplate
      };
    });
    
    const enrolledCourses = (await Promise.all(enrolledCoursesPromises)).filter(Boolean);

    res.json({ ok: true, courses: enrolledCourses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Get student's progress for a specific course
app.post('/api/student/progress', express.json(), async (req, res) => {
  try {
    const { email, courseId } = req.body;
    
    if (!email || !courseId) {
      return res.status(400).json({ ok: false, message: 'Email and courseId are required' });
    }

    const progress = await StudentProgress.findOne({ email, courseId });
    
    // Convert array to map
    const progressMap = {};
    let completedCount = 0;
    if (progress && progress.completedLectures) {
      progress.completedLectures.forEach(lecId => {
        progressMap[lecId] = true;
      });
      completedCount = progress.completedLectures.length;
    }

    // Check for Certificate (Self-healing: Generate if missing but completed)
    let certificate = await Certificate.findOne({ email, courseId });

    if (!certificate) {
        // Double check completion status
        const course = await OnlineCourse.findOne({ id: courseId }) || await Course.findOne({ id: courseId });
        if (course) {
            let totalLectures = 0;
            if (course.lectures) {
                course.lectures.forEach(section => {
                    if (section.lectures) {
                        totalLectures += section.lectures.length;
                    } else {
                        totalLectures += 1;
                    }
                    // Include quizzes in count (Frontend logic alignment)
                    if (section.quiz && section.quiz.length > 0) {
                        totalLectures += 1;
                    }
                });
            }

            // If 100% complete (or close enough/completed count matches total)
            // Using >= totalLectures to be safe (if backend count logic aligns)
            const percentage = totalLectures > 0 ? (completedCount / totalLectures) * 100 : 0;
            
            if (percentage >= 100) {
                 // Use Student's Reference Number
                 const user = await User.findOne({ email });
                 const regNo = user ? user.referenceNumber : `SPARK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                 
                 certificate = await Certificate.create({
                    email,
                    courseId,
                    courseTitle: course.title,
                    regNo,
                    issueDate: new Date()
                 });
            }
        }
    }

    if (certificate) {
      // Sync Reg No with User Profile if mismatch (Fix for existing random certs)
      const user = await User.findOne({ email });
      if (user && user.referenceNumber && certificate.regNo !== user.referenceNumber) {
          certificate.regNo = user.referenceNumber;
          await certificate.save();
      }
      progressMap.certificate = certificate;
    }

    res.json({ ok: true, progress: progressMap });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Update student's lecture progress
app.post('/api/student/progress/update', express.json(), async (req, res) => {
  try {
    const { email, courseId, lectureId, completed } = req.body;
    
    if (!email || !courseId || !lectureId) {
      return res.status(400).json({ ok: false, message: 'Email, courseId, and lectureId are required' });
    }

    // Find or create progress record
    let progress = await StudentProgress.findOne({ email, courseId });
    
    if (!progress) {
      progress = new StudentProgress({ 
        email, 
        courseId, 
        uid: req.body.uid || 'unknown', // Ideally pass UID from frontend
        completedLectures: [] 
      });
    }

    // Update completed lectures list
    if (completed) {
      if (!progress.completedLectures.includes(lectureId)) {
        progress.completedLectures.push(lectureId);
      }
    } else {
      progress.completedLectures = progress.completedLectures.filter(id => id !== lectureId);
    }
    
    progress.lastWatched = new Date();
    await progress.save();

    // --- Check for Badges & Certificate ---
    let newBadges = [];
    let certificate = null;

    try {
      // 1. Calculate Course Progress
      const course = await OnlineCourse.findOne({ id: courseId }) || await Course.findOne({ id: courseId });
      
      if (course) {
        // Count total lectures
        let totalLectures = 0;
        if (course.lectures) {
            course.lectures.forEach(section => {
                if (section.lectures) {
                    totalLectures += section.lectures.length;
                } else {
                    totalLectures += 1;
                }
            });
        }

        const completedLecturesCount = progress.completedLectures.length;
        const percentage = totalLectures > 0 ? (completedLecturesCount / totalLectures) * 100 : 0;
        
        // Update percentage in DB
        progress.progressPercentage = percentage;
        await progress.save();

        // 2. Load Badges
        const badges = await Badge.find();

        // 3. Load Student Badges
        const studentBadges = await StudentBadge.find({ email });

        // 4. Check Criteria
        for (const badge of badges) {
          // Check if already awarded
          if (studentBadges.some(sb => sb.badgeId === badge.id)) continue;

          let awarded = false;
          if (badge.milestoneType === 'percentage' && badge.courseId === courseId) {
             if (percentage >= badge.milestoneValue) awarded = true;
          } else if (badge.milestoneType === 'percentage' && badge.courseId === 'all') {
             if (percentage >= badge.milestoneValue) awarded = true;
          }

          if (awarded) {
            const newStudentBadge = await StudentBadge.create({
              email,
              badgeId: badge.id,
              courseId: courseId,
              awardedAt: new Date()
            });
            newBadges.push(badge);
          }
        }

        // 5. Generate Certificate if 100% Complete
        if (percentage >= 100) {
          let existingCert = await Certificate.findOne({ email, courseId });

          if (!existingCert) {
            // Generate new certificate using User Reference Number
            const userDoc = await User.findOne({ email });
            const regNo = userDoc ? userDoc.referenceNumber : `SPARK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            
            certificate = await Certificate.create({
              email,
              courseId,
              courseTitle: course.title,
              regNo,
              issueDate: new Date()
            });
          } else {
            certificate = existingCert;
          }
        }
      }
    } catch (badgeError) {
      console.error('Error checking badges/certificate:', badgeError);
    }

    res.json({ ok: true, message: 'Progress updated successfully', newBadges, certificate });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Get student certificate
app.get('/api/student/certificate/:email/:courseId', async (req, res) => {
  try {
    const { email, courseId } = req.params;
    const certificate = await Certificate.findOne({ email, courseId });
    res.json({ ok: true, certificate });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// --- Badge Management Endpoints ---

// Get all badges
app.get('/api/admin/badges', adminAuth, async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json({ ok: true, badges });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create badge
app.post('/api/admin/badges', adminAuth, express.json(), async (req, res) => {
  try {
    const { name, icon, milestoneType, milestoneValue, courseId, description } = req.body;
    if (!name || !milestoneType || !milestoneValue) {
      return res.status(400).json({ ok: false, message: 'Missing required fields' });
    }

    const newBadge = await Badge.create({
      id: Date.now().toString(),
      name,
      icon,
      description: description || '',
      milestoneType,
      milestoneValue: parseInt(milestoneValue),
      courseId: courseId || 'all'
    });

    res.json({ ok: true, badge: newBadge });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Delete badge
app.delete('/api/admin/badges/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Badge.deleteOne({ id });
    res.json({ ok: true, message: 'Badge deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Get student badges
app.get('/api/student/badges/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const userBadges = await StudentBadge.find({ email });
    const allBadges = await Badge.find();
    
    const enrichedBadges = userBadges.map(ub => {
      const badgeDef = allBadges.find(b => b.id === ub.badgeId);
      return badgeDef ? { ...badgeDef.toObject(), ...ub.toObject() } : null;
    }).filter(Boolean);

    res.json({ ok: true, badges: enrichedBadges });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Activity Log Endpoints ---
// Get all activity logs
app.get('/api/admin/activity-logs', adminAuth, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ time: -1 }).limit(1000);
    res.json({ ok: true, logs });
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create activity log
app.post('/api/admin/activity-logs', adminAuth, express.json(), async (req, res) => {
  try {
    const { type, title, message, user } = req.body;
    
    const newLog = await ActivityLog.create({
      id: Date.now().toString(),
      type: type || 'info',
      title: title || 'System Activity',
      message: message || '',
      user: user || 'System',
      time: new Date()
    });
    
    res.json({ ok: true, log: newLog });
  } catch (err) {
    console.error('Error creating activity log:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Export for Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
