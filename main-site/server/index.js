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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

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
app.post('/api/auth/session', express.json(), (req, res) => {
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

// Get all users (Admin only)
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({ ok: false, message: 'Firebase Admin not initialized' });
    }

    const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
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

    res.json({ 
      ok: true, 
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
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



// Simple admin authentication (POST /api/admin/login { password })
app.post('/api/admin/login', express.json(), (req, res) => {
  const { password } = req.body || {};
  console.log('Admin login attempt received');
  if (!password) {
    console.log('Admin login failed: missing password');
    return res.status(400).json({ error: 'password required' });
  }
  if (password !== ADMIN_PASSWORD) {
    console.log('Admin login failed: invalid password');
    return res.status(401).json({ error: 'invalid password' });
  }
  // return a simple token (for demo only)
  const token = Buffer.from(password).toString('base64');
  console.log('Admin login success');
  res.json({ ok: true, token });
});

// Middleware to protect admin routes via header x-admin-token
function adminAuth(req, res, next) {
  const token = req.get('x-admin-token');
  if (!token) return res.status(401).json({ error: 'missing token' });
  const decoded = Buffer.from(token, 'base64').toString('utf8');
  if (decoded !== ADMIN_PASSWORD) return res.status(403).json({ error: 'forbidden' });
  next();
}

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

    // Read orders to find courses the student enrolled in
    const ordersFile = path.join(__dirname, 'orders.json');
    let orders = [];
    
    if (fs.existsSync(ordersFile)) {
      const raw = fs.readFileSync(ordersFile, 'utf8');
      orders = JSON.parse(raw || '[]');
    }

    // Filter orders by email (case-insensitive)
    console.log(`Fetching courses for student: ${email}`);
    const studentOrders = orders.filter(order => 
      order.email && order.email.toLowerCase() === email.toLowerCase()
    );
    console.log(`Found ${studentOrders.length} orders for ${email}`);
    
    // Get unique course IDs
    const courseIds = [...new Set(studentOrders.map(order => order.courseId?.toString().trim()))].filter(Boolean);
    
    // Fetch course details
    const onlineCoursesPath = path.join(__dirname, 'onlineCourses.json');
    const onsiteCoursesPath = path.join(__dirname, 'courses.json');
    
    let allCourses = [];
    
    if (fs.existsSync(onlineCoursesPath)) {
      const onlineCourses = JSON.parse(fs.readFileSync(onlineCoursesPath, 'utf8'));
      allCourses = allCourses.concat(onlineCourses);
    }
    
    if (fs.existsSync(onsiteCoursesPath)) {
      const onsiteCourses = JSON.parse(fs.readFileSync(onsiteCoursesPath, 'utf8'));
      allCourses = allCourses.concat(onsiteCourses);
    }

    // Get enrolled courses with progress
    const enrolledCourses = courseIds.map(courseId => {
      const course = allCourses.find(c => String(c.id).trim() === String(courseId));
      if (!course) return null;

      // Get progress for this course
      let progress = 0;
      if (fs.existsSync(studentProgressFile)) {
        const progressData = JSON.parse(fs.readFileSync(studentProgressFile, 'utf8') || '{}');
        const userProgress = progressData[email] || {};
        const courseProgress = userProgress[courseId] || {};
        
        // Calculate progress percentage
        const totalLectures = course.lectures?.length || 0;
        const completedLectures = Object.values(courseProgress).filter(Boolean).length;
        progress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
      }

      // Find order to get status
      const order = studentOrders.find(o => o.courseId === courseId);
      const status = order ? (order.status || 'Pending') : 'Pending';

      return {
        ...course,
        status,
        progress,
        hoursWatched: Math.floor(progress / 10) // Estimate hours based on progress
      };
    }).filter(Boolean);

    res.json({ ok: true, courses: enrolledCourses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Get student's progress for a specific course
app.post('/api/student/progress', express.json(), (req, res) => {
  try {
    const { email, courseId } = req.body;
    
    if (!email || !courseId) {
      return res.status(400).json({ ok: false, message: 'Email and courseId are required' });
    }

    let progressData = {};
    if (fs.existsSync(studentProgressFile)) {
      progressData = JSON.parse(fs.readFileSync(studentProgressFile, 'utf8') || '{}');
    }

    const userProgress = progressData[email] || {};
    const courseProgress = userProgress[courseId] || {};

    res.json({ ok: true, progress: courseProgress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Update student's lecture progress
app.post('/api/student/progress/update', express.json(), (req, res) => {
  try {
    const { email, courseId, lectureId, completed } = req.body;
    
    if (!email || !courseId || !lectureId) {
      return res.status(400).json({ ok: false, message: 'Email, courseId, and lectureId are required' });
    }

    let progressData = {};
    if (fs.existsSync(studentProgressFile)) {
      progressData = JSON.parse(fs.readFileSync(studentProgressFile, 'utf8') || '{}');
    }

    // Initialize user progress if not exists
    if (!progressData[email]) {
      progressData[email] = {};
    }

    // Initialize course progress if not exists
    if (!progressData[email][courseId]) {
      progressData[email][courseId] = {};
    }

    // Update lecture completion status
    progressData[email][courseId][lectureId] = completed;

    // Save to file
    fs.writeFileSync(studentProgressFile, JSON.stringify(progressData, null, 2));

    // --- Check for Badges & Certificate ---
    let newBadges = [];
    let certificate = null;

    try {
      // 1. Calculate Course Progress
      const onlineCoursesPath = path.join(__dirname, 'onlineCourses.json');
      const onsiteCoursesPath = path.join(__dirname, 'courses.json');
      let allCourses = [];
      if (fs.existsSync(onlineCoursesPath)) allCourses = allCourses.concat(JSON.parse(fs.readFileSync(onlineCoursesPath, 'utf8')));
      if (fs.existsSync(onsiteCoursesPath)) allCourses = allCourses.concat(JSON.parse(fs.readFileSync(onsiteCoursesPath, 'utf8')));
      
      const course = allCourses.find(c => String(c.id) === String(courseId));
      
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

        const courseProgress = progressData[email][courseId];
        const completedLecturesCount = Object.values(courseProgress).filter(Boolean).length;
        const percentage = totalLectures > 0 ? (completedLecturesCount / totalLectures) * 100 : 0;

        // 2. Load Badges
        let badges = [];
        if (fs.existsSync(badgesFile)) {
          badges = JSON.parse(fs.readFileSync(badgesFile, 'utf8') || '[]');
        }

        // 3. Load Student Badges
        let studentBadges = {};
        if (fs.existsSync(studentBadgesFile)) {
          studentBadges = JSON.parse(fs.readFileSync(studentBadgesFile, 'utf8') || '{}');
        }
        if (!studentBadges[email]) studentBadges[email] = [];

        // 4. Check Criteria
        badges.forEach(badge => {
          if (studentBadges[email].some(sb => sb.badgeId === badge.id)) return;

          let awarded = false;
          if (badge.milestoneType === 'percentage' && badge.courseId === courseId) {
             if (percentage >= badge.milestoneValue) awarded = true;
          } else if (badge.milestoneType === 'percentage' && badge.courseId === 'all') {
             if (percentage >= badge.milestoneValue) awarded = true;
          }

          if (awarded) {
            const awardedBadge = {
              badgeId: badge.id,
              awardedAt: new Date().toISOString(),
              courseId: courseId
            };
            studentBadges[email].push(awardedBadge);
            newBadges.push(badge);
          }
        });

        if (newBadges.length > 0) {
           fs.writeFileSync(studentBadgesFile, JSON.stringify(studentBadges, null, 2));
        }

        // 5. Generate Certificate if 100% Complete
        if (percentage === 100) {
          const certificatesFile = path.join(__dirname, 'student_certificates.json');
          let certificates = {};
          if (fs.existsSync(certificatesFile)) {
            certificates = JSON.parse(fs.readFileSync(certificatesFile, 'utf8') || '{}');
          }

          if (!certificates[email]) certificates[email] = {};

          if (!certificates[email][courseId]) {
            // Generate new certificate
            const regNo = `SPARK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            certificate = {
              regNo,
              issueDate: new Date().toISOString(),
              courseId,
              courseTitle: course.title
            };
            certificates[email][courseId] = certificate;
            fs.writeFileSync(certificatesFile, JSON.stringify(certificates, null, 2));
          } else {
            certificate = certificates[email][courseId];
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
app.get('/api/student/certificate/:email/:courseId', (req, res) => {
  try {
    const { email, courseId } = req.params;
    const certificatesFile = path.join(__dirname, 'student_certificates.json');
    
    if (!fs.existsSync(certificatesFile)) {
      return res.json({ ok: true, certificate: null });
    }

    const certificates = JSON.parse(fs.readFileSync(certificatesFile, 'utf8') || '{}');
    const userCerts = certificates[email] || {};
    const certificate = userCerts[courseId] || null;

    res.json({ ok: true, certificate });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// --- Badge Management Endpoints ---

// Get all badges
app.get('/api/admin/badges', adminAuth, (req, res) => {
  try {
    if (!fs.existsSync(badgesFile)) {
      return res.json({ ok: true, badges: [] });
    }
    const badges = JSON.parse(fs.readFileSync(badgesFile, 'utf8') || '[]');
    res.json({ ok: true, badges });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create badge
app.post('/api/admin/badges', adminAuth, express.json(), (req, res) => {
  try {
    const { name, icon, milestoneType, milestoneValue, courseId, description } = req.body;
    if (!name || !milestoneType || !milestoneValue) {
      return res.status(400).json({ ok: false, message: 'Missing required fields' });
    }

    const newBadge = {
      id: Date.now().toString(),
      name,
      icon, // URL or icon name
      description: description || '',
      milestoneType, // 'percentage'
      milestoneValue: parseInt(milestoneValue),
      courseId: courseId || 'all',
      createdAt: new Date().toISOString()
    };

    let badges = [];
    if (fs.existsSync(badgesFile)) {
      badges = JSON.parse(fs.readFileSync(badgesFile, 'utf8') || '[]');
    }
    badges.push(newBadge);
    fs.writeFileSync(badgesFile, JSON.stringify(badges, null, 2));

    res.json({ ok: true, badge: newBadge });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Delete badge
app.delete('/api/admin/badges/:id', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    if (!fs.existsSync(badgesFile)) return res.status(404).json({ ok: false, message: 'No badges found' });
    
    let badges = JSON.parse(fs.readFileSync(badgesFile, 'utf8') || '[]');
    badges = badges.filter(b => b.id !== id);
    fs.writeFileSync(badgesFile, JSON.stringify(badges, null, 2));
    
    res.json({ ok: true, message: 'Badge deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Get student badges
app.get('/api/student/badges/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!fs.existsSync(studentBadgesFile)) {
      return res.json({ ok: true, badges: [] });
    }
    
    const studentBadgesData = JSON.parse(fs.readFileSync(studentBadgesFile, 'utf8') || '{}');
    const userBadges = studentBadgesData[email] || [];
    
    // Enrich with badge details
    let allBadges = [];
    if (fs.existsSync(badgesFile)) {
      allBadges = JSON.parse(fs.readFileSync(badgesFile, 'utf8') || '[]');
    }
    
    const enrichedBadges = userBadges.map(ub => {
      const badgeDef = allBadges.find(b => b.id === ub.badgeId);
      return badgeDef ? { ...badgeDef, ...ub } : null;
    }).filter(Boolean);

    res.json({ ok: true, badges: enrichedBadges });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Activity Log Endpoints ---
const activityLogsFile = path.join(__dirname, 'activity_logs.json');

// Get all activity logs
app.get('/api/admin/activity-logs', adminAuth, (req, res) => {
  try {
    if (!fs.existsSync(activityLogsFile)) {
      return res.json({ ok: true, logs: [] });
    }
    const logs = JSON.parse(fs.readFileSync(activityLogsFile, 'utf8') || '[]');
    // Sort by time desc
    logs.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json({ ok: true, logs });
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create activity log
app.post('/api/admin/activity-logs', adminAuth, express.json(), (req, res) => {
  try {
    const { type, title, message, user } = req.body;
    
    const newLog = {
      id: Date.now(),
      type: type || 'info',
      title: title || 'System Activity',
      message: message || '',
      user: user || 'System',
      time: new Date().toISOString()
    };

    let logs = [];
    if (fs.existsSync(activityLogsFile)) {
      logs = JSON.parse(fs.readFileSync(activityLogsFile, 'utf8') || '[]');
    }
    
    logs.push(newLog);
    
    // Keep only last 1000 logs to prevent file from growing too large
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    fs.writeFileSync(activityLogsFile, JSON.stringify(logs, null, 2));
    
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
