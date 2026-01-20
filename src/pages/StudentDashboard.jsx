import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  PlayCircle,
  CheckCircle,
  User,
  Menu,
  X,
  LogOut,
  Zap,
  Home as HomeIcon
} from "lucide-react";
import { auth } from "../firebaseConfig";
import { apiFetch } from "../config";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHoursLearned: 0
  });
  const [activeTab, setActiveTab] = useState('in_progress');

  const filteredCourses = enrolledCourses.filter(course => {
    const progress = course.progress || 0;
    if (activeTab === 'completed') {
      return progress >= 100;
    }
    // In Progress includes not started (0%), in progress (<100%), and pending approval
    return progress < 100 || course.status === 'Pending';
  });

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses(user.email);
      fetchBadges(user.email);
    }
  }, [user]);

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
        
        const completed = data.courses.filter(c => c.progress >= 100).length;
        const inProgress = data.courses.filter(c => c.progress > 0 && c.progress < 100).length;
        
        setStats({
          totalCourses: data.courses.length,
          completedCourses: completed,
          inProgressCourses: inProgress,
          totalHoursLearned: data.courses.reduce((acc, c) => acc + (c.hoursWatched || 0), 0)
        });
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBadges(email) {
    try {
      const res = await apiFetch(`/api/student/badges/${email}`);
      const data = await res.json();
      if (data.ok) setBadges(data.badges);
    } catch (err) {
      console.error('Error fetching badges:', err);
    }
  }

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#0d9c06] mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0d9c06] animate-pulse" size={32} />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Preparing your learning journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0d9c06]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#5022C3]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#0d9c06]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#0d9c06]" size={24} />
            <h1 className="text-xl font-bold bg-linear-to-r from-[#0d9c06] to-[#0b7e05] bg-clip-text text-transparent">My Learning</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-green-50 rounded-md transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <Link
              to="/student/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors"
            >
              <User size={20} className="text-[#0d9c06]" />
              <span className="text-gray-700 font-medium">My Profile</span>
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors"
            >
              <HomeIcon size={20} className="text-[#0d9c06]" />
              <span className="text-gray-700 font-medium">Go to Home</span>
            </Link>
            <Link
              to="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors"
            >
              <BookOpen size={20} className="text-[#0d9c06]" />
              <span className="text-gray-700 font-medium">Browse Courses</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left text-red-600 font-medium cursor-pointer"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-md shadow-lg">
                <Sparkles className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-[#0d9c06] to-[#0b7e05] bg-clip-text text-transparent">
                  My Learning Journey
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Zap size={14} className="text-[#0d9c06]" />
                  Keep learning, keep growing!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="px-5 py-2.5 text-gray-700 hover:bg-green-50 rounded-md transition-all font-medium border-2 border-transparent hover:border-green-200 hover:shadow-md flex items-center gap-2 cursor-pointer"
              >
                <HomeIcon size={18} />
                Home
              </Link>
              <Link
                to="/courses"
                className="px-5 py-2.5 text-gray-700 hover:bg-green-50 rounded-md transition-all font-medium border-2 border-transparent hover:border-green-200 hover:shadow-md cursor-pointer"
              >
                Browse Courses
              </Link>
              <Link
                to="/student/profile"
                className="flex items-center gap-3 px-4 py-2.5 bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-md transition-all border-2 border-green-200 hover:shadow-lg cursor-pointer"
              >
                <div className="w-10 h-10 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{user?.displayName || 'Student'}</p>
                  <p className="text-xs text-[#0d9c06] font-medium">View Profile</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-all font-medium border-2 border-red-200 hover:shadow-lg hover:scale-105 cursor-pointer"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative z-10">
        {/* Welcome Banner */}
        <div className="mb-8 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] rounded-md p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-yellow-300" size={24} />
              <span className="text-yellow-300 font-semibold text-sm uppercase tracking-wide">Your Progress</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}! 👋
            </h2>
            <p className="text-white/90 text-sm sm:text-base">
              You've completed {stats.completedCourses} course{stats.completedCourses !== 1 ? 's' : ''} and learned {stats.totalHoursLearned} hours. Keep up the amazing work!
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {/* Total Courses */}
          <div className="group bg-white rounded-md p-5 sm:p-6 border-2 border-green-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-md shadow-lg group-hover:scale-110 transition-transform">
                <BookOpen className="text-white" size={24} />
              </div>
              <Sparkles className="text-green-300 group-hover:text-[#0d9c06] transition-colors" size={20} />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{stats.totalCourses}</h3>
            <p className="text-sm text-gray-600 font-medium">Total Courses</p>
          </div>

          {/* In Progress */}
          <div className="group bg-white rounded-md p-5 sm:p-6 border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-br from-[#5022C3] to-[#3d1a99] rounded-md shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="text-white" size={24} />
              </div>
              <Zap className="text-purple-300 group-hover:text-[#5022C3] transition-colors" size={20} />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{stats.inProgressCourses}</h3>
            <p className="text-sm text-gray-600 font-medium">In Progress</p>
          </div>

          {/* Completed */}
          <div className="group bg-white rounded-md p-5 sm:p-6 border-2 border-green-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] rounded-md shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="text-white" size={24} />
              </div>
              <Award className="text-green-300 group-hover:text-[#0d9c06] transition-colors" size={20} />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{stats.completedCourses}</h3>
            <p className="text-sm text-gray-600 font-medium">Completed</p>
          </div>

          {/* Hours Learned */}
          <div className="group bg-white rounded-md p-5 sm:p-6 border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-br from-[#5022C3] to-[#3d1a99] rounded-md shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="text-white" size={24} />
              </div>
              <Target className="text-purple-300 group-hover:text-[#5022C3] transition-colors" size={20} />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{stats.totalHoursLearned}</h3>
            <p className="text-sm text-gray-600 font-medium">Hours Learned</p>
          </div>
        </div>



        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="text-[#0d9c06]" />
              My Achievements
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map((badge, idx) => (
                <div key={badge.badgeId || idx} className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow group cursor-default">
                  <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                    {badge.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-500">{new Date(badge.awardedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-md border-2 border-gray-200 shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-linear-to-r from-green-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="text-[#0d9c06]" size={28} />
                  My Courses
                </h2>
                <p className="text-sm text-gray-600 mt-1">Continue where you left off</p>
              </div>
              
              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-md self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab('in_progress')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    activeTab === 'in_progress'
                      ? 'bg-white text-[#0d9c06] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    activeTab === 'completed'
                      ? 'bg-white text-[#0d9c06] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <div className="w-24 h-24 bg-linear-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                {activeTab === 'completed' ? (
                  <Award className="text-[#0d9c06]" size={48} />
                ) : (
                  <BookOpen className="text-[#0d9c06]" size={48} />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {activeTab === 'completed' ? 'No completed courses yet' : 'No courses in progress'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                {activeTab === 'completed' 
                  ? "Keep learning to earn your certificates!" 
                  : "Start your learning journey today and unlock your potential!"}
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white px-8 py-4 rounded-md font-bold hover:shadow-2xl transition-all hover:scale-105 text-lg cursor-pointer"
              >
                <Sparkles size={20} />
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCourses.map((course, index) => {
                const isPending = course.status === 'Pending';
                
                return (
                <div 
                  key={course.id} 
                  onClick={() => !isPending && navigate(`/student/course/${course.id}`)}
                  className={`p-6 transition-all group ${isPending ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-linear-to-r hover:from-green-50/50 hover:to-white/50 cursor-pointer'}`}
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Course Image */}
                    <div className="relative w-full sm:w-56 lg:w-72 h-40 bg-linear-to-br from-gray-200 to-gray-100 rounded-md overflow-hidden shrink-0 shadow-lg group-hover:shadow-2xl transition-all">
                      {course.image ? (
                        <img 
                          src={course.image} 
                          alt={course.title}
                          className={`w-full h-full object-cover transition-transform duration-500 ${isPending ? 'grayscale' : 'group-hover:scale-110'}`}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isPending ? 'bg-gray-400' : 'bg-linear-to-br from-[#0d9c06] to-[#0b7e05]'}`}>
                          <BookOpen className="text-white" size={56} />
                        </div>
                      )}
                      {course.progress === 100 && !isPending && (
                        <div className="absolute top-3 right-3 bg-[#0d9c06] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          <Award size={14} />
                          Completed
                        </div>
                      )}
                      {isPending && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                           <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                             <Clock size={14} />
                             Pending Approval
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-[#0d9c06] transition-colors">
                          {course.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-5 line-clamp-2">{course.excerpt}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Target size={14} className="text-[#0d9c06]" />
                            Progress
                          </span>
                          <span className="text-sm font-bold text-[#0d9c06]">{course.progress || 0}%</span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`absolute inset-0 rounded-full transition-all duration-700 shadow-lg ${isPending ? 'bg-gray-400' : 'bg-linear-to-r from-[#0d9c06] to-[#0b7e05]'}`}
                            style={{ width: `${course.progress || 0}%` }}
                          >
                            {!isPending && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                          </div>
                        </div>
                      </div>



                      {/* Milestones */}
                      {!isPending && (course.progress > 0) && (
                        <div className="mb-5 flex flex-wrap gap-2">
                          {course.progress >= 25 && (
                            <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-xs font-semibold border border-orange-100" title="25% Milestone Reached">
                              <span>🥉</span> 25%
                            </div>
                          )}
                          {course.progress >= 50 && (
                            <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold border border-gray-200" title="50% Milestone Reached">
                              <span>🥈</span> 50%
                            </div>
                          )}
                          {course.progress >= 75 && (
                            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-xs font-semibold border border-yellow-100" title="75% Milestone Reached">
                              <span>🥇</span> 75%
                            </div>
                          )}
                          {course.progress === 100 && (
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-bold border border-green-100 shadow-sm" title="Course Completed">
                              <span>🏆</span> Certified
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      {isPending ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 border border-gray-200 px-6 py-3 rounded-md font-bold cursor-not-allowed w-full sm:w-auto justify-center"
                        >
                          <Clock size={20} />
                          Waiting for Admin Approval
                        </button>
                      ) : (
                        <Link
                          to={`/student/course/${course.id}`}
                          className="inline-flex items-center gap-2 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white px-6 py-3 rounded-md font-bold hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto justify-center cursor-pointer"
                        >
                          <PlayCircle size={20} />
                          {course.progress === 100 ? 'Review Course' : (course.progress > 0 ? 'Continue Learning' : 'Start Course')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add custom animations */}
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
      `}</style>
    </div>
  );
}
