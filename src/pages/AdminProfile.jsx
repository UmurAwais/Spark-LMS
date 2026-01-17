import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { User, Mail, Shield, Camera, Save, X, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { apiFetch } from '../config';
import { useNotifications } from '../context/NotificationContext';

export default function AdminProfile() {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: 'Sajid Ali',
    email: '',
    recoveryEmail: '',
    role: '',
    profilePicture: null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    try {
      const email = localStorage.getItem('admin_email') || 'admin';
      const role = localStorage.getItem('admin_role') || 'super_admin';
      
      // Try to fetch profile from backend
      const res = await apiFetch('/api/admin/profile', {
        headers: { 'x-admin-token': localStorage.getItem('admin_token') }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setProfileData({
            name: data.profile.name || 'Sajid Ali',
            email: data.profile.email || email,
            recoveryEmail: data.profile.recoveryEmail || '',
            role: data.profile.role || role,
            profilePicture: data.profile.profilePicture || null
          });
          setImagePreview(data.profile.profilePicture);
        }
      } else {
        // Use local storage data
        setProfileData({
          name: localStorage.getItem('admin_name') || 'Sajid Ali',
          email: email,
          recoveryEmail: '',
          role: role,
          profilePicture: localStorage.getItem('admin_profile_picture') || null
        });
        setImagePreview(localStorage.getItem('admin_profile_picture'));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to local storage
      setProfileData({
        name: localStorage.getItem('admin_name') || 'Sajid Ali',
        email: localStorage.getItem('admin_email') || 'admin',
        recoveryEmail: '',
        role: localStorage.getItem('admin_role') || 'super_admin',
        profilePicture: localStorage.getItem('admin_profile_picture') || null
      });
      setImagePreview(localStorage.getItem('admin_profile_picture'));
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'Profile picture must be less than 2MB'
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select an image file'
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(profileData.profilePicture);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('recoveryEmail', profileData.recoveryEmail);
      
      if (imageFile) {
        formData.append('profilePicture', imageFile);
      }

      const res = await apiFetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'x-admin-token': localStorage.getItem('admin_token') },
        body: formData
      });

      const data = await res.json();

      if (data.ok) {
        // Update local storage
        localStorage.setItem('admin_name', profileData.name);
        if (data.profilePictureUrl) {
          localStorage.setItem('admin_profile_picture', data.profilePictureUrl);
          setProfileData(prev => ({ ...prev, profilePicture: data.profilePictureUrl }));
          setImagePreview(data.profilePictureUrl);
        }

        addNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully'
        });

        setImageFile(null);
        
        // Dispatch custom event to update header without page reload
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirm password do not match'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addNotification({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/api/admin/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': localStorage.getItem('admin_token') 
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (data.ok) {
        addNotification({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password has been changed successfully'
        });

        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      addNotification({
        type: 'error',
        title: 'Password Change Failed',
        message: error.message || 'Failed to change password'
      });
    } finally {
      setLoading(false);
    }
  }

  function getRoleDisplayName(role) {
    const names = {
      super_admin: 'Super Admin',
      content_manager: 'Content Manager',
      instructor: 'Instructor',
      support_staff: 'Support Staff',
      finance_manager: 'Finance Manager'
    };
    return names[role] || 'Admin';
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <User className="text-[#0d9c06]" />
            Admin Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your profile information and security settings</p>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Profile Header */}
          <div className="bg-linear-to-r from-[#0d9c06] to-[#0b7e05] h-32"></div>
          
          <div className="px-8 pb-8">
            {/* Profile Picture */}
            <div className="relative -mt-16 mb-6">
              <div className="relative inline-block">
                <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                  {imagePreview ? (
                    <img 
                      src={imagePreview.startsWith('http') || imagePreview.startsWith('blob:') ? imagePreview : `${config.apiUrl}${imagePreview}`} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-[#0d9c06] to-[#0b7e05] flex items-center justify-center text-white text-4xl font-bold">
                      {profileData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <label className="absolute bottom-0 right-0 h-10 w-10 bg-[#0d9c06] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#0b7e05] transition-colors shadow-lg">
                  <Camera size={20} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>

                {imageFile && (
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 h-8 w-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {imageFile && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  New image selected. Click Save to update.
                </p>
              )}
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-md focus:border-[#0d9c06] focus:ring-2 focus:ring-green-200 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Login Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={profileData.email}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Login email cannot be changed</p>
                </div>

                {/* Recovery Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Recovery Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={profileData.recoveryEmail}
                      onChange={(e) => setProfileData({ ...profileData, recoveryEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-md focus:border-[#0d9c06] focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="recovery@example.com"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Used for password recovery</p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={getRoleDisplayName(profileData.role)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Role is assigned by Super Admin</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#0d9c06] hover:bg-[#0b7e05] text-white px-6 py-3 rounded-md font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="text-[#0d9c06]" size={20} />
              Change Password
            </h2>
            <p className="text-sm text-gray-600 mt-1">Update your password to keep your account secure</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-md focus:border-[#0d9c06] focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-md focus:border-[#0d9c06] focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="Enter new password (min 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-md focus:border-[#0d9c06] focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#0d9c06] hover:bg-[#0b7e05] text-white px-6 py-3 rounded-md font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Lock size={20} />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Security Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Profile picture should be square and less than 2MB</li>
            <li>• Use a strong password with at least 6 characters</li>
            <li>• Add a recovery email to reset your password if forgotten</li>
            <li>• Your name will be displayed in the admin header</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
