import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  BookOpen,
  ArrowLeft,
  Camera,
  Edit2,
  Save,
  X,
  Check,
  Sparkles,
  Award,
  TrendingUp,
  Clock,
  ShieldCheck,
  Lock
} from "lucide-react";
import { auth, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { apiFetch, config, API_URL_PROMISE } from "../config";
import { useImageUrl } from "../hooks/useImageUrl";

export default function StudentProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    photoURL: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setProfileData({
        displayName: currentUser.displayName || '',
        phone: currentUser.phoneNumber || '',
        photoURL: currentUser.photoURL || ''
      });
      fetchEnrolledCourses(currentUser.email);
      fetchUserProfile(currentUser.uid);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  async function fetchUserProfile(uid) {
    try {
      const res = await apiFetch(`/api/student/profile/${uid}`);
      const data = await res.json();
      if (data.ok && data.user) {
        setProfileData(prev => ({
          ...prev,
          displayName: data.user.displayName || prev.displayName,
          phone: data.user.phone || prev.phone,
          photoURL: data.user.profilePicture || prev.photoURL
        }));
      }
    } catch (error) {
      console.error('Error fetching profile from backend:', error);
    }
  }

  async function fetchEnrolledCourses(email) {
    try {
      const res = await apiFetch('/api/student/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (data.ok && data.courses) {
        setEnrolledCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    
    const previewURL = URL.createObjectURL(file);
    setProfileData(prev => ({ ...prev, photoURL: previewURL }));
    
    try {
      // 1. Upload to backend (Cloudinary)
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('uid', user.uid);

      const res = await apiFetch('/api/student/upload-photo', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to upload to server");

      const fullPhotoURL = data.photoURL;

      URL.revokeObjectURL(previewURL);
      
      // 2. Update Firebase Auth for consistency
      try {
        await updateProfile(auth.currentUser, { photoURL: fullPhotoURL });
        await auth.currentUser.reload();
      } catch (authErr) {
        console.warn("Failed to update Firebase Auth profile:", authErr);
      }
      
      setProfileData(prev => ({ ...prev, photoURL: fullPhotoURL }));
      setUser({ ...auth.currentUser });
      
      // Show success popup
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      setProfileData(prev => ({ ...prev, photoURL: user?.photoURL || '' }));
      URL.revokeObjectURL(previewURL);
      alert(`Failed to upload photo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // 1. Update Firebase Auth (for local display and auth consistency)
      await updateProfile(user, {
        displayName: profileData.displayName
      });

      // 2. Update Backend Database (for persistence and admin dashboard)
      const res = await apiFetch('/api/student/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          displayName: profileData.displayName,
          phone: profileData.phone
        })
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to update backend");

      setUser({ ...user, displayName: profileData.displayName });
      setIsEditing(false);
      
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password should be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordData.newPassword);
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
      
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect current password');
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError('Too many failed attempts. Please try again later.');
      } else {
        setPasswordError('Failed to update password: ' + error.message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Use hook to get properly resolved profile picture URL
  const profilePictureUrl = useImageUrl(profileData.photoURL);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#0d9c06] mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0d9c06] animate-pulse" size={32} />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-50 relative">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0d9c06]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#5022C3]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#0d9c06]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-24 right-6 z-50 animate-slide-in-right">
          <div className="bg-white rounded-md shadow-2xl border-2 border-green-200 p-4 flex items-center gap-3 min-w-[300px]">
            <div className="w-12 h-12 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-full flex items-center justify-center shrink-0">
              <Check className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">Success!</h4>
              <p className="text-sm text-gray-600">Profile updated successfully</p>
            </div>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <Link
              to="/student/dashboard"
              className="p-2 hover:bg-green-50 rounded-md transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#0d9c06] to-[#0b7e05] bg-clip-text text-transparent">My Profile</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-md rounded-md border-2 border-gray-200 shadow-2xl p-6 hover:shadow-3xl transition-all">
              {/* Profile Photo */}
              <div className="text-center mb-6">
                <div className="relative inline-block group">
                  <div className="w-40 h-40 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-full flex items-center justify-center text-white text-5xl font-bold mx-auto shadow-2xl overflow-hidden ring-4 ring-white">
                    {profilePictureUrl ? (
                      <img 
                        src={profilePictureUrl} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-2 right-2 p-3 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white rounded-full hover:scale-110 transition-all shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
                  >
                    <Camera size={22} />
                  </button>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="text-white" size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-6">
                  {user?.displayName || 'Student'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                <p className="text-xs text-[#0d9c06] font-medium mt-3 flex items-center justify-center gap-1">
                  <Camera size={12} />
                  Click camera to upload photo
                </p>
              </div>

              {/* Quick Stats */}
              <div className="border-t-2 border-gray-200 pt-6 space-y-3">
                <div className="flex items-center justify-between p-4 bg-linear-to-r from-green-50 to-green-100/50 rounded-md hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0d9c06] rounded-md flex items-center justify-center">
                      <BookOpen className="text-white" size={20} />
                    </div>
                    <span className="text-sm text-gray-700 font-semibold">Enrolled Courses</span>
                  </div>
                  <span className="text-2xl font-bold text-[#0d9c06]">{enrolledCourses.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-linear-to-r from-green-50 to-green-100/50 rounded-md hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0d9c06] rounded-md flex items-center justify-center">
                      <Award className="text-white" size={20} />
                    </div>
                    <span className="text-sm text-gray-700 font-semibold">Completed</span>
                  </div>
                  <span className="text-2xl font-bold text-[#0d9c06]">
                    {enrolledCourses.filter(c => c.progress === 100).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-linear-to-r from-purple-50 to-purple-100/50 rounded-md hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5022C3] rounded-md flex items-center justify-center">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <span className="text-sm text-gray-700 font-semibold">In Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-[#5022C3]">
                    {enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white/90 backdrop-blur-md rounded-md border-2 border-gray-200 shadow-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-md">
                    <User className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white font-semibold transition-all px-5 py-2.5 rounded-md shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Edit2 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // We don't want to reset to 'user' because user object only has Firebase details.
                        // We should refetch or just hide editing. If we want to reset, we'd need to cache the backend data.
                        // For now, let's just turn off editing.
                      }}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors px-4 py-2.5 hover:bg-gray-100 rounded-md"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white hover:shadow-xl font-semibold transition-all px-5 py-2.5 rounded-md shadow-lg hover:scale-105 cursor-pointer"
                    >
                      <Save size={18} />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User size={16} className="text-[#0d9c06]" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-md font-medium">{user?.displayName || 'Not set'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={16} className="text-[#0d9c06]" />
                    Email Address
                  </label>
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-md font-medium">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1 ml-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone size={16} className="text-[#0d9c06]" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="03001234567"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-md font-medium">{profileData.phone || 'Not set'}</p>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={16} className="text-[#0d9c06]" />
                    Member Since
                  </label>
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-md font-medium">
                    {user?.metadata?.creationTime 
                      ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Security & Password */}
            <div className="bg-white/90 backdrop-blur-md rounded-md border-2 border-gray-200 shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-linear-to-br from-[#5022C3] to-[#3f1bac] rounded-md">
                    <ShieldCheck className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Security & Password</h3>
                </div>
                {!showPasswordSection ? (
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className="text-sm font-bold text-[#5022C3] hover:text-[#3f1bac] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Lock size={16} />
                    Change Password
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    className="text-sm font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {showPasswordSection ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4 animate-in fade-in duration-300">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center gap-2">
                      <X size={16} />
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-md flex items-center gap-2">
                      <Check size={16} />
                      {passwordSuccess}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          required
                          placeholder="••••••••"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5022C3] focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <X size={18} /> : <Lock size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5022C3] focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5022C3] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-linear-to-r from-[#5022C3] to-[#3f1bac] text-white font-bold py-3 rounded-md shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-gray-50 rounded-md p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center border border-gray-200 shadow-sm">
                    <Lock className="text-[#5022C3]" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Security Policy</h4>
                    <p className="text-xs text-gray-600">Password should be at least 6 characters. Use special characters for better security.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Enrolled Courses */}
            <div className="bg-white/90 backdrop-blur-md rounded-md border-2 border-gray-200 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-md">
                  <BookOpen className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Enrolled Courses</h3>
              </div>
              
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-linear-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="text-[#0d9c06]" size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">No courses enrolled yet</h4>
                  <p className="text-gray-600 mb-6">Start your learning journey today!</p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white px-6 py-3 rounded-md font-bold hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <Sparkles size={18} />
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledCourses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/student/course/${course.id}`}
                      className="group flex flex-col p-4 border-2 border-gray-200 rounded-md hover:border-[#0d9c06] hover:shadow-xl transition-all bg-white cursor-pointer"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-14 h-14 bg-linear-to-br from-gray-200 to-gray-100 rounded-md overflow-hidden shrink-0 shadow-md">
                          {course.image ? (
                            <img 
                              src={course.image} 
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#0d9c06] to-[#0b7e05]">
                              <BookOpen className="text-white" size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-[#0d9c06] transition-colors">{course.title}</h4>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600 font-medium">Progress</span>
                          <span className="text-xs font-bold text-[#0d9c06]">{course.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-linear-to-r from-[#0d9c06] to-[#0b7e05] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
