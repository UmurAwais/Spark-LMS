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
  Sparkles,
  Target,
  Zap,
  Home as HomeIcon,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer 
} from 'recharts';
import { auth } from "../firebaseConfig";
import { apiFetch } from "../config";

const MetricCard = ({ title, value, label, icon, color, data }) => {
  const colors = {
    green: { bg: "bg-emerald-50", icon: "bg-emerald-500", text: "text-emerald-600", chart: "#10b981" },
    purple: { bg: "bg-purple-50", icon: "bg-[#5022C3]", text: "text-[#5022C3]", chart: "#5022C3" },
    amber: { bg: "bg-amber-50", icon: "bg-[#f4c150]", text: "text-[#f4c150]", chart: "#f4c150" },
    dark: { bg: "bg-gray-100", icon: "bg-gray-900", text: "text-gray-900", chart: "#1c1d1f" }
  };

  const theme = colors[color] || colors.green;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 font-sora">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
          <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
      </div>
      
      <div className="h-10 w-full opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data || [{v:10}, {v:15}, {v:12}, {v:18}, {v:14}, {v:22}, {v:20}]}>
            <Area type="monotone" dataKey="v" stroke={theme.chart} strokeWidth={2} fill={theme.chart} fillOpacity={0.1} isAnimationActive={true} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-gray-400 font-medium">{label}</p>
    </div>
  );
};

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
    if (activeTab === 'completed') return progress >= 100;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.ok && data.courses) {
        setEnrolledCourses(data.courses);
        const completed = data.courses.filter(c => c.progress >= 100).length;
        const inProgress = data.courses.filter(c => (c.progress || 0) < 100).length;
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
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center font-sora">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-[#0d9c06] rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  const activeCourse = enrolledCourses
    .filter(c => c.progress < 100 && c.status !== 'Pending')
    .sort((a, b) => b.progress - a.progress)[0];

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sora text-[#1c1d1f]">
      {/* Clean Navigation */}
      <nav className="sticky top-0 z-[100] bg-white border-b border-gray-100 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-[#1c1d1f] rounded-xl text-white">
                <Sparkles size={20} />
              </div>
              <span className="text-xl font-black tracking-tighter">SPARK <span className="text-[#0d9c06]">LMS</span></span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">Home</Link>
              <Link to="/courses" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">Catalog</Link>
              <span className="text-sm font-black text-[#0d9c06]">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               className="lg:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-4">
              <Link to="/student/profile" className="hidden sm:flex items-center gap-3 p-1.5 pr-4 hover:bg-gray-50 rounded-2xl transition-all">
                <div className="w-9 h-9 bg-gray-100 rounded-xl overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-300">{user?.displayName?.[0] || 'S'}</div>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-black leading-none">{user?.displayName || 'Student'}</p>
                  <p className="text-[10px] font-bold text-[#0d9c06] uppercase mt-1">Learner Account</p>
                </div>
              </Link>
              <button onClick={handleLogout} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl space-y-1 animate-in slide-in-from-top-2 duration-300">
             <Link to="/student/profile" className="flex items-center gap-3 p-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors">
                <User size={18} /> Profile
             </Link>
             <Link to="/courses" className="flex items-center gap-3 p-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors">
                <BookOpen size={18} /> All Courses
             </Link>
             <Link to="/" className="flex items-center gap-3 p-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors">
                <HomeIcon size={18} /> Home Site
             </Link>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row gap-10 mb-12 items-center lg:items-start text-center lg:text-left">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
              Welcome back,<br />
              <span className="text-[#0d9c06]">{user?.displayName?.split(' ')[0]}!</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-lg">
               Great to see you again. You have <span className="text-gray-900 font-bold">{stats.inProgressCourses} courses</span> waiting for you to continue.
            </p>
          </div>

          {activeCourse && (
            <div className="max-w-md w-full bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
               <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                 <img src={activeCourse.image} alt="" className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0 space-y-2">
                 <p className="text-[10px] font-black text-[#0d9c06] uppercase tracking-widest">Next Lesson</p>
                 <h4 className="text-sm font-black text-gray-900 truncate">{activeCourse.title}</h4>
                 <Link to={`/student/course/${activeCourse.id}`} className="inline-flex items-center gap-2 text-xs font-black text-white bg-[#1c1d1f] px-4 py-2 rounded-xl hover:bg-[#0d9c06] transition-colors">
                   Resume <ArrowRight size={14} />
                 </Link>
               </div>
            </div>
          )}
        </div>

        {/* Minimalist Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard 
            title="Total Enrolled" 
            value={stats.totalCourses} 
            label="Knowledge nodes" 
            icon={<BookOpen />} 
            color="green" 
            data={[{v:5},{v:8},{v:12},{v:10},{v:15},{v:14},{v:20}]}
          />
          <MetricCard 
            title="Hours Learned" 
            value={`${stats.totalHoursLearned}h`} 
            label="Time invested" 
            icon={<Clock />} 
            color="purple" 
            data={[{v:10},{v:15},{v:12},{v:20},{v:18},{v:25},{v:22}]}
          />
          <MetricCard 
            title="Earned Badges" 
            value={badges.length} 
            label="Achievements" 
            icon={<Award />} 
            color="amber" 
            data={[{v:2},{v:3},{v:5},{v:4},{v:6},{v:8},{v:7}]}
          />
          <MetricCard 
            title="In Progress" 
            value={stats.inProgressCourses} 
            label="Active training" 
            icon={<Zap />} 
            color="dark" 
            data={[{v:5},{v:4},{v:6},{v:5},{v:8},{v:7},{v:10}]}
          />
        </div>

        {/* Course Library */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Your Courses</h2>
            <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('in_progress')}
                className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'in_progress' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
              >
                STILL STUDYING
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'completed' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
              >
                ARCHIVED
              </button>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-white p-16 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 border border-gray-100 shadow-xs">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                 <BookOpen className="text-gray-200" size={32} />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-bold text-gray-900">No courses here yet</h3>
                 <p className="text-gray-400 max-w-xs mx-auto">Start your journey today by exploring our hand-picked catalog of premium courses.</p>
               </div>
               <Link to="/courses" className="px-8 py-3.5 bg-[#0d9c06] text-white text-sm font-black rounded-2xl hover:bg-black transition-colors shadow-lg shadow-[#0d9c06]/10">
                 Explore Catalog
               </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => {
                const isPending = course.status === 'Pending';
                
                return (
                  <div key={course.id} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col">
                    <div className="h-48 relative">
                       <img 
                          src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                       />
                       <div className="absolute top-4 left-4">
                         {isPending ? (
                           <div className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-black shadow-lg uppercase tracking-wider">
                             Waiting
                           </div>
                         ) : (
                           <div className={`px-3 py-1.5 ${course.progress === 100 ? 'bg-emerald-500' : 'bg-[#1c1d1f]'} text-white rounded-xl text-[10px] font-black shadow-lg uppercase tracking-wider`}>
                             {course.progress === 100 ? 'Completed' : `${course.progress}% done`}
                           </div>
                         )}
                       </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col space-y-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-black text-gray-900 line-clamp-2 leading-tight">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-400 font-medium line-clamp-2 leading-relaxed">
                          {course.excerpt || "Master these skills with our professional curriculum designed for modern careers."}
                        </p>
                      </div>

                      {!isPending && (
                        <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${course.progress === 100 ? 'bg-emerald-500' : 'bg-[#0d9c06]'}`}
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                      )}

                      <div className="pt-2">
                        {isPending ? (
                          <div className="w-full py-3.5 text-center bg-gray-50 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                            Verification Pending
                          </div>
                        ) : (
                          <Link 
                            to={`/student/course/${course.id}`}
                            className="w-full py-3.5 bg-[#f8f9fa] hover:bg-[#1c1d1f] hover:text-white text-black text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-100 hover:border-transparent"
                          >
                            <PlayCircle size={18} />
                            {course.progress === 100 ? 'Review Lessons' : 'Resume Course'}
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

        {/* Certificate Section */}
        {badges.length > 0 && (
          <div className="mt-20 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h2 className="text-2xl font-black text-gray-900">Certificate Vault</h2>
                     <p className="text-sm text-gray-400 font-medium">Your verified skill achievements</p>
                   </div>
                   <div className="px-4 py-2 bg-amber-50 rounded-2xl text-amber-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Award size={16} /> Verified
                   </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-8 text-center">
                  {badges.map((badge, idx) => (
                    <div key={idx} className="space-y-3 group/badge">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl shadow-xs group-hover/badge:bg-amber-50 group-hover/badge:scale-105 transition-all duration-300">
                        {badge.icon || '🏅'}
                      </div>
                      <p className="text-[10px] font-black text-gray-900 tracking-tight uppercase">{badge.name}</p>
                      <p className="text-[9px] font-bold text-gray-400">{new Date(badge.awardedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1c1d1f] rounded-lg flex items-center justify-center">
             <Sparkles className="text-white" size={16} />
          </div>
          <span className="text-xs font-black tracking-tight text-gray-400 uppercase">Spark LMS Platform</span>
        </div>
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Crafted with excellence for modern learners</p>
        <div className="flex items-center gap-8">
           <a href="#" className="text-[10px] font-black text-gray-400 hover:text-black transition-colors cursor-pointer">SUPPORT</a>
           <a href="#" className="text-[10px] font-black text-gray-400 hover:text-black transition-colors cursor-pointer">LEGAL</a>
           <a href="#" className="text-[10px] font-black text-gray-400 hover:text-black transition-colors cursor-pointer">STATUS</a>
        </div>
      </footer>
    </div>
  );
}
