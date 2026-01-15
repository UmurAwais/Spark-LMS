const mongoose = require('mongoose');

const adminRoleSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, default: 'Sajid Ali' },
  role: { 
    type: String, 
    required: true,
    enum: ['super_admin', 'content_manager', 'instructor', 'support_staff', 'finance_manager']
  },
  invitedBy: { type: String, required: true },
  invitedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'revoked'],
    default: 'pending'
  },
  inviteToken: { type: String },
  tokenExpiry: { type: Date },
  password: { type: String }, // Hashed password after accepting invite
  recoveryEmail: { type: String }, // Email for password recovery
  profilePicture: { type: String }, // URL to profile picture
  lastLogin: { type: Date }
});

module.exports = mongoose.model('AdminRole', adminRoleSchema);
