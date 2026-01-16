console.log("🏁 Application process starting...");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

// Debugging: catch process level errors
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  // Keep running if possible, or exit with code 1
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
});

// Models
// Models
try {
  var Order = require("./models/Order");
  var Course = require("./models/Course");
  var OnlineCourse = require("./models/OnlineCourse");
  var StudentProgress = require("./models/StudentProgress");
  var Badge = require("./models/Badge");
  var StudentBadge = require("./models/StudentBadge");
  var Certificate = require("./models/Certificate");
  var ActivityLog = require("./models/ActivityLog");
  var User = require("./models/User");
  var AdminRole = require("./models/AdminRole");
  var Gallery = require("./models/Gallery");
  var Coupon = require("./models/Coupon");
  console.log("✅ Models loaded successfully");
} catch (e) {
  console.error("❌ Error loading models:", e);
}

// Role configuration
try {
  var {
    ROLES,
    PERMISSIONS,
    hasPermission,
    getRolePermissions,
    getRoleDisplayName,
    getRoleDescription,
  } = require("./config/roles");
  console.log("✅ Roles config loaded successfully");
} catch (e) {
  console.error("❌ Error loading roles config:", e);
}

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Connect to MongoDB with timeout and better error handling
// Mongoose Connection for Serverless (Vercel)
const MONGODB_URI = process.env.MONGODB_URI;

let isMongoDBConnected = false;
let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase() {
  if (cached.conn) {
    isMongoDBConnected = true;
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      isMongoDBConnected = true;
      console.log("✅ Vercel: New MongoDB Connection Established");
      return mongoose;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Ensure connection runs on every request
app.use(async (req, res, next) => {
  if (!isMongoDBConnected) {
    try {
      await connectToDatabase();
    } catch (e) {
      console.error("Database connection failed:", e);
    }
  }
  next();
});

// Export connection status checker
function checkMongoConnection(req, res, next) {
  if (!isMongoDBConnected) {
    return res.status(503).json({
      ok: false,
      message:
        "Database not connected. Please check server logs for setup instructions.",
      error: "MongoDB connection not established",
    });
  }
  next();
}

// Initialize Firebase Admin SDK
const admin = require("firebase-admin");
const serviceAccountPath = path.join(
  __dirname,
  "firebase-service-account.json"
);

// Only initialize if service account exists
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDK initialized");
} else {
  console.warn(
    "⚠️  Firebase service account not found. User management features will be limited."
  );
}

const app = express();

// Railway provides PORT env var - we MUST use it exactly as provided
const PORT = process.env.PORT || 3000;

console.log("🚀 Starting Server...");
console.log(`📌 Environment PORT: ${process.env.PORT}`);
console.log(`📌 Using PORT: ${PORT}`);

// Trust proxy is required when running behind a Load Balancer (Railway/Heroku/Vercel)
app.set("trust proxy", 1);

// Debug Middleware: Log every request hitting the server
app.use((req, res, next) => {
  console.log(`📨 REQUEST: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Enable CORS - PROPERLY configured for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://sparktrainings.vercel.app",
      "https://sparktrainings.com",
      "https://www.sparktrainings.com",
      "https://api.sparktrainings.com",
      "https://spark-lms-backend-production.up.railway.app",
    ];

    // Allow all Vercel preview deployments
    if (origin.includes(".vercel.app") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("⚠️ CORS blocked origin:", origin);
      callback(null, true); // ALLOW ANYWAY for debugging
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-admin-token",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // Cache preflight for 10 minutes
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// Root Route for Health Checks
app.get("/", (req, res) => {
  res.send("✅ Spark LMS Backend is Running!");
});

// Basic request logger to help debug network issues
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// Ensure upload directories exist
const uploadDir = path.join(__dirname, "uploads");
const coursesUploadDir = path.join(uploadDir, "courses");
const videosUploadDir = path.join(uploadDir, "videos");

try {
  [uploadDir, coursesUploadDir, videosUploadDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  console.log("✅ Upload directories verified/created");
} catch (err) {
  console.error(
    "⚠️ Warning: Could not create upload directories. File uploads may fail.",
    err.message
  );
}

// Serve uploaded files statically with cache headers
app.use(
  "/uploads",
  express.static(uploadDir, {
    maxAge: "7d", // Cache for 7 days
    etag: true,
    lastModified: true,
  })
);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest =
      file.fieldname === "video" ? videosUploadDir : coursesUploadDir;
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB for videos
});

// Simple health endpoint
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    ok: true,
    message: "Server is working!",
    timestamp: new Date().toISOString(),
  });
});

// Serve test page
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "test.html"));
});

// Orders endpoint with file upload
app.post("/api/orders", upload.single("screenshot"), async (req, res) => {
  try {
    // Multer will populate req.file and req.body
    const file = req.file;
    const body = req.body || {};

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No screenshot uploaded" });
    }

    // Basic validation
    if (!body.firstName || !body.email) {
      // remove uploaded file if validation fails
      fs.unlink(path.join(uploadDir, file.filename), () => {});
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const orderData = {
      uid: body.uid || null,
      firstName: body.firstName,
      lastName: body.lastName || "",
      city: body.city || "",
      phone: body.phone || "",
      email: body.email,
      notes: body.notes || "",
      courseId: body.courseId || "",
      courseTitle: body.courseTitle || "",
      items: body.items ? JSON.parse(body.items) : [],
      amount: body.amount || body.total || "",
      paymentScreenshot: `/uploads/courses/${file.filename}`,
      status: "Pending",
    };

    console.log("📝 Saving order to MongoDB:", { amount: orderData.amount });

    const newOrder = await Order.create(orderData);

    // Log new order activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: "order",
        title: "New Order Received",
        message: `${orderData.firstName} ${orderData.lastName} ordered ${orderData.courseTitle}`,
        user: orderData.email,
        time: new Date(),
      });
    } catch (e) {
      console.error("Failed to log order activity:", e);
    }

    return res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Upload error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error: " + err.message });
  }
});

// GET endpoint to fetch all orders
app.get("/api/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ ok: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch orders" });
  }
});

// Update order status (Admin only)
app.put(
  "/api/admin/orders/:id/status",
  adminAuth,
  express.json(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      res.json({
        ok: true,
        message: "Order status updated",
        order: updatedOrder,
      });
    } catch (err) {
      console.error("Error updating order status:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// --- Session Management ---
const sessionsFile = path.join(__dirname, "sessions.json");

// Create/Update Session
app.post("/api/auth/session", express.json(), async (req, res) => {
  try {
    const { uid, sessionId } = req.body;
    if (!uid || !sessionId) {
      return res
        .status(400)
        .json({ ok: false, message: "UID and SessionID required" });
    }

    let sessions = {};
    if (fs.existsSync(sessionsFile)) {
      sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8") || "{}");
    }

    sessions[uid] = {
      sessionId,
      lastActive: new Date().toISOString(),
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
        type: "login",
        title: "User Login",
        message: `User ${uid} logged in`,
        user: uid,
        time: new Date(),
      });
    } catch (e) {
      console.error("Failed to log user login:", e);
    }

    res.json({ ok: true, message: "Session updated" });
  } catch (err) {
    console.error("Session error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Verify Session
app.post("/api/auth/verify-session", express.json(), (req, res) => {
  try {
    const { uid, sessionId } = req.body;
    if (!uid || !sessionId) {
      return res
        .status(400)
        .json({ ok: false, message: "UID and SessionID required" });
    }

    if (!fs.existsSync(sessionsFile)) {
      // If no sessions file exists yet, we can't verify, so we force a logout to establish a session
      return res.json({
        ok: true,
        valid: false,
        message: "System reset, please login again",
      });
    }

    const sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8") || "{}");
    const userSession = sessions[uid];

    if (!userSession) {
      return res.json({
        ok: true,
        valid: false,
        message: "No active session found",
      });
    }

    if (userSession.sessionId !== sessionId) {
      return res.json({ ok: true, valid: false, message: "Session mismatch" });
    }

    res.json({ ok: true, valid: true });
  } catch (err) {
    console.error("Verify session error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Firebase User Management Endpoints ---

// Function to generate unique reference number
async function generateReferenceNumber() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referenceNumber;
  let isUnique = false;

  while (!isUnique) {
    // Generate format: UC-XXXX-XXXX-XXXX (similar to Udemy)
    const part1 = Array.from(
      { length: 4 },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");
    const part2 = Array.from(
      { length: 4 },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");
    const part3 = Array.from(
      { length: 4 },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");
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
app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res
        .status(503)
        .json({ ok: false, message: "Firebase Admin not initialized" });
    }

    const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users

    // Fetch reference numbers from MongoDB
    const userRecords = await User.find({});
    const referenceMap = {};
    userRecords.forEach((user) => {
      referenceMap[user.uid] = user.referenceNumber;
    });

    const users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      referenceNumber: referenceMap[user.uid] || null,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      },
      providerData: user.providerData,
    }));

    res.json({ ok: true, users });
  } catch (err) {
    console.error("Error listing users:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create new user (Admin only)
app.post(
  "/api/admin/users/create",
  adminAuth,
  express.json(),
  async (req, res) => {
    try {
      if (!admin.apps.length) {
        return res
          .status(503)
          .json({ ok: false, message: "Firebase Admin not initialized" });
      }

      const { email, password, displayName } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ ok: false, message: "Email and password are required" });
      }

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || undefined,
        emailVerified: false,
      });

      // Generate and store reference number
      const referenceNumber = await generateReferenceNumber();
      await User.create({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || "",
        referenceNumber,
      });

      res.json({
        ok: true,
        message: "User created successfully",
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          referenceNumber,
        },
      });
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// Store user reference number (called after Firebase registration)
app.post("/api/users/register", express.json(), async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;

    if (!uid || !email) {
      return res
        .status(400)
        .json({ ok: false, message: "UID and email are required" });
    }

    // Check if user already has a reference number
    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      return res.json({
        ok: true,
        message: "User already registered",
        referenceNumber: existingUser.referenceNumber,
      });
    }

    // Generate and store reference number
    const referenceNumber = await generateReferenceNumber();
    await User.create({
      uid,
      email,
      displayName: displayName || "",
      referenceNumber,
    });

    res.json({
      ok: true,
      message: "User registered successfully",
      referenceNumber,
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Send password reset email (Admin only)
app.post(
  "/api/admin/users/reset-password",
  adminAuth,
  express.json(),
  async (req, res) => {
    try {
      if (!admin.apps.length) {
        return res
          .status(503)
          .json({ ok: false, message: "Firebase Admin not initialized" });
      }

      const { email } = req.body;

      if (!email) {
        return res
          .status(400)
          .json({ ok: false, message: "Email is required" });
      }

      // Generate password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email);

      // In production, you would send this via email service
      // For now, we'll return it so admin can share it
      res.json({
        ok: true,
        message: `Password reset link generated for ${email}`,
        resetLink: resetLink,
      });
    } catch (err) {
      console.error("Error generating reset link:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// Send custom email (Admin only) - Mock implementation
app.post("/api/admin/send-email", adminAuth, express.json(), (req, res) => {
  try {
    const { email, subject, body } = req.body;

    if (!email || !subject || !body) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields" });
    }

    // Here you would integrate with SendGrid, Nodemailer, etc.
    console.log("📧 MOCK EMAIL SENDING:");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${body}`);
    console.log("------------------------");

    res.json({ ok: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Toggle user disabled status (Admin only)
app.post(
  "/api/admin/users/toggle-status",
  adminAuth,
  express.json(),
  async (req, res) => {
    try {
      if (!admin.apps.length) {
        return res
          .status(503)
          .json({ ok: false, message: "Firebase Admin not initialized" });
      }

      const { uid, disabled } = req.body;

      if (!uid) {
        return res
          .status(400)
          .json({ ok: false, message: "User UID is required" });
      }

      const userRecord = await admin.auth().updateUser(uid, {
        disabled: disabled,
      });

      res.json({
        ok: true,
        message: `User ${disabled ? "disabled" : "enabled"} successfully`,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          disabled: userRecord.disabled,
        },
      });
    } catch (err) {
      console.error("Error updating user status:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// Delete user (Admin only)
app.delete("/api/admin/users/:uid", adminAuth, async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res
        .status(503)
        .json({ ok: false, message: "Firebase Admin not initialized" });
    }

    const { uid } = req.params;

    if (!uid) {
      return res
        .status(400)
        .json({ ok: false, message: "User UID is required" });
    }

    await admin.auth().deleteUser(uid);

    res.json({
      ok: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Serve uploaded files statically
app.use("/upload", express.static(uploadDir));

// --- Courses & Lectures API (simple JSON storage)
const coursesFile = path.join(__dirname, "courses.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8") || "[]");
  } catch (e) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// List public courses
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (e) {
    console.error("Error fetching courses:", e);
    res.status(500).json([]);
  }
});

// Get onsite courses
app.get("/api/courses/onsite", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ ok: true, courses });
  } catch (e) {
    console.error("Error fetching onsite courses:", e);
    res
      .status(500)
      .json({
        ok: false,
        courses: [],
        message: "Failed to fetch onsite courses",
      });
  }
});

// Get online courses
app.get("/api/courses/online", async (req, res) => {
  try {
    const courses = await OnlineCourse.find().sort({ createdAt: -1 });
    res.json({ ok: true, courses });
  } catch (e) {
    console.error("Error fetching online courses:", e);
    res
      .status(500)
      .json({
        ok: false,
        courses: [],
        message: "Failed to fetch online courses",
      });
  }
});

// Simple admin authentication (POST /api/admin/login { password })
app.post("/api/admin/login", express.json(), async (req, res) => {
  const { password } = req.body || {};
  console.log("Admin login attempt received");
  console.log("Expected password:", ADMIN_PASSWORD);
  console.log("Received password:", password);
  if (!password) {
    console.log("Admin login failed: missing password");
    return res.status(400).json({ error: "password required" });
  }
  if (password !== ADMIN_PASSWORD) {
    console.log("Admin login failed: invalid password");
    console.log("Password match failed:", password, "!==", ADMIN_PASSWORD);
    return res.status(401).json({ error: "invalid password" });
  }

  // Log admin login
  try {
    await ActivityLog.create({
      id: Date.now().toString(),
      type: "login",
      title: "Admin Login",
      message: "Admin logged into the dashboard",
      user: "Admin",
      time: new Date(),
    });
  } catch (e) {
    console.error("Failed to log admin login:", e);
  }

  // return a simple token (for demo only)
  const token = Buffer.from(password).toString("base64");
  console.log("Admin login success");
  res.json({ ok: true, token, role: "super_admin", email: "admin" });
});

// Role-based admin login (for invited admins)
app.post("/api/admin/role-login", express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Email and password required" });
    }

    // Find admin role
    const adminRole = await AdminRole.findOne({
      email: email.toLowerCase(),
      status: "active",
    });

    if (!adminRole) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, adminRole.password);

    if (!isValid) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // Update last login
    adminRole.lastLogin = new Date();
    await adminRole.save();

    // Log login
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: "login",
        title: `${getRoleDisplayName(adminRole.role)} Login`,
        message: `${email} logged into the dashboard`,
        user: email,
        time: new Date(),
      });
    } catch (e) {
      console.error("Failed to log role login:", e);
    }

    // Create token with role info
    const tokenData = JSON.stringify({ email, role: adminRole.role });
    const token = Buffer.from(tokenData).toString("base64");

    res.json({
      ok: true,
      token,
      role: adminRole.role,
      email: adminRole.email,
      permissions: getRolePermissions(adminRole.role),
    });
  } catch (err) {
    console.error("Role login error:", err);
    res.status(500).json({ ok: false, error: "Login failed" });
  }
});

// Enhanced middleware to protect admin routes with role checking
async function adminAuth(req, res, next) {
  // Set CORS headers first, before any authentication checks
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-admin-token"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  const token = req.get("x-admin-token");
  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");

    // Check if it's super admin password
    if (decoded === ADMIN_PASSWORD) {
      req.adminRole = "super_admin";
      req.adminEmail = "admin";
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
          status: "active",
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

    return res.status(403).json({ error: "forbidden" });
  } catch (err) {
    return res.status(403).json({ error: "invalid token" });
  }
}

// Middleware to check specific permission
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.adminRole) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!hasPermission(req.adminRole, permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// --- Role Management Endpoints ---

// Get all admin roles (Super Admin only)
app.get(
  "/api/admin/roles",
  adminAuth,
  requirePermission(PERMISSIONS.VIEW_ROLES),
  async (req, res) => {
    try {
      const roles = await AdminRole.find()
        .select("-password")
        .sort({ invitedAt: -1 });

      const rolesWithDetails = roles.map((role) => ({
        _id: role._id,
        email: role.email,
        role: role.role,
        roleDisplay: getRoleDisplayName(role.role),
        roleDescription: getRoleDescription(role.role),
        invitedBy: role.invitedBy,
        invitedAt: role.invitedAt,
        status: role.status,
        lastLogin: role.lastLogin,
        permissions: getRolePermissions(role.role),
      }));

      res.json({ ok: true, roles: rolesWithDetails });
    } catch (err) {
      console.error("Error fetching roles:", err);
      res.status(500).json({ ok: false, message: "Failed to fetch roles" });
    }
  }
);

// Invite new admin (Super Admin only)
app.post(
  "/api/admin/roles/invite",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  express.json(),
  async (req, res) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        return res
          .status(400)
          .json({ ok: false, message: "Email and role are required" });
      }

      // Validate role
      const validRoles = Object.values(ROLES).filter(
        (r) => r !== ROLES.SUPER_ADMIN
      );
      if (!validRoles.includes(role)) {
        return res.status(400).json({ ok: false, message: "Invalid role" });
      }

      // Check if email already exists
      const existing = await AdminRole.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res
          .status(400)
          .json({ ok: false, message: "This email already has an admin role" });
      }

      // Generate invitation token
      const inviteToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create admin role
      const adminRole = await AdminRole.create({
        email: email.toLowerCase(),
        role,
        invitedBy: req.adminEmail,
        inviteToken,
        tokenExpiry,
        status: "pending",
      });

      // Generate invitation link
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const inviteLink = `${frontendUrl}/admin/accept-invite?token=${inviteToken}`;

      // Log activity
      try {
        await ActivityLog.create({
          id: Date.now().toString(),
          type: "admin",
          title: "Admin Role Invited",
          message: `${req.adminEmail} invited ${email} as ${getRoleDisplayName(
            role
          )}`,
          user: req.adminEmail,
          time: new Date(),
        });
      } catch (e) {
        console.error("Failed to log invitation:", e);
      }

      res.json({
        ok: true,
        message: "Invitation created successfully",
        inviteLink,
        email: adminRole.email,
        role: adminRole.role,
        roleDisplay: getRoleDisplayName(adminRole.role),
        expiresAt: tokenExpiry,
      });
    } catch (err) {
      console.error("Error creating invitation:", err);
      res
        .status(500)
        .json({ ok: false, message: "Failed to create invitation" });
    }
  }
);

// Accept invitation and set password
app.post("/api/admin/roles/accept-invite", express.json(), async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ ok: false, message: "Password must be at least 6 characters" });
    }

    // Find invitation
    const adminRole = await AdminRole.findOne({
      inviteToken: token,
      status: "pending",
    });

    if (!adminRole) {
      return res
        .status(404)
        .json({ ok: false, message: "Invalid or expired invitation" });
    }

    // Check if token expired
    if (adminRole.tokenExpiry < new Date()) {
      return res
        .status(400)
        .json({ ok: false, message: "Invitation has expired" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update admin role
    adminRole.password = hashedPassword;
    adminRole.status = "active";
    adminRole.inviteToken = undefined;
    adminRole.tokenExpiry = undefined;
    await adminRole.save();

    // Log activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: "admin",
        title: "Admin Role Activated",
        message: `${adminRole.email} activated their ${getRoleDisplayName(
          adminRole.role
        )} account`,
        user: adminRole.email,
        time: new Date(),
      });
    } catch (e) {
      console.error("Failed to log activation:", e);
    }

    res.json({
      ok: true,
      message: "Account activated successfully",
      email: adminRole.email,
      role: adminRole.role,
    });
  } catch (err) {
    console.error("Error accepting invitation:", err);
    res.status(500).json({ ok: false, message: "Failed to activate account" });
  }
});

// Verify invitation token
app.get("/api/admin/roles/verify-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const adminRole = await AdminRole.findOne({
      inviteToken: token,
      status: "pending",
    }).select("-password");

    if (!adminRole) {
      return res.status(404).json({ ok: false, message: "Invalid invitation" });
    }

    if (adminRole.tokenExpiry < new Date()) {
      return res
        .status(400)
        .json({ ok: false, message: "Invitation has expired" });
    }

    res.json({
      ok: true,
      email: adminRole.email,
      role: adminRole.role,
      roleDisplay: getRoleDisplayName(adminRole.role),
      roleDescription: getRoleDescription(adminRole.role),
      expiresAt: adminRole.tokenExpiry,
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(500).json({ ok: false, message: "Failed to verify token" });
  }
});

// Update admin role (Super Admin only)
app.put(
  "/api/admin/roles/:id",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  express.json(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ ok: false, message: "Role is required" });
      }

      // Validate role
      const validRoles = Object.values(ROLES).filter(
        (r) => r !== ROLES.SUPER_ADMIN
      );
      if (!validRoles.includes(role)) {
        return res.status(400).json({ ok: false, message: "Invalid role" });
      }

      const adminRole = await AdminRole.findById(id);

      if (!adminRole) {
        return res
          .status(404)
          .json({ ok: false, message: "Admin role not found" });
      }

      const oldRole = adminRole.role;
      adminRole.role = role;
      await adminRole.save();

      // Log activity
      try {
        await ActivityLog.create({
          id: Date.now().toString(),
          type: "admin",
          title: "Admin Role Updated",
          message: `${req.adminEmail} changed ${
            adminRole.email
          }'s role from ${getRoleDisplayName(oldRole)} to ${getRoleDisplayName(
            role
          )}`,
          user: req.adminEmail,
          time: new Date(),
        });
      } catch (e) {
        console.error("Failed to log role update:", e);
      }

      res.json({
        ok: true,
        message: "Role updated successfully",
        role: adminRole.role,
        roleDisplay: getRoleDisplayName(adminRole.role),
      });
    } catch (err) {
      console.error("Error updating role:", err);
      res.status(500).json({ ok: false, message: "Failed to update role" });
    }
  }
);

// Revoke admin access (Super Admin only)
app.delete(
  "/api/admin/roles/:id",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  async (req, res) => {
    try {
      const { id } = req.params;

      const adminRole = await AdminRole.findById(id);

      if (!adminRole) {
        return res
          .status(404)
          .json({ ok: false, message: "Admin role not found" });
      }

      adminRole.status = "revoked";
      await adminRole.save();

      // Log activity
      try {
        await ActivityLog.create({
          id: Date.now().toString(),
          type: "admin",
          title: "Admin Access Revoked",
          message: `${req.adminEmail} revoked ${
            adminRole.email
          }'s ${getRoleDisplayName(adminRole.role)} access`,
          user: req.adminEmail,
          time: new Date(),
        });
      } catch (e) {
        console.error("Failed to log revocation:", e);
      }

      res.json({
        ok: true,
        message: "Access revoked successfully",
      });
    } catch (err) {
      console.error("Error revoking access:", err);
      res.status(500).json({ ok: false, message: "Failed to revoke access" });
    }
  }
);

// Get available roles and their permissions (for UI)
app.get("/api/admin/roles/available", adminAuth, async (req, res) => {
  try {
    const availableRoles = Object.values(ROLES)
      .filter((role) => role !== ROLES.SUPER_ADMIN)
      .map((role) => ({
        value: role,
        label: getRoleDisplayName(role),
        description: getRoleDescription(role),
        permissions: getRolePermissions(role),
      }));

    res.json({ ok: true, roles: availableRoles });
  } catch (err) {
    console.error("Error fetching available roles:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to fetch available roles" });
  }
});

// Get admin profile
app.get("/api/admin/profile", adminAuth, async (req, res) => {
  try {
    const email = req.adminEmail;

    // Try to find in AdminRole collection first
    let profile = await AdminRole.findOne({ email }).select(
      "-password -inviteToken -tokenExpiry"
    );

    if (!profile) {
      // Return default profile for super admin
      return res.json({
        ok: true,
        profile: {
          email: email,
          name: "Sajid Ali",
          role: "super_admin",
          recoveryEmail: "",
          profilePicture: null,
        },
      });
    }

    res.json({
      ok: true,
      profile: {
        email: profile.email,
        name: profile.name || "Sajid Ali",
        role: profile.role,
        recoveryEmail: profile.recoveryEmail || "",
        profilePicture: profile.profilePicture || null,
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch profile" });
  }
});

// Update admin profile
app.put(
  "/api/admin/profile",
  adminAuth,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const email = req.adminEmail;
      const { name } = req.body;

      console.log("📝 Updating profile for:", email);
      console.log("📝 Name:", name);
      console.log("📝 File:", req.file ? req.file.filename : "No file");

      const updateData = {};
      if (name) updateData.name = name;

      // Handle recovery email
      const { recoveryEmail } = req.body;
      if (recoveryEmail !== undefined) updateData.recoveryEmail = recoveryEmail;

      // Handle profile picture upload
      if (req.file) {
        const profilePictureUrl = `/uploads/courses/${req.file.filename}`;
        updateData.profilePicture = `http://localhost:${PORT}${profilePictureUrl}`;
        console.log("📸 Profile picture URL:", updateData.profilePicture);
      }

      // Try to update in AdminRole collection
      let profile = await AdminRole.findOneAndUpdate(
        { email },
        { $set: updateData },
        { new: true, upsert: false }
      );

      // If not found in AdminRole (super admin), create a record
      if (!profile) {
        console.log(
          "⚠️  Profile not found, creating new record for super admin"
        );
        profile = await AdminRole.create({
          email: email,
          name: name || "Sajid Ali",
          role: "super_admin",
          status: "active",
          invitedBy: "system", // Required field for super admin
          profilePicture: updateData.profilePicture || null,
        });
        console.log("✅ Created new profile for super admin");
      } else {
        console.log("✅ Updated existing profile");
      }

      res.json({
        ok: true,
        message: "Profile updated successfully",
        profilePictureUrl: updateData.profilePicture || profile.profilePicture,
      });
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      console.error("Error details:", err.message);
      res
        .status(500)
        .json({
          ok: false,
          message: err.message || "Failed to update profile",
        });
    }
  }
);

// Change admin password
app.put(
  "/api/admin/change-password",
  adminAuth,
  express.json(),
  async (req, res) => {
    try {
      const email = req.adminEmail;
      const { currentPassword, newPassword } = req.body;

      console.log("🔐 Password change request for:", email);

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "Current and new password are required",
          });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "New password must be at least 6 characters",
          });
      }

      // Find admin profile
      const profile = await AdminRole.findOne({ email });

      if (!profile || !profile.password) {
        return res
          .status(400)
          .json({ ok: false, message: "No password set for this account" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, profile.password);

      if (!isMatch) {
        return res
          .status(401)
          .json({ ok: false, message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      profile.password = hashedPassword;
      await profile.save();

      console.log("✅ Password changed successfully for:", email);

      res.json({
        ok: true,
        message: "Password changed successfully",
      });
    } catch (err) {
      console.error("❌ Error changing password:", err);
      res
        .status(500)
        .json({
          ok: false,
          message: err.message || "Failed to change password",
        });
    }
  }
);

// Get all admin roles
app.get("/api/admin/roles", adminAuth, async (req, res) => {
  try {
    const roles = await AdminRole.find({})
      .select("-password -inviteToken")
      .sort({ invitedAt: -1 });

    const rolesWithDisplay = roles.map((role) => ({
      _id: role._id,
      email: role.email,
      name: role.name,
      role: role.role,
      roleDisplay: getRoleDisplayName(role.role),
      roleDescription: getRoleDescription(role.role),
      status: role.status,
      invitedBy: role.invitedBy,
      invitedAt: role.invitedAt,
      lastLogin: role.lastLogin,
    }));

    res.json({ ok: true, roles: rolesWithDisplay });
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch roles" });
  }
});

// Get available roles for invitation
app.get("/api/admin/roles/available", adminAuth, async (req, res) => {
  try {
    const availableRoles = [
      {
        value: "content_manager",
        label: "Content Manager",
        description: "Can manage courses, certificates, and badges",
      },
      {
        value: "instructor",
        label: "Instructor",
        description: "Can manage courses and view student progress",
      },
      {
        value: "support_staff",
        label: "Support Staff",
        description: "Can view users, contacts, and activity logs",
      },
      {
        value: "finance_manager",
        label: "Finance Manager",
        description: "Can manage orders and view financial data",
      },
    ];

    res.json({ ok: true, roles: availableRoles });
  } catch (err) {
    console.error("Error fetching available roles:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to fetch available roles" });
  }
});

// Create invitation
app.post(
  "/api/admin/roles/invite",
  adminAuth,
  express.json(),
  async (req, res) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        return res
          .status(400)
          .json({ ok: false, message: "Email and role are required" });
      }

      // Check if email already exists
      const existing = await AdminRole.findOne({ email });
      if (existing) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "This email is already invited or active",
          });
      }

      // Generate invitation token
      const inviteToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create admin role
      const adminRole = await AdminRole.create({
        email,
        role,
        invitedBy: req.adminEmail,
        status: "pending",
        inviteToken,
        tokenExpiry,
      });

      // Generate invitation link (pointing to frontend)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const inviteLink = `${frontendUrl}/admin/accept-invite?token=${inviteToken}`;
      console.log("🔗 Generated invitation link:", inviteLink);

      // Log activity
      try {
        await ActivityLog.create({
          id: Date.now().toString(),
          type: "admin",
          title: "Admin Role Invited",
          message: `${req.adminEmail} invited ${email} as ${getRoleDisplayName(
            role
          )}`,
          user: req.adminEmail,
          time: new Date(),
        });
      } catch (e) {
        console.error("Failed to log invitation:", e);
      }

      res.json({
        ok: true,
        message: "Invitation created successfully",
        inviteLink,
        email: adminRole.email,
        role: adminRole.role,
        roleDisplay: getRoleDisplayName(adminRole.role),
        expiresAt: tokenExpiry,
      });
    } catch (err) {
      console.error("Error creating invitation:", err);
      res
        .status(500)
        .json({ ok: false, message: "Failed to create invitation" });
    }
  }
);

// Revoke admin role
app.delete("/api/admin/roles/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const role = await AdminRole.findById(id);

    if (!role) {
      return res.status(404).json({ ok: false, message: "Role not found" });
    }

    // Update status to revoked
    role.status = "revoked";
    await role.save();

    // Log activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: "admin",
        title: "Admin Access Revoked",
        message: `${req.adminEmail} revoked access for ${role.email}`,
        user: req.adminEmail,
        time: new Date(),
      });
    } catch (e) {
      console.error("Failed to log revocation:", e);
    }

    res.json({ ok: true, message: "Access revoked successfully" });
  } catch (err) {
    console.error("Error revoking role:", err);
    res.status(500).json({ ok: false, message: "Failed to revoke access" });
  }
});

// Verify invitation token
app.get("/api/admin/roles/verify-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const role = await AdminRole.findOne({
      inviteToken: token,
      status: "pending",
    });

    if (!role) {
      return res
        .status(404)
        .json({ ok: false, message: "Invalid or expired invitation" });
    }

    // Check if token is expired
    if (role.tokenExpiry && new Date() > role.tokenExpiry) {
      return res
        .status(400)
        .json({ ok: false, message: "Invitation has expired" });
    }

    res.json({
      ok: true,
      email: role.email,
      role: role.role,
      roleDisplay: getRoleDisplayName(role.role),
      roleDescription: getRoleDescription(role.role),
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(500).json({ ok: false, message: "Failed to verify invitation" });
  }
});

// Accept invitation and set password
app.post("/api/admin/roles/accept-invite", express.json(), async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ ok: false, message: "Password must be at least 6 characters" });
    }

    // Find invitation
    const adminRole = await AdminRole.findOne({
      inviteToken: token,
      status: "pending",
    });

    if (!adminRole) {
      return res
        .status(404)
        .json({ ok: false, message: "Invalid or expired invitation" });
    }

    // Check if token is expired
    if (adminRole.tokenExpiry && new Date() > adminRole.tokenExpiry) {
      return res
        .status(400)
        .json({ ok: false, message: "Invitation has expired" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update admin role
    adminRole.password = hashedPassword;
    adminRole.status = "active";
    adminRole.inviteToken = undefined;
    adminRole.tokenExpiry = undefined;
    await adminRole.save();

    // Log activity
    try {
      await ActivityLog.create({
        id: Date.now().toString(),
        type: "admin",
        title: "Admin Account Activated",
        message: `${adminRole.email} activated their ${getRoleDisplayName(
          adminRole.role
        )} account`,
        user: adminRole.email,
        time: new Date(),
      });
    } catch (e) {
      console.error("Failed to log activation:", e);
    }

    res.json({
      ok: true,
      message: "Account activated successfully",
      email: adminRole.email,
    });
  } catch (err) {
    console.error("Error accepting invitation:", err);
    res.status(500).json({ ok: false, message: "Failed to activate account" });
  }
});

// Create course (admin)
app.post("/api/admin/courses", adminAuth, express.json(), async (req, res) => {
  const { title, excerpt, price, instructor, image, id } = req.body || {};
  if (!title || !id)
    return res.status(400).json({ error: "title and id required" });

  const exists = await Course.findOne({ id });
  if (exists) return res.status(400).json({ error: "course id exists" });

  const newCourse = await Course.create({
    id,
    title,
    excerpt: excerpt || "",
    price: price || "Free",
    instructor: instructor || "",
    image: image || "",
    lectures: [],
  });

  res.json(newCourse);
});

// Add lecture to course (admin)
app.post(
  "/api/admin/courses/:id/lectures",
  adminAuth,
  express.json(),
  async (req, res) => {
    const id = req.params.id;
    const { title, driveFileId, preview } = req.body || {};
    if (!title || !driveFileId)
      return res.status(400).json({ error: "title and driveFileId required" });

    const lecture = {
      id: Date.now().toString(),
      title,
      driveFileId,
      preview: !!preview,
    };

    const updatedCourse = await Course.findOneAndUpdate(
      { id },
      { $push: { lectures: lecture } },
      { new: true }
    );

    if (!updatedCourse)
      return res.status(404).json({ error: "course not found" });

    res.json(lecture);
  }
);

// Google Drive listing (service account)
app.get("/api/drive/list", adminAuth, async (req, res) => {
  const credPath = path.join(__dirname, "drive-credentials.json");

  // Check if credentials file exists
  if (!fs.existsSync(credPath)) {
    console.log("⚠️  Google Drive credentials not found at:", credPath);
    console.log("📝 To connect your Google Drive:");
    console.log("   1. Follow the guide in GOOGLE_DRIVE_SETUP.md");
    console.log("   2. Place drive-credentials.json in the server folder");
    console.log("   3. Restart the server");
    console.log("");
    console.log("🔄 Returning mock data for now...");

    // Return mock data if credentials are missing
    return res.json({
      ok: true,
      mock: true,
      message:
        "Using mock data. Follow GOOGLE_DRIVE_SETUP.md to connect your Google Drive.",
      files: [
        {
          id: "1",
          name: "Intro to React.mp4",
          mimeType: "video/mp4",
          webViewLink: "#",
          thumbnailLink: "https://via.placeholder.com/150",
        },
        {
          id: "2",
          name: "Advanced CSS.mp4",
          mimeType: "video/mp4",
          webViewLink: "#",
          thumbnailLink: "https://via.placeholder.com/150",
        },
        {
          id: "3",
          name: "Node.js Basics.mp4",
          mimeType: "video/mp4",
          webViewLink: "#",
          thumbnailLink: "https://via.placeholder.com/150",
        },
        {
          id: "4",
          name: "Firebase Setup.mp4",
          mimeType: "video/mp4",
          webViewLink: "#",
          thumbnailLink: "https://via.placeholder.com/150",
        },
        {
          id: "5",
          name: "Deployment Guide.pdf",
          mimeType: "application/pdf",
          webViewLink: "#",
          thumbnailLink: "https://via.placeholder.com/150",
        },
      ],
    });
  }

  try {
    console.log("✅ Google Drive credentials found, connecting...");
    const { google } = require("googleapis");
    const keyFile = credPath;
    const auth = new google.auth.GoogleAuth({
      keyFilename: keyFile,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    // Query for files (videos, images, and documents)
    const q =
      req.query.q ||
      "mimeType contains 'video/' or mimeType contains 'image/' or mimeType contains 'application/'";

    console.log("📂 Fetching files from Google Drive...");
    const resp = await drive.files.list({
      pageSize: 100,
      q,
      fields:
        "files(id,name,mimeType,webViewLink,thumbnailLink,size,createdTime)",
      orderBy: "createdTime desc",
    });

    const files = resp.data.files || [];
    console.log(
      `✅ Successfully fetched ${files.length} files from Google Drive`
    );

    if (files.length === 0) {
      console.log("⚠️  No files found. Make sure:");
      console.log("   1. You shared a folder with the service account email");
      console.log("   2. The folder contains video/image files");
      console.log("   3. Permissions have synced (wait a few minutes)");
    }

    res.json({ ok: true, files, mock: false });
  } catch (e) {
    console.error("❌ Google Drive error:", e.message || e);

    // Provide helpful error messages
    if (e.message.includes("invalid_grant")) {
      console.log(
        "💡 Tip: The service account key might be invalid or expired"
      );
      console.log("   Generate a new key from Google Cloud Console");
    } else if (e.message.includes("Permission denied")) {
      console.log(
        "💡 Tip: Make sure you shared the folder with the service account email"
      );
      console.log("   Check the client_email in drive-credentials.json");
    }

    res.status(500).json({
      ok: false,
      message: "Drive listing failed",
      error: String(e.message || e),
      hint: "Check server console for detailed error information",
    });
  }
});

// Course upload endpoint
app.post(
  "/api/courses/upload",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { courseType, ...courseData } = req.body;

      // Get uploaded file URLs
      const imageUrl = req.files["image"]
        ? `/uploads/courses/${req.files["image"][0].filename}`
        : null;
      const videoUrl = req.files["video"]
        ? `/uploads/videos/${req.files["video"][0].filename}`
        : null;

      if (!imageUrl) {
        return res
          .status(400)
          .json({ ok: false, message: "Image is required" });
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
        createdAt: new Date().toISOString(),
      };

      // Add badge if provided
      if (courseData.badge) {
        newCourseData.badge = {
          label: courseData.badge,
          color:
            courseType === "online"
              ? "bg-[#5022C3] text-white"
              : "bg-[#0d9c06] text-white",
        };
      } else {
        newCourseData.badge =
          courseType === "online"
            ? { label: "Premium • Online", color: "bg-[#5022C3] text-white" }
            : { label: "Best One", color: "bg-[#0d9c06] text-white" };
      }

      // Add array fields if provided (parse JSON strings)
      if (courseData.whatYouWillLearn) {
        try {
          newCourseData.whatYouWillLearn = JSON.parse(
            courseData.whatYouWillLearn
          );
        } catch (e) {
          newCourseData.whatYouWillLearn = [];
        }
      }

      if (courseData.includes) {
        try {
          newCourseData.includes = JSON.parse(courseData.includes);
        } catch (e) {
          newCourseData.includes = [];
        }
      }

      if (courseData.fullDescription) {
        try {
          newCourseData.fullDescription = JSON.parse(
            courseData.fullDescription
          );
        } catch (e) {
          newCourseData.fullDescription = [];
        }
      }

      let createdCourse;

      if (courseType === "online") {
        newCourseData.videoUrl = videoUrl
          ? `http://localhost:${PORT}${videoUrl}`
          : null;
        if (!newCourseData.language.includes("Online")) {
          newCourseData.language += " (Online)";
        }
        createdCourse = await OnlineCourse.create(newCourseData);
      } else {
        if (!newCourseData.language.includes("On-site")) {
          newCourseData.language += " (On-site in Pakistan)";
        }
        createdCourse = await Course.create(newCourseData);
      }

      console.log(`✅ Course added successfully: ${createdCourse.title}`);
      console.log(`   Type: ${courseType}, ID: ${createdCourse.id}`);

      res.json({
        ok: true,
        message: "Course added successfully",
        course: createdCourse,
      });
    } catch (error) {
      console.error("Course upload error:", error);
      res.status(500).json({ ok: false, message: error.message });
    }
  }
);

// Update existing course endpoint
app.put(
  "/api/courses/update/:courseType/:courseId",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { courseType, courseId } = req.params;
      const courseData = req.body;

      // Get uploaded file URLs if new files were uploaded
      let imageUrl = null;
      let videoUrl = null;

      if (req.files && req.files["image"]) {
        imageUrl = `http://localhost:${PORT}/uploads/courses/${req.files["image"][0].filename}`;
      } else if (courseData.imageUrl) {
        // Use imported URL from resources
        imageUrl = courseData.imageUrl;
      } else if (courseData.existingImageUrl) {
        // Keep existing image
        imageUrl = courseData.existingImageUrl;
      }

      if (req.files && req.files["video"]) {
        videoUrl = `http://localhost:${PORT}/uploads/videos/${req.files["video"][0].filename}`;
      }

      // Create update object with all fields
      const updateData = {
        title: courseData.title,
        excerpt: courseData.excerpt,
        price: courseData.price,
        rating: parseFloat(courseData.rating) || 4.5,
        ratingCount: courseData.ratingCount || "0 ratings",
        duration: courseData.duration || "2 Months",
        language: courseData.language || "Urdu / Hindi",
      };

      // Update image if provided
      if (imageUrl) {
        updateData.image = imageUrl;
      }

      // Add badge if provided
      if (courseData.badge) {
        updateData.badge = {
          label: courseData.badge,
          color:
            courseType === "online"
              ? "bg-[#5022C3] text-white"
              : "bg-[#0d9c06] text-white",
        };
      }

      // Add array fields if provided (parse JSON strings)
      if (courseData.whatYouWillLearn) {
        try {
          updateData.whatYouWillLearn = JSON.parse(courseData.whatYouWillLearn);
        } catch (e) {
          updateData.whatYouWillLearn = [];
        }
      }

      if (courseData.includes) {
        try {
          updateData.includes = JSON.parse(courseData.includes);
        } catch (e) {
          updateData.includes = [];
        }
      }

      if (courseData.fullDescription) {
        try {
          updateData.fullDescription = JSON.parse(courseData.fullDescription);
        } catch (e) {
          updateData.fullDescription = [];
        }
      }

      let updatedCourse;

      // Update video URL for online courses
      if (courseType === "online" && videoUrl) {
        updateData.videoUrl = videoUrl;
      }

      // Update the appropriate collection
      if (courseType === "online") {
        updatedCourse = await OnlineCourse.findOneAndUpdate(
          { id: courseId },
          { $set: updateData },
          { new: true }
        );
      } else {
        updatedCourse = await Course.findOneAndUpdate(
          { id: courseId },
          { $set: updateData },
          { new: true }
        );
      }

      if (!updatedCourse) {
        return res.status(404).json({ ok: false, message: "Course not found" });
      }

      console.log(`✅ Course updated successfully: ${updatedCourse.title}`);
      console.log(`   Type: ${courseType}, ID: ${updatedCourse.id}`);

      res.json({
        ok: true,
        message: "Course updated successfully",
        course: updatedCourse,
      });
    } catch (error) {
      console.error("Course update error:", error);
      res.status(500).json({ ok: false, message: error.message });
    }
  }
);

// Update course curriculum
app.post("/api/courses/curriculum", adminAuth, async (req, res) => {
  try {
    const { courseId, lectures } = req.body;

    if (!courseId || !lectures) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing courseId or lectures" });
    }

    const updatedCourse = await OnlineCourse.findOneAndUpdate(
      { id: courseId },
      { lectures },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ ok: false, message: "Course not found" });
    }

    res.json({
      ok: true,
      message: "Curriculum updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating curriculum:", error);
    res.status(500).json({ ok: false, message: "Failed to update curriculum" });
  }
});

// Handle preflight for onsite course deletion
app.options("/api/courses/onsite/:courseId", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-admin-token"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Delete onsite course
app.delete(
  "/api/courses/onsite/:courseId",
  (req, res, next) => {
    // Set CORS headers first
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-admin-token"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  },
  adminAuth,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      console.log(`🗑️  Attempting to delete onsite course: ${courseId}`);

      const deletedCourse = await Course.findOneAndDelete({ id: courseId });

      if (!deletedCourse) {
        console.log(`❌ Onsite course not found: ${courseId}`);
        return res.status(404).json({ ok: false, message: "Course not found" });
      }

      console.log(
        `✅ Successfully deleted onsite course: ${deletedCourse.title}`
      );
      res.json({ ok: true, message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting onsite course:", error);
      res.status(500).json({ ok: false, message: "Failed to delete course" });
    }
  }
);

// Handle preflight for online course deletion
app.options("/api/courses/online/:courseId", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-admin-token"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Delete online course
app.delete(
  "/api/courses/online/:courseId",
  (req, res, next) => {
    // Set CORS headers first
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-admin-token"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  },
  adminAuth,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      console.log(`🗑️  Attempting to delete online course: ${courseId}`);

      const deletedCourse = await OnlineCourse.findOneAndDelete({
        id: courseId,
      });

      if (!deletedCourse) {
        console.log(`❌ Online course not found: ${courseId}`);
        return res.status(404).json({ ok: false, message: "Course not found" });
      }

      console.log(
        `✅ Successfully deleted online course: ${deletedCourse.title}`
      );
      res.json({ ok: true, message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting online course:", error);
      res.status(500).json({ ok: false, message: "Failed to delete course" });
    }
  }
);

// Upload certificate template
app.post(
  "/api/admin/certificates/upload",
  adminAuth,
  upload.single("certificate"),
  async (req, res) => {
    try {
      const { courseId } = req.body;
      const file = req.file;

      if (!courseId || !file) {
        return res
          .status(400)
          .json({ ok: false, message: "Missing courseId or certificate file" });
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
        return res.status(404).json({ ok: false, message: "Course not found" });
      }

      console.log(`✅ Certificate uploaded for course: ${updatedCourse.title}`);

      res.json({
        ok: true,
        message: "Certificate template uploaded successfully",
        certificateUrl: fullUrl,
      });
    } catch (error) {
      console.error("Error uploading certificate:", error);
      res
        .status(500)
        .json({ ok: false, message: "Failed to upload certificate" });
    }
  }
);

// GET endpoint for onsite courses
app.get("/api/courses/onsite", async (req, res) => {
  try {
    const courses = await Course.find();
    console.log(`✅ Retrieved ${courses.length} onsite courses`);
    res.json({ ok: true, courses });
  } catch (error) {
    console.error("Error fetching onsite courses:", error);
    res.status(500).json({ ok: false, message: error.message, courses: [] });
  }
});

// GET endpoint for online courses
app.get("/api/courses/online", async (req, res) => {
  try {
    const courses = await OnlineCourse.find();
    console.log(`✅ Retrieved ${courses.length} online courses`);
    res.json({ ok: true, courses });
  } catch (error) {
    console.error("Error fetching online courses:", error);
    res.status(500).json({ ok: false, message: error.message, courses: [] });
  }
});

// Get single course (onsite or online) by ID or slug
app.get("/api/course/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching single course: ${id}`);

    // Try to find in OnlineCourse first
    let course = await OnlineCourse.findOne({
      $or: [{ id: id }, { slug: id }],
    });

    if (!course) {
      // If not found in OnlineCourse, try Course (onsite)
      course = await Course.findOne({
        $or: [{ id: id }, { slug: id }],
      });
    }

    if (course) {
      res.json({ ok: true, course });
    } else {
      res.status(404).json({ ok: false, message: "Course not found" });
    }
  } catch (error) {
    console.error("Error fetching single course:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Alias for /api/course/:id
app.get("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let course = await OnlineCourse.findOne({
      $or: [{ id: id }, { slug: id }],
    });

    if (!course) {
      course = await Course.findOne({
        $or: [{ id: id }, { slug: id }],
      });
    }

    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete course endpoint
app.delete("/api/courses/:type/:id", adminAuth, (req, res) => {
  try {
    const { type, id } = req.params;

    const jsonFilePath =
      type === "online"
        ? path.join(__dirname, "onlineCourses.json")
        : path.join(__dirname, "courses.json");

    if (!fs.existsSync(jsonFilePath)) {
      return res
        .status(404)
        .json({ ok: false, message: "Courses file not found" });
    }

    // Read existing courses
    const fileContent = fs.readFileSync(jsonFilePath, "utf8");
    let coursesArray = JSON.parse(fileContent);

    // Filter out the course
    coursesArray = coursesArray.filter((c) => c.id !== id);

    // Write back
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(coursesArray, null, 2),
      "utf8"
    );

    res.json({ ok: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Course delete error:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// --- Coupon Management ---
app.get(
  "/api/admin/coupons",
  adminAuth,
  requirePermission(PERMISSIONS.VIEW_COUPONS),
  async (req, res) => {
    try {
      console.log("GET /api/admin/coupons - Request received");
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      console.log(`GET /api/admin/coupons - Found ${coupons.length} coupons`);
      res.json({ ok: true, coupons });
    } catch (err) {
      console.error("GET /api/admin/coupons - Error:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

app.post(
  "/api/admin/coupons",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_COUPONS),
  express.json(),
  async (req, res) => {
    try {
      console.log("POST /api/admin/coupons - Body:", req.body);
      const couponData = { ...req.body };

      // Sanitize numeric and date fields
      if (couponData.value === "") delete couponData.value;
      else couponData.value = Number(couponData.value);

      if (couponData.expiryDate === "" || !couponData.expiryDate) {
        delete couponData.expiryDate;
      }

      const coupon = await Coupon.create(couponData);
      console.log("POST /api/admin/coupons - Created:", coupon.code);
      res.json({ ok: true, coupon });
    } catch (err) {
      console.error("POST /api/admin/coupons - Error:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

app.put(
  "/api/admin/coupons/:id",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_COUPONS),
  express.json(),
  async (req, res) => {
    try {
      console.log(
        "PUT /api/admin/coupons - ID:",
        req.params.id,
        "Body:",
        req.body
      );
      const couponData = { ...req.body };

      // Sanitize
      if (couponData.value !== undefined)
        couponData.value = Number(couponData.value);
      if (couponData.expiryDate === "" || !couponData.expiryDate) {
        couponData.expiryDate = null;
      }

      const coupon = await Coupon.findByIdAndUpdate(req.params.id, couponData, {
        new: true,
      });
      res.json({ ok: true, coupon });
    } catch (err) {
      console.error("PUT /api/admin/coupons - Error:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

app.delete(
  "/api/admin/coupons/:id",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_COUPONS),
  async (req, res) => {
    try {
      await Coupon.findByIdAndDelete(req.params.id);
      res.json({ ok: true, message: "Coupon deleted" });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// Public validation endpoint for Cart
app.get("/api/coupons/validate/:code", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
      return res
        .status(404)
        .json({ ok: false, message: "Invalid or inactive coupon" });
    }

    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ ok: false, message: "Coupon has expired" });
    }

    res.json({ ok: true, coupon });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Contact Form Endpoints ---
const contactsFile = path.join(__dirname, "contacts.json");

// Get all contact form submissions
app.get("/api/contacts", adminAuth, (req, res) => {
  try {
    if (!fs.existsSync(contactsFile)) {
      return res.json({ ok: true, contacts: [] });
    }
    const contacts = JSON.parse(fs.readFileSync(contactsFile, "utf8") || "[]");
    // Sort by date desc
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ ok: true, contacts });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create contact form submission (public endpoint)
app.post("/api/contacts", express.json(), (req, res) => {
  try {
    const { name, phone, course, message } = req.body;

    if (!name || !phone || !course || !message) {
      return res
        .status(400)
        .json({ ok: false, message: "All fields are required" });
    }

    const newContact = {
      id: Date.now(),
      name,
      phone,
      course,
      message,
      createdAt: new Date().toISOString(),
    };

    let contacts = [];
    if (fs.existsSync(contactsFile)) {
      contacts = JSON.parse(fs.readFileSync(contactsFile, "utf8") || "[]");
    }

    contacts.push(newContact);

    // Keep only last 1000 contacts to prevent file from growing too large
    if (contacts.length > 1000) {
      contacts = contacts.slice(-1000);
    }

    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));

    res.json({ ok: true, contact: newContact });
  } catch (err) {
    console.error("Error creating contact:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Delete contact submission
app.delete("/api/contacts/:id", adminAuth, (req, res) => {
  try {
    const { id } = req.params;

    if (!fs.existsSync(contactsFile)) {
      return res.status(404).json({ ok: false, message: "No contacts found" });
    }

    let contacts = JSON.parse(fs.readFileSync(contactsFile, "utf8") || "[]");
    const initialLength = contacts.length;

    contacts = contacts.filter((c) => c.id !== parseInt(id));

    if (contacts.length === initialLength) {
      return res.status(404).json({ ok: false, message: "Contact not found" });
    }

    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));

    res.json({ ok: true, message: "Contact deleted successfully" });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Student Dashboard Endpoints ---
const studentProgressFile = path.join(__dirname, "student_progress.json");
const badgesFile = path.join(__dirname, "badges.json");
const studentBadgesFile = path.join(__dirname, "student_badges.json");

// Get student's enrolled courses
app.post("/api/student/courses", express.json(), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required" });
    }

    // Fetch orders from MongoDB
    console.log(`Fetching courses for student: ${email}`);
    const studentOrders = await Order.find({
      email: { $regex: new RegExp(`^${email}$`, "i") }, // Case-insensitive match
    });
    console.log(`Found ${studentOrders.length} orders for ${email}`);

    // Get unique course IDs
    const courseIds = [
      ...new Set(
        studentOrders.map((order) => order.courseId?.toString().trim())
      ),
    ].filter(Boolean);

    if (courseIds.length === 0) {
      return res.json({ ok: true, courses: [] });
    }

    // Fetch course details from MongoDB
    const [onlineCourses, onsiteCourses] = await Promise.all([
      OnlineCourse.find({ id: { $in: courseIds } }),
      Course.find({ id: { $in: courseIds } }),
    ]);

    const allCourses = [...onlineCourses, ...onsiteCourses];

    // Get enrolled courses with progress
    const enrolledCoursesPromises = courseIds.map(async (courseId) => {
      const course = allCourses.find(
        (c) => String(c.id).trim() === String(courseId)
      );
      if (!course) return null;

      // Get progress from MongoDB
      let progress = 0;
      const studentProgress = await StudentProgress.findOne({
        email,
        courseId,
      });

      if (studentProgress) {
        // Calculate progress percentage
        let totalLectures = 0;

        // Count total lectures (handle both flat and nested structure)
        if (course.lectures) {
          course.lectures.forEach((section) => {
            if (section.lectures && Array.isArray(section.lectures)) {
              totalLectures += section.lectures.length;
            } else {
              totalLectures += 1;
            }
          });
        }

        const completedLectures =
          studentProgress.completedLectures?.length || 0;
        progress =
          totalLectures > 0
            ? Math.round((completedLectures / totalLectures) * 100)
            : 0;
      }

      // Find order to get status
      const order = studentOrders.find(
        (o) => String(o.courseId).trim() === String(courseId)
      );
      const status = order ? order.status || "Pending" : "Pending";

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
        certificateTemplate: course.certificateTemplate,
      };
    });

    const enrolledCourses = (await Promise.all(enrolledCoursesPromises)).filter(
      Boolean
    );

    res.json({ ok: true, courses: enrolledCourses });
  } catch (error) {
    console.error("Error fetching student courses:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Get student's progress for a specific course
app.post("/api/student/progress", express.json(), async (req, res) => {
  try {
    const { email, courseId } = req.body;

    if (!email || !courseId) {
      return res
        .status(400)
        .json({ ok: false, message: "Email and courseId are required" });
    }

    const progress = await StudentProgress.findOne({ email, courseId });

    // Convert array to map
    const progressMap = {};
    let completedCount = 0;
    if (progress && progress.completedLectures) {
      progress.completedLectures.forEach((lecId) => {
        progressMap[lecId] = true;
      });
      completedCount = progress.completedLectures.length;
    }

    // Check for Certificate (Self-healing: Generate if missing but completed)
    let certificate = await Certificate.findOne({ email, courseId });

    if (!certificate) {
      // Double check completion status
      const course =
        (await OnlineCourse.findOne({ id: courseId })) ||
        (await Course.findOne({ id: courseId }));
      if (course) {
        let totalLectures = 0;
        if (course.lectures) {
          course.lectures.forEach((section) => {
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
        const percentage =
          totalLectures > 0 ? (completedCount / totalLectures) * 100 : 0;

        if (percentage >= 100) {
          // Use Student's Reference Number
          const user = await User.findOne({ email });
          const regNo = user
            ? user.referenceNumber
            : `SPARK-${new Date().getFullYear()}-${Math.floor(
                1000 + Math.random() * 9000
              )}`;

          certificate = await Certificate.create({
            email,
            courseId,
            courseTitle: course.title,
            regNo,
            issueDate: new Date(),
          });
        }
      }
    }

    if (certificate) {
      // Sync Reg No with User Profile if mismatch (Fix for existing random certs)
      const user = await User.findOne({ email });
      if (
        user &&
        user.referenceNumber &&
        certificate.regNo !== user.referenceNumber
      ) {
        certificate.regNo = user.referenceNumber;
        await certificate.save();
      }
      progressMap.certificate = certificate;
    }

    res.json({ ok: true, progress: progressMap });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Update student's lecture progress
app.post("/api/student/progress/update", express.json(), async (req, res) => {
  try {
    const { email, courseId, lectureId, completed } = req.body;

    if (!email || !courseId || !lectureId) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Email, courseId, and lectureId are required",
        });
    }

    // Find or create progress record
    let progress = await StudentProgress.findOne({ email, courseId });

    if (!progress) {
      progress = new StudentProgress({
        email,
        courseId,
        uid: req.body.uid || "unknown", // Ideally pass UID from frontend
        completedLectures: [],
      });
    }

    // Update completed lectures list
    if (completed) {
      if (!progress.completedLectures.includes(lectureId)) {
        progress.completedLectures.push(lectureId);
      }
    } else {
      progress.completedLectures = progress.completedLectures.filter(
        (id) => id !== lectureId
      );
    }

    progress.lastWatched = new Date();
    await progress.save();

    // --- Check for Badges & Certificate ---
    let newBadges = [];
    let certificate = null;

    try {
      // 1. Calculate Course Progress
      const course =
        (await OnlineCourse.findOne({ id: courseId })) ||
        (await Course.findOne({ id: courseId }));

      if (course) {
        // Count total lectures
        let totalLectures = 0;
        if (course.lectures) {
          course.lectures.forEach((section) => {
            if (section.lectures) {
              totalLectures += section.lectures.length;
            } else {
              totalLectures += 1;
            }
          });
        }

        const completedLecturesCount = progress.completedLectures.length;
        const percentage =
          totalLectures > 0
            ? (completedLecturesCount / totalLectures) * 100
            : 0;

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
          if (studentBadges.some((sb) => sb.badgeId === badge.id)) continue;

          let awarded = false;
          if (
            badge.milestoneType === "percentage" &&
            badge.courseId === courseId
          ) {
            if (percentage >= badge.milestoneValue) awarded = true;
          } else if (
            badge.milestoneType === "percentage" &&
            badge.courseId === "all"
          ) {
            if (percentage >= badge.milestoneValue) awarded = true;
          }

          if (awarded) {
            const newStudentBadge = await StudentBadge.create({
              email,
              badgeId: badge.id,
              courseId: courseId,
              awardedAt: new Date(),
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
            const regNo = userDoc
              ? userDoc.referenceNumber
              : `SPARK-${new Date().getFullYear()}-${Math.floor(
                  1000 + Math.random() * 9000
                )}`;

            certificate = await Certificate.create({
              email,
              courseId,
              courseTitle: course.title,
              regNo,
              issueDate: new Date(),
            });
          } else {
            certificate = existingCert;
          }
        }
      }
    } catch (badgeError) {
      console.error("Error checking badges/certificate:", badgeError);
    }

    res.json({
      ok: true,
      message: "Progress updated successfully",
      newBadges,
      certificate,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Get student certificate
app.get("/api/student/certificate/:email/:courseId", async (req, res) => {
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
app.get("/api/admin/badges", adminAuth, async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json({ ok: true, badges });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create badge
app.post("/api/admin/badges", adminAuth, express.json(), async (req, res) => {
  try {
    const { name, icon, milestoneType, milestoneValue, courseId, description } =
      req.body;
    if (!name || !milestoneType || !milestoneValue) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields" });
    }

    const newBadge = await Badge.create({
      id: Date.now().toString(),
      name,
      icon,
      description: description || "",
      milestoneType,
      milestoneValue: parseInt(milestoneValue),
      courseId: courseId || "all",
    });

    res.json({ ok: true, badge: newBadge });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Delete badge
app.delete("/api/admin/badges/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Badge.deleteOne({ id });
    res.json({ ok: true, message: "Badge deleted" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Get student badges
app.get("/api/student/badges/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const userBadges = await StudentBadge.find({ email });
    const allBadges = await Badge.find();

    const enrichedBadges = userBadges
      .map((ub) => {
        const badgeDef = allBadges.find((b) => b.id === ub.badgeId);
        return badgeDef ? { ...badgeDef.toObject(), ...ub.toObject() } : null;
      })
      .filter(Boolean);

    res.json({ ok: true, badges: enrichedBadges });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Certificate Management Endpoints ---

// Upload certificate template for a course
app.post(
  "/api/admin/certificates/upload",
  adminAuth,
  upload.single("certificate"),
  async (req, res) => {
    try {
      const { courseId } = req.body;
      const file = req.file;

      if (!courseId) {
        return res
          .status(400)
          .json({ ok: false, message: "Course ID is required" });
      }

      if (!file) {
        return res
          .status(400)
          .json({ ok: false, message: "Certificate image is required" });
      }

      // Find the online course and update its certificate template
      const course = await OnlineCourse.findOne({ id: courseId });

      if (!course) {
        // Clean up uploaded file if course not found
        fs.unlink(file.path, () => {});
        return res.status(404).json({ ok: false, message: "Course not found" });
      }

      // Delete old certificate file if it exists
      if (course.certificateTemplate) {
        const oldPath = path.join(
          __dirname,
          course.certificateTemplate.replace("/uploads/", "uploads/")
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update course with new certificate template path
      const certificatePath = `/uploads/courses/${file.filename}`;
      course.certificateTemplate = certificatePath;
      await course.save();

      res.json({
        ok: true,
        message: "Certificate template uploaded successfully",
        certificateTemplate: certificatePath,
      });
    } catch (err) {
      console.error("Error uploading certificate:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// Delete certificate templates for multiple courses
app.delete(
  "/api/admin/certificates/delete",
  adminAuth,
  express.json(),
  async (req, res) => {
    try {
      const { courseIds } = req.body;

      if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        return res
          .status(400)
          .json({ ok: false, message: "Course IDs array is required" });
      }

      let deletedCount = 0;
      const errors = [];

      for (const courseId of courseIds) {
        try {
          const course = await OnlineCourse.findOne({ id: courseId });

          if (course && course.certificateTemplate) {
            // Delete the certificate file
            const filePath = path.join(
              __dirname,
              course.certificateTemplate.replace("/uploads/", "uploads/")
            );
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }

            // Remove certificate template from course
            course.certificateTemplate = null;
            await course.save();
            deletedCount++;
          }
        } catch (err) {
          errors.push({ courseId, error: err.message });
        }
      }

      if (errors.length > 0) {
        return res.json({
          ok: true,
          message: `Deleted ${deletedCount} certificate(s) with ${errors.length} error(s)`,
          deletedCount,
          errors,
        });
      }

      res.json({
        ok: true,
        message: `Successfully deleted ${deletedCount} certificate template(s)`,
        deletedCount,
      });
    } catch (err) {
      console.error("Error deleting certificates:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// --- Activity Log Endpoints ---
// Get all activity logs
app.get("/api/admin/activity-logs", adminAuth, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ time: -1 }).limit(1000);
    res.json({ ok: true, logs });
  } catch (err) {
    console.error("Error fetching activity logs:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- Gallery Management Endpoints ---
app.get("/api/gallery", async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post(
  "/api/admin/gallery/add",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_GALLERY),
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        type,
        category,
        externalUrl,
        thumbnail: externalThumbnail,
      } = req.body;
      const files = req.files;

      let url = "";
      let thumbnail = externalThumbnail || "";

      // Check for uploaded gallery item (image or video)
      if (files && files["file"] && files["file"][0]) {
        url = `/uploads/courses/${files["file"][0].filename}`;
      } else if (files && files["video"] && files["video"][0]) {
        url = `/uploads/videos/${files["video"][0].filename}`;
      } else {
        url = externalUrl;
      }

      // Check for uploaded thumbnail file
      if (files && files["thumbnail"] && files["thumbnail"][0]) {
        thumbnail = `/uploads/courses/${files["thumbnail"][0].filename}`;
      }

      if (!url) {
        return res
          .status(400)
          .json({ ok: false, message: "URL or File is required" });
      }

      const newItem = await Gallery.create({
        title,
        url,
        type: type || "image",
        category: category || "General",
        thumbnail: thumbnail,
      });

      res.json({ ok: true, item: newItem });
    } catch (err) {
      console.error("Gallery upload error:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

app.delete(
  "/api/admin/gallery/:id",
  adminAuth,
  requirePermission(PERMISSIONS.MANAGE_GALLERY),
  async (req, res) => {
    try {
      const item = await Gallery.findById(req.params.id);
      if (!item)
        return res.status(404).json({ ok: false, message: "Item not found" });

      if (item.url && item.url.startsWith("/uploads/")) {
        const filePath = path.join(
          __dirname,
          item.url.replace("/uploads/", "uploads/")
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Gallery.findByIdAndDelete(req.params.id);
      res.json({ ok: true, message: "Item deleted successfully" });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

// Start the server - SIMPLIFIED for Railway/Vercel
console.log("🏁 Attempting to start server...");
console.log("PORT from env:", process.env.PORT);
console.log("Using PORT:", PORT);

// Only start server if running directly (Locally or Hostinger/Render)
// Vercel handles the server start automatically via the export
if (require.main === module) {
  const server = app.listen(PORT, () => {
    const address = server.address();
    console.log(`✅ Server started successfully!`);
    console.log(`📡 Server address:`, address);
    console.log(`📡 Listening on port ${PORT}`);

    // Connect to MongoDB AFTER server starts
    console.log("🔌 Connecting to MongoDB...");
    mongoose
      .connect(MONGODB_URI)
      .then(() => {
        console.log("✅ Connected to MongoDB");
        isMongoDBConnected = true;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
      });
  });

  server.on("error", (e) => {
    console.error("❌ Server startup error:", e);
    if (e.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use`);
    }
  });
}

module.exports = app;
