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
  Lock,
  ChevronRight
} from "lucide-react";
import { auth } from "../firebaseConfig";
import { reauthenticateWithCredential, EmailAuthProvider, updateProfile, updatePassword } from "firebase/auth";
import { apiFetch } from "../config";
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
        headers: { 'Content-Type': 'application/json' },
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

    setUploading(true);
    const previewURL = URL.createObjectURL(file);
    setProfileData(prev => ({ ...prev, photoURL: previewURL }));
    
    try {
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
      
      await updateProfile(auth.currentUser, { photoURL: fullPhotoURL });
      await auth.currentUser.reload();
      
      setProfileData(prev => ({ ...prev, photoURL: fullPhotoURL }));
      setUser({ ...auth.currentUser });
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setProfileData(prev => ({ ...prev, photoURL: user?.photoURL || '' }));
      alert(`Failed to upload photo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: profileData.displayName });
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
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordData.newPassword);
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPasswordSection(false), 2000);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(error.code === 'auth/wrong-password' ? 'Incorrect current password' : error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const profilePictureUrl = useImageUrl(profileData.photoURL);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center font-sora">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#0d9c06] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sora text-[#1c1d1f]">
      {/* Success Notification */}
      {showSuccessPopup && (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-[#1c1d1f] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0d9c06] rounded-full flex items-center justify-center">
              <Check size={18} />
            </div>
            <div>
              <p className="text-sm font-black">Changes Saved</p>
              <p className="text-[10px] font-bold text-gray-400">Profile synchronized successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Navigation */}
      <nav className="sticky top-0 z-[100] bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/student/dashboard" className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ArrowLeft size={22} className="text-gray-400 hover:text-black" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#1c1d1f] rounded-xl text-white">
                <User size={18} />
              </div>
              <span className="text-xl font-black tracking-tighter">MY <span className="text-[#0d9c06]">PROFILE</span></span>
            </div>
          </div>
          <Link to="/student/dashboard" className="text-sm font-black text-[#0d9c06] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gray-100 overflow-hidden ring-4 ring-white shadow-xl relative">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-3xl font-black text-gray-200">
                      {user?.displayName?.[0] || 'S'}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-3 bg-[#0d9c06] text-white rounded-2xl shadow-xl hover:scale-110 transition-transform cursor-pointer"
                >
                  <Camera size={18} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>

              <div className="text-center mt-6">
                <h2 className="text-2xl font-black text-gray-900">{user?.displayName || 'Student'}</h2>
                <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest">{user?.email}</p>
                <div className="mt-4 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                  <ShieldCheck size={14} /> Verified Student
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-10">
                <div className="bg-gray-50 p-6 rounded-3xl text-center">
                  <p className="text-2xl font-black text-gray-900">{enrolledCourses.length}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Courses</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl text-center">
                  <p className="text-2xl font-black text-[#0d9c06]">
                    {enrolledCourses.filter(c => c.progress === 100).length}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Completed</p>
                </div>
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-[#1c1d1f] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <h4 className="text-lg font-black italic">Need assistance?</h4>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">Our support team is available 24/7 to help you with your learning path.</p>
                  <button className="w-full py-4 bg-[#0d9c06] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
                    Open Support Ticket
                  </button>
               </div>
               <Sparkles className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-[#0d9c06]/10 transition-colors" size={120} />
            </div>
          </div>

          {/* Right Column: Dynamic Tabs/Forms */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Personal Details */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-gray-900">Account Details</h3>
                  <p className="text-sm text-gray-400 font-medium">Update your profile and contact information</p>
                </div>
                <button 
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${isEditing ? 'bg-[#0d9c06] text-white shadow-lg shadow-[#0d9c06]/20' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
                >
                  {isEditing ? <><Save size={16} /> Save Changes</> : <><Edit2 size={16} /> Edit Profile</>}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User size={14} className="text-[#0d9c06]" /> Full Display Name
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.displayName} 
                      onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#0d9c06] outline-none transition-all font-bold text-gray-900"
                    />
                  ) : (
                    <div className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-900">{profileData.displayName || 'Not Set'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail size={14} className="text-[#0d9c06]" /> Primary Email
                  </label>
                  <div className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-400 cursor-not-allowed flex items-center justify-between">
                    {user?.email}
                    <Lock size={14} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Phone size={14} className="text-[#0d9c06]" /> Contact Number
                  </label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#0d9c06] outline-none transition-all font-bold text-gray-900"
                    />
                  ) : (
                    <div className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-900">{profileData.phone || 'Not Provided'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar size={14} className="text-[#0d9c06]" /> Member Since
                  </label>
                  <div className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-900">
                    {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight text-gray-900">Account Security</h3>
                    <p className="text-sm text-gray-400 font-medium">Protect your instance with a strong password</p>
                  </div>
                  {!showPasswordSection && (
                    <button 
                      onClick={() => setShowPasswordSection(true)}
                      className="px-6 py-3 bg-[#1c1d1f] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#0d9c06] transition-colors flex items-center gap-2"
                    >
                      <Lock size={16} /> Update Password
                    </button>
                  )}
                </div>

                {showPasswordSection ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-6 animate-in fade-in duration-500">
                    {passwordError && <div className="p-4 bg-rose-50 text-rose-500 text-xs font-bold rounded-2xl border border-rose-100">{passwordError}</div>}
                    {passwordSuccess && <div className="p-4 bg-emerald-50 text-emerald-500 text-xs font-bold rounded-2xl border border-emerald-100">{passwordSuccess}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Current</label>
                        <input 
                          type="password" 
                          value={passwordData.currentPassword} 
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#0d9c06] font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                        <input 
                          type="password" 
                          value={passwordData.newPassword} 
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#0d9c06] font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New</label>
                        <input 
                          type="password" 
                          value={passwordData.confirmPassword} 
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#0d9c06] font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        type="submit" 
                        disabled={passwordLoading}
                        className="flex-1 py-4 bg-[#0d9c06] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-[#0d9c06]/20 disabled:opacity-50"
                      >
                        {passwordLoading ? 'Cryptographic Update...' : 'Commit New Password'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowPasswordSection(false)}
                        className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                      <ShieldCheck className="text-[#0d9c06]" size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">Your account is secured</h4>
                      <p className="text-xs text-gray-400 font-medium">Last profile synchronization was successful.</p>
                    </div>
                  </div>
                )}
            </div>

            {/* Curriculum Snapshot */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight text-gray-900">Curriculum Snapshot</h3>
                    <p className="text-sm text-gray-400 font-medium">Overview of your most recent learning nodes</p>
                  </div>
                  <Link to="/student/dashboard" className="p-3 bg-gray-50 rounded-2xl text-[#0d9c06] hover:bg-[#0d9c06] hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </Link>
               </div>

               <div className="space-y-4">
                 {enrolledCourses.slice(0, 3).map((course) => (
                   <div key={course.id} className="flex items-center gap-6 p-4 hover:bg-gray-50 rounded-3xl transition-colors group cursor-pointer" onClick={() => navigate(`/student/course/${course.id}`)}>
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0">
                        <img src={course.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-900 truncate uppercase italic">{course.title}</h4>
                        <div className="flex items-center gap-4 mt-2">
                           <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0d9c06] rounded-full" style={{ width: `${course.progress}%` }}></div>
                           </div>
                           <span className="text-[10px] font-black text-gray-400">{course.progress}%</span>
                        </div>
                      </div>
                   </div>
                 ))}
                 {enrolledCourses.length === 0 && (
                   <p className="text-center py-6 text-sm font-bold text-gray-300 uppercase tracking-widest">No active learning nodes found</p>
                 )}
               </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 mt-12 flex items-center justify-between">
         <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Spark Personal Instance v4.0</p>
         <div className="flex items-center gap-6">
            <div className="w-2 h-2 rounded-full bg-[#0d9c06] animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Operational</span>
         </div>
      </footer>
    </div>
  );
}
