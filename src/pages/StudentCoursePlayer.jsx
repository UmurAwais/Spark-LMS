import React, { useState, useEffect, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  PlayCircle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Menu,
  X,
  FileText,
  Download,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  HelpCircle,
  Lock,
  AlertCircle,
  Award
} from 'lucide-react';
import { apiFetch, API_URL } from '../config';
import { auth } from '../firebaseConfig';
import SparkLogo from '../assets/Logo.png';
import VideoPlayer from '../components/VideoPlayer';

export default function StudentCoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' or 'resources'
  const [completedLectures, setCompletedLectures] = useState({});
  const [showBadgeModal, setShowBadgeModal] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
  }, [currentLecture]);

  const [showCertificateModal, setShowCertificateModal] = useState(false);
  
  // Quiz State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState({ sectionId: null, questions: [] });
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null); // { score: 0, passed: false, total: 0 }

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const res = await apiFetch('/api/student/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        });

        const data = await res.json();
        if (data.ok) {
          const foundCourse = data.courses.find(c => c.id === courseId);
          if (foundCourse) {
            setCourse(foundCourse);
            // Set initial lecture
            if (foundCourse.lectures && foundCourse.lectures.length > 0) {
              const firstItem = foundCourse.lectures[0];
              if (firstItem.lectures) {
                const firstLecture = firstItem.lectures[0];
                setCurrentLecture(firstLecture);
                setExpandedSections({ [firstItem.id]: true });
              } else {
                setCurrentLecture(firstItem);
              }
            }
          } else {
            navigate('/student/dashboard');
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const res = await apiFetch('/api/student/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, courseId })
        });
        const data = await res.json();
        if (data.ok) {
          setCompletedLectures(data.progress || {});
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      }
    };
    fetchProgress();
  }, [courseId]);

  const handleMarkComplete = async () => {
    if (!currentLecture) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      const isCompleted = completedLectures[currentLecture.id];
      const newStatus = !isCompleted;

      // Optimistic update
      setCompletedLectures(prev => ({
        ...prev,
        [currentLecture.id]: newStatus
      }));

      const res = await apiFetch('/api/student/progress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          courseId,
          lectureId: currentLecture.id,
          completed: newStatus
        })
      });

      const data = await res.json();
      if (data.ok) {
        if (data.certificate) {
           setCompletedLectures(prev => ({ ...prev, certificate: data.certificate }));
        }
        if (data.newBadges && data.newBadges.length > 0) {
           setShowBadgeModal(data.newBadges[0]); // Show first new badge
        }
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      // Revert on error
      setCompletedLectures(prev => ({
        ...prev,
        [currentLecture.id]: !prev[currentLecture.id]
      }));
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isSectionLocked = (sectionIndex) => {
    // Section locking disabled as per user request - return false ALWAYS
    return false;
  };

  const handleLectureClick = (lecture, sectionIndex) => {
    if (isSectionLocked(sectionIndex)) {
        alert("Please complete the quiz in the previous section to unlock this content.");
        return;
    }
    
    setCurrentLecture(lecture);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Quiz Handling
  const handleStartQuiz = (section) => {
    setCurrentQuiz({
        sectionId: section.id,
        questions: section.quiz
    });
    setQuizAnswers({});
    setQuizResult(null);
    setShowQuizModal(true);
  };

  const handleQuizAnswer = (questionIndex, option) => {
    setQuizAnswers(prev => ({
        ...prev,
        [questionIndex]: option
    }));
  };

  const handleQuizSubmit = async () => {
    const questions = currentQuiz.questions;
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.answer) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 55;
    
    setQuizResult({
        score,
        passed,
        total: questions.length,
        correct: correctCount
    });

    if (passed) {
        // Mark quiz as completed in backend
        const user = auth.currentUser;
        if (user) {
            try {
                const quizKey = `quiz-${currentQuiz.sectionId}`;
                // Optimistic update
                setCompletedLectures(prev => ({ ...prev, [quizKey]: true }));
                
                const res = await apiFetch('/api/student/progress/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        courseId,
                        lectureId: quizKey, // Using quiz key as lecture ID
                        completed: true
                    })
                });
                
                const data = await res.json();
                if (data.ok && data.certificate) {
                    setCompletedLectures(prev => ({ ...prev, certificate: data.certificate }));
                }
            } catch (err) {
                console.error("Error saving quiz progress:", err);
            }
        }
    }
  };

  // Navigation helpers
  const getNextLecture = () => {
    if (!course || !currentLecture) return null;
    
    // Flatten all lectures
    let allLectures = [];
    course.lectures.forEach(section => {
      if (section.lectures) {
        allLectures = [...allLectures, ...section.lectures];
      } else {
        allLectures.push(section);
      }
    });

    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);
    if (currentIndex !== -1 && currentIndex < allLectures.length - 1) {
      return allLectures[currentIndex + 1];
    }
    return null;
  };

  const getPrevLecture = () => {
    if (!course || !currentLecture) return null;
    
    let allLectures = [];
    course.lectures.forEach(section => {
      if (section.lectures) {
        allLectures = [...allLectures, ...section.lectures];
      } else {
        allLectures.push(section);
      }
    });

    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);
    if (currentIndex > 0) {
      return allLectures[currentIndex - 1];
    }
    return null;
  };

  const calculateProgress = () => {
    if (!course || !course.lectures) return 0;
    
    let totalLectures = 0;
    course.lectures.forEach(section => {
      if (section.lectures) {
        totalLectures += section.lectures.length;
      } else {
        totalLectures += 1;
      }
      
      // Add quiz to total to ensure certificate is only unlocked after quizzes
      if (section.quiz && section.quiz.length > 0) {
        totalLectures += 1;
      }
    });

    if (totalLectures === 0) return 0;
    const completedCount = Object.keys(completedLectures).filter(key => key !== 'certificate' && completedLectures[key]).length;
    return Math.round((completedCount / totalLectures) * 100);
  };

  // Platform logo mapping based on course title/category
  // Platform logo mapping based on course.companyLogo field set by admin
  const getPlatformLogos = (course) => {
    const companyLogo = course.companyLogo;
    
    // If admin selected a specific company logo, use that
    if (companyLogo) {
      const logoMap = {
        'uk': {
          name: 'UK',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg/200px-Flag_of_the_United_Kingdom_%281-2%29.svg.png'
        },
        'wordpress': {
          name: 'WordPress',
          logo: 'https://s.w.org/style/images/about/WordPress-logotype-wmark.png'
        },
        'adobe': {
          name: 'Adobe',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Adobe_Corporate_logo.svg/200px-Adobe_Corporate_logo.svg.png'
        },
        'shopify': {
          name: 'Shopify',
          logo: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg'
        },
        'meta': {
          name: 'Meta',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/200px-Meta_Platforms_Inc._logo.svg.png'
        },
        'youtube': {
          name: 'YouTube',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/200px-YouTube_Logo_2017.svg.png'
        },
        'tiktok': {
          name: 'TikTok',
          logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/200px-TikTok_logo.svg.png'
        }
      };
      
      const selectedLogo = logoMap[companyLogo];
      if (selectedLogo) {
        return [
          { name: 'Spark Trainings', logo: null },
          selectedLogo
        ];
      }
    }
    
    // Fallback: Auto-detect from title (for backward compatibility with old courses)
    const title = course.title.toLowerCase();
    
    // English Speaking / IELTS courses
    if (title.includes('english') || title.includes('speaking') || title.includes('ielts')) {
      return [
        { name: 'Spark Trainings', logo: null },
        { name: 'UK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg/200px-Flag_of_the_United_Kingdom_%281-2%29.svg.png' }
      ];
    }
    
    if (title.includes('web') || title.includes('wordpress') || title.includes('development')) {
      return [
        { name: 'Spark Trainings', logo: null },
        { name: 'WordPress', logo: 'https://s.w.org/style/images/about/WordPress-logotype-wmark.png' }
      ];
    }
    
    if (title.includes('graphic') || title.includes('design') || title.includes('video') || title.includes('editing') || title.includes('adobe')) {
      return [
        { name: 'Spark Trainings', logo: null },
        { name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Adobe_Corporate_logo.svg/200px-Adobe_Corporate_logo.svg.png' }
      ];
    }
    
    if (title.includes('shopify') || title.includes('ecommerce') || title.includes('e-commerce')) {
      return [
        { name: 'Spark Trainings', logo: null },
        { name: 'Shopify', logo: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg' }
      ];
    }
    
    if (title.includes('social') || title.includes('marketing') || title.includes('meta') || title.includes('facebook')) {
      return [
        { name: 'Spark Trainings', logo: null },
        { name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/200px-Meta_Platforms_Inc._logo.svg.png' }
      ];
    }
    
    if (title.includes('youtube')) {
      return [
        { name: 'Spark Trainings', logo: null },
        { name: 'YouTube', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/200px-YouTube_Logo_2017.svg.png' }
      ];
    }
    
    if (title.includes('tiktok')) {
      return [
        { name: 'Spark Trainings', logo: null },
        { name: 'TikTok', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/200px-TikTok_logo.svg.png' }
      ];
    }
    
    return [
      { name: 'Spark Trainings', logo: null }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1113] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9c06]"></div>
      </div>
    );
  }

  if (!course) return null;

  const nextLecture = getNextLecture();
  const prevLecture = getPrevLecture();
  const progress = calculateProgress();
  const platformLogos = getPlatformLogos(course);

  return (
    <div className="flex flex-col h-screen bg-[#0f1113] text-gray-100 font-sans overflow-hidden">
      {/* Header - Immersive Dark */}
      <header className="h-16 shrink-0 bg-[#0f1113]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-6 z-50 sticky top-0">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <Link 
            to="/student/dashboard" 
            className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-300 group shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          
          <div className="h-6 w-px bg-white/10 hidden md:block shrink-0"></div>

          <h1 className="text-sm rounded-md font-medium text-gray-200 truncate pr-4">
            {course.title}
          </h1>
        </div>

        <div className="flex items-center gap-4 shrink-0">
           {/* Platform Logos */}
          <div className="hidden md:flex items-center gap-3">
            {platformLogos.map((platform, index) => (
              platform.logo && (
                <img 
                  key={index}
                  src={platform.logo} 
                  alt={platform.name}
                  className="h-5 opacity-70 hover:opacity-100 transition-opacity"
                />
              )
            ))}
          </div>

          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0f1113] overflow-y-auto no-scrollbar scroll-smooth pb-20 lg:pb-0">
          
          {/* Video Player Container - Theater Mode */}
          <div className="w-full bg-[#050607] relative group py-0 lg:py-8">
            <div className="max-w-6xl mx-auto px-0 lg:px-6">
              <div className="aspect-video w-full bg-black relative overflow-hidden shadow-2xl lg:rounded-2xl lg:ring-1 lg:ring-white/10 lg:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {currentLecture && currentLecture.videoUrl ? (
                  <>
                    {currentLecture.videoUrl.includes('google.com') ? (
                      <div className="w-full h-full relative overflow-hidden rounded-2xl">
                        <iframe
                          src={(() => {
                            const url = currentLecture.videoUrl;
                            let fileId = '';
                            const patterns = [/\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /\/file\/d\/([a-zA-Z0-9_-]+)/];
                            for (let pattern of patterns) {
                              const match = url.match(pattern);
                              if (match && match[1]) { fileId = match[1]; break; }
                            }
                            return fileId ? `https://drive.google.com/file/d/${fileId}/preview?usp=sharing` : url;
                          })()}
                          style={{
                            position: 'absolute',
                            top: '-60px',
                            left: '0',
                            width: '100%',
                            height: 'calc(100% + 60px)',
                            border: '0'
                          }}
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          title={currentLecture.title}
                        />
                      </div>
                    ) : (currentLecture.videoUrl.includes('youtube.com') || currentLecture.videoUrl.includes('youtu.be') || currentLecture.videoUrl.includes('vimeo.com')) ? (
                      <div className="w-full h-full relative overflow-hidden rounded-2xl">
                        <iframe
                           src={(() => {
                             const url = currentLecture.videoUrl;
                             let videoId = '';
                             if (url.includes('youtube.com/watch')) {
                                 const urlParams = new URL(url);
                                 videoId = urlParams.searchParams.get('v');
                             } else if (url.includes('youtu.be/')) {
                                 videoId = url.split('youtu.be/')[1].split('?')[0];
                             } else if (url.includes('vimeo.com')) {
                                 const vimeoIdMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
                                 if (vimeoIdMatch && vimeoIdMatch[1]) {
                                     return `https://player.vimeo.com/video/${vimeoIdMatch[1]}?autoplay=0&title=0&byline=0&portrait=0`;
                                 }
                             }
                             
                             if (videoId) {
                                 return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`;
                             }
                             return url;
                           })()}
                           style={{
                            position: 'absolute',
                            top: '-60px',
                            left: '0',
                            width: '100%',
                            height: 'calc(100% + 60px)',
                            border: '0'
                          }}
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                           allowFullScreen
                           title={currentLecture.title}
                        />
                      </div>
                    ) : (
                      <VideoPlayer 
                        videoUrl={currentLecture.videoUrl}
                        title={currentLecture.title}
                        onEnded={() => {
                          if (!completedLectures[currentLecture.id]) {
                              handleMarkComplete();
                          }
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-[#0a0a0a]">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 animate-pulse">
                      <PlayCircle size={40} className="text-white/20" />
                    </div>
                    <p className="text-sm font-medium text-white/40">Select a lecture to start watching</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls & Info */}
          <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 lg:py-12">
            
            {/* Top Bar: Navigation & Action (Desktop Only) */}
            <div className="hidden lg:flex flex-row items-center justify-between gap-6 mb-10 pb-8 border-b border-white/5">
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                   <span className="text-[#0d9c06] text-xs font-bold tracking-widest uppercase bg-[#0d9c06]/10 px-2 py-0.5 rounded border border-[#0d9c06]/20">
                     Now Playing
                   </span>
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {currentLecture?.title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => prevLecture && handleLectureClick(prevLecture)}
                  disabled={!prevLecture}
                  className={`h-11 px-4 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    prevLecture 
                      ? 'bg-white/5 text-white hover:bg-white/10 hover:scale-105' 
                      : 'bg-transparent text-gray-600 cursor-not-allowed'
                  }`}
                  title="Previous Lecture"
                >
                  <ChevronLeft size={18} />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => nextLecture && handleLectureClick(nextLecture)}
                  disabled={!nextLecture}
                  className={`h-11 px-6 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    nextLecture 
                      ? 'bg-white text-black hover:bg-gray-200 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                  title="Next Lecture"
                >
                  <span>Next</span>
                  <ChevronRight size={18} />
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <button
                  onClick={handleMarkComplete}
                  className={`h-11 px-6 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg transform active:scale-95 ${
                    completedLectures[currentLecture?.id]
                      ? 'bg-green-500/10 text-green-500 border border-green-500/50'
                      : 'bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white hover:shadow-[#0d9c06]/20'
                  }`}
                >
                  {completedLectures[currentLecture?.id] ? (
                    <>
                      <CheckCircle size={18} />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 mr-1"></div>
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>

             {/* Mobile Title */}
             <div className="lg:hidden mb-6">
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[#0d9c06] text-[10px] font-bold tracking-widest uppercase bg-[#0d9c06]/10 px-2 py-0.5 rounded border border-[#0d9c06]/20">
                     Now Playing
                   </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {currentLecture?.title}
                </h2>
             </div>

            {/* Description & Resources Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
               {/* Lecture Details */}
               <div className="lg:col-span-2 space-y-8">
                 <div>
                   <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                     About this Class
                   </h3>
                   <div className="prose prose-invert prose-p:text-gray-400 prose-a:text-[#0d9c06] max-w-none leading-relaxed text-sm md:text-base">
                     <p>{currentLecture?.description || "No description provided for this lecture."}</p>
                   </div>
                 </div>

                 {/* Lecture Resources */}
                 {currentLecture?.resources && currentLecture.resources.length > 0 && (
                   <div className="bg-[#161b22] rounded-xl p-5 border border-white/5">
                     <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                       <Download size={16} className="text-[#0d9c06]" />
                       Downloadable Resources
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {currentLecture.resources.map((res, i) => (
                         <a 
                           key={i}
                           href={res.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 hover:scale-[1.02] transition-all group border border-transparent hover:border-[#0d9c06]/30"
                         >
                           <div className="p-2 bg-[#0d9c06]/20 text-[#0d9c06] rounded-md">
                             <FileText size={18} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">{res.title}</p>
                             <span className="text-[10px] text-gray-500 uppercase tracking-wider">Download</span>
                           </div>
                           <Download size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                         </a>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Section Quiz Prompt */}
                 {(() => {
                    const sectionIndex = course.lectures.findIndex(sec => 
                        sec.lectures && sec.lectures.some(l => l.id === currentLecture?.id)
                    );
                    if (sectionIndex !== -1) {
                        const section = course.lectures[sectionIndex];
                        const isLastLecture = section.lectures[section.lectures.length - 1].id === currentLecture?.id;
                        if (isLastLecture && section.quiz && section.quiz.length > 0) {
                            const quizKey = `quiz-${section.id}`;
                            const isPassed = completedLectures[quizKey];
                            return (
                                <div className="mt-8 bg-linear-to-br from-[#0d9c06]/10 to-transparent border border-[#0d9c06]/20 rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                       <HelpCircle size={100} className="text-[#0d9c06]" />
                                    </div>
                                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                       <div className="w-16 h-16 rounded-full bg-[#0d9c06] flex items-center justify-center text-white shadow-lg shadow-[#0d9c06]/30 shrink-0">
                                          {isPassed ? <CheckCircle size={32} /> : <HelpCircle size={32} />}
                                       </div>
                                       <div className="flex-1">
                                          <h3 className="text-xl font-bold text-white mb-2">
                                             {isPassed ? "Section Quiz Completed" : "Ready for a Quiz?"}
                                          </h3>
                                          <p className="text-gray-400 text-sm mb-4 max-w-lg">
                                             {isPassed 
                                                 ? "Great job! You've mastered this section. Feel free to review or continue to the next topic." 
                                                 : "Test your knowledge to unlock the next section. You need 55% to pass."}
                                          </p>
                                          <button
                                              onClick={() => handleStartQuiz(section)}
                                              className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
                                          >
                                              {isPassed ? "Retake Quiz" : "Start Quiz"}
                                          </button>
                                       </div>
                                    </div>
                                </div>
                            );
                        }
                    }
                    return null;
                 })()}
               </div>

               {/* Right Column: Other Info */}
               <div className="space-y-6">
                 {/* Course Resources Card */}
                 {course.resources && course.resources.length > 0 && (
                   <div className="bg-[#161b22] rounded-xl p-5 border border-white/5 lg:sticky lg:top-8">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Course Files</h3>
                     <div className="space-y-3">
                       {course.resources.map((res, i) => (
                         <a 
                           key={i}
                           href={res.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-[#0d9c06]/10 border border-white/5 hover:border-[#0d9c06]/30 transition-all group"
                         >
                            <FileText size={16} className="text-gray-500 group-hover:text-[#0d9c06]" />
                            <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1">{res.title}</span>
                            <Download size={14} className="text-gray-600 group-hover:text-white" />
                         </a>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </main>
        
        {/* Mobile Fixed Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 h-16 bg-[#161b22]/90 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between px-2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <button
                onClick={() => prevLecture && handleLectureClick(prevLecture)}
                disabled={!prevLecture}
                className={`p-3 rounded-full transition-colors ${!prevLecture ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onClick={handleMarkComplete}
                className={`flex-1 mx-2 h-10 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    completedLectures[currentLecture?.id]
                      ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                      : 'bg-[#0d9c06] text-white shadow-lg shadow-[#0d9c06]/30'
                  }`}
            >
               {completedLectures[currentLecture?.id] ? (
                  <>
                    <CheckCircle size={16} />
                    <span>Done</span>
                  </>
               ) : (
                  <span>Mark Complete</span>
               )}
            </button>

            <button
                onClick={() => nextLecture && handleLectureClick(nextLecture)}
                 disabled={!nextLecture}
                 className={`p-3 rounded-full transition-colors ${!nextLecture ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
                <ChevronRight size={24} />
            </button>
        </div>

        {/* Sidebar - Drawer Style on Mobile */}
        <div 
           className={`
             fixed inset-0 bg-black/80 z-40 lg:hidden transition-opacity duration-300
             ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
           `}
           onClick={() => setSidebarOpen(false)}
        />
        
        <aside 
          className={`
            fixed inset-y-0 right-0 w-[85vw] max-w-sm lg:w-96 bg-[#161b22] border-l border-white/5 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-2xl lg:relative lg:translate-x-0 flex flex-col
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 lg:hidden">
            <span className="text-white font-bold">Course Content</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Tabs */}
          <div className="flex border-b border-white/5">
             <button 
               onClick={() => setActiveTab('curriculum')}
               className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'curriculum' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Curriculum
               {activeTab === 'curriculum' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d9c06] shadow-[0_-2px_8px_rgba(13,156,6,0.5)]"></div>}
             </button>
             <button 
               onClick={() => setActiveTab('resources')}
               className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'resources' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Resources
               {activeTab === 'resources' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d9c06] shadow-[0_-2px_8px_rgba(13,156,6,0.5)]"></div>}
             </button>
          </div>

          {/* Progress Area */}
          <div className="p-6 border-b border-white/5 bg-[#1c2128]">
             <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Progress</span>
                <span className="text-sm font-bold text-[#0d9c06]">{progress}%</span>
             </div>
             <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#0d9c06] h-full rounded-full shadow-[0_0_10px_rgba(13,156,6,0.5)] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
             </div>
             {progress >= 100 && (
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="mt-4 w-full py-2 bg-[#0d9c06]/10 text-[#0d9c06] border border-[#0d9c06]/20 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-[#0d9c06] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Award size={14} />
                  Get Certificate
                </button>
             )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
             {activeTab === 'curriculum' ? (
                <div className="divide-y divide-white/5">
                   {course.lectures?.map((section, idx) => (
                      <div key={section.id || idx} className="bg-[#161b22]">
                         {section.lectures ? (
                            <>
                               <button 
                                  onClick={() => toggleSection(section.id)}
                                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#1c2128] transition-colors group"
                               >
                                  <div className="text-left flex-1 min-w-0 pr-4">
                                     <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate">{section.title}</h4>
                                     <p className="text-[11px] text-gray-500 mt-0.5">{section.lectures.length} lessons</p>
                                  </div>
                                  <div className={`p-1 rounded-full text-gray-500 transition-transform duration-200 ${expandedSections[section.id] ? 'rotate-180 bg-white/5' : ''}`}>
                                     <ChevronDown size={14} />
                                  </div>
                               </button>

                               {expandedSections[section.id] && (
                                  <div className="bg-[#0d1117] border-y border-black/20">
                                     {section.lectures.map((lecture) => {
                                        const isActive = currentLecture?.id === lecture.id;
                                        const isCompleted = completedLectures[lecture.id];
                                        const isLocked = isSectionLocked(idx);

                                        return (
                                           <button
                                              key={lecture.id}
                                              onClick={() => handleLectureClick(lecture, idx)}
                                              disabled={isLocked}
                                              className={`w-full flex items-start gap-4 px-5 py-3 hover:bg-[#161b22] transition-colors relative group/item ${isActive ? 'bg-[#1c2128]' : ''}`}
                                           >
                                              {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0d9c06] shadow-[0_0_8px_#0d9c06]"></div>}
                                              
                                              <div className="mt-0.5 shrink-0">
                                                 {isLocked ? (
                                                    <Lock size={14} className="text-gray-600" />
                                                 ) : isCompleted ? (
                                                    <CheckCircle size={14} className="text-[#0d9c06]" />
                                                 ) : isActive ? (
                                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0d9c06] flex items-center justify-center">
                                                       <div className="w-1.5 h-1.5 rounded-full bg-[#0d9c06] animate-pulse"></div>
                                                    </div>
                                                 ) : (
                                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-600 group-hover/item:border-gray-400"></div>
                                                 )}
                                              </div>

                                              <div className="flex-1 min-w-0 text-left">
                                                 <p className={`text-sm leading-snug mb-1 ${isActive ? 'text-[#0d9c06] font-medium' : isCompleted ? 'text-gray-400' : 'text-gray-300'}`}>
                                                    {lecture.title}
                                                 </p>
                                                 <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                                    <PlayCircle size={10} />
                                                    {lecture.duration}
                                                 </div>
                                              </div>
                                           </button>
                                        );
                                     })}
                                  </div>
                               )}
                            </>
                         ) : (
                            <div className="p-4 text-gray-500 italic text-sm text-center">Empty Section</div>
                         )}
                      </div>
                   ))}
                </div>
             ) : (
                <div className="p-6 text-center">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Download size={24} className="text-gray-500" />
                   </div>
                   <h3 className="text-gray-300 font-medium mb-2">Resource Library</h3>
                   <p className="text-sm text-gray-500">
                      All downloadable files for this course will appear here. You can also find lesson-specific files below the video player.
                   </p>
                </div>
             )}
          </div>
        </aside>
      </div>

      {/* Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-[#0d9c06]/10 to-transparent -z-10"></div>
            
            <div className="w-24 h-24 bg-[#0d9c06]/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-[#0d9c06]/30 shadow-[0_0_30px_rgba(13,156,6,0.3)] animate-bounce">
              <span className="text-4xl">{showBadgeModal.icon}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1">Badge Unlocked!</h2>
            <h3 className="text-lg font-medium text-[#0d9c06] mb-4">{showBadgeModal.name}</h3>
            
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              Congratulations! You've earned this badge for your progress. Keep up the great work!
            </p>
            
            <button
              onClick={() => setShowBadgeModal(null)}
              className="w-full py-3 bg-[#0d9c06] text-white rounded-lg font-bold hover:bg-[#0b7e05] shadow-lg shadow-[#0d9c06]/20 transition-all active:scale-95"
            >
              Collect Badge
            </button>
          </div>
        </div>
      )}

      {/* Quiz Modal & Certificate Modal placeholders (Styled similarly to dark theme if needed, but keeping functional logic) */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-900">
             {/* Header */}
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">
                  {quizResult ? "Quiz Result" : "Section Quiz"}
                </h2>
                <button onClick={() => setShowQuizModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
             </div>
             
             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {quizResult ? (
                   <div className="text-center py-4">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${quizResult.passed ? 'bg-green-100 text-[#0d9c06] ring-8 ring-green-50' : 'bg-red-100 text-red-600 ring-8 ring-red-50'}`}>
                         {quizResult.passed ? <ShieldCheck size={40} /> : <AlertCircle size={40} />}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{quizResult.passed ? "Excellent Job!" : "Keep Trying!"}</h3>
                      <p className="text-gray-600 mb-8">You scored <span className="font-bold text-gray-900">{quizResult.score}%</span> ({quizResult.correct} / {quizResult.total} correct).</p>
                      
                      {quizResult.passed ? (
                         <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-800 text-sm mb-6 max-w-md mx-auto">
                            You have passed this section! The next section is now unlocked.
                         </div>
                      ) : (
                         <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-800 text-sm mb-6 max-w-md mx-auto">
                            You need 55% to pass. Please review the material and try again.
                         </div>
                      )}
                      
                      <div className="mt-8 flex justify-center gap-4">
                         {!quizResult.passed && (
                            <button 
                               onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                               className="px-6 py-2.5 bg-[#0d9c06] text-white rounded-lg font-bold hover:bg-[#0b7e05] transition-colors shadow-lg hover:shadow-xl"
                            >
                               Try Again
                            </button>
                         )}
                         <button 
                            onClick={() => setShowQuizModal(false)}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                         >
                            Close
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="space-y-8">
                      {currentQuiz.questions.map((q, idx) => (
                         <div key={idx} className="bg-white p-0 rounded-lg">
                            <p className="font-semibold text-lg text-gray-900 mb-6 flex gap-3">
                               <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-sm shrink-0 font-bold">{idx + 1}</span>
                               {q.question}
                            </p>
                            <div className="space-y-3 pl-11">
                               {q.options.map((opt, optIdx) => (
                                  <label key={optIdx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${quizAnswers[idx] === opt ? 'border-[#0d9c06] bg-[#0d9c06]/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${quizAnswers[idx] === opt ? 'border-[#0d9c06] bg-white' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                        {quizAnswers[idx] === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#0d9c06]" />}
                                     </div>
                                     <input 
                                        type="radio" 
                                        name={`q-${idx}`} 
                                        className="hidden" 
                                        checked={quizAnswers[idx] === opt}
                                        onChange={() => handleQuizAnswer(idx, opt)}
                                     />
                                     <span className={`${quizAnswers[idx] === opt ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                        {opt}
                                     </span>
                                  </label>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
             
             {/* Footer */}
             {!quizResult && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                   <button 
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < currentQuiz.questions.length}
                      className="px-8 py-3 bg-[#0d9c06] text-white rounded-lg font-bold hover:bg-[#0b7e05] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                   >
                      Submit Answers
                   </button>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
               <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-[#0d9c06]" />
                  Your Certificate
               </h2>
               <button 
                onClick={() => setShowCertificateModal(false)}
                className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
               >
                <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-gray-50">
              {course.certificateTemplate ? (
                <div className="relative shadow-2xl max-w-full rounded-lg overflow-hidden ring-1 ring-gray-200">
                  <CertificateCanvas 
                    templateUrl={course.certificateTemplate}
                    studentName={auth.currentUser?.displayName || "Student Name"}
                    courseTitle={course.title}
                    regNo={completedLectures.certificate?.regNo || "Generating..."}
                    issueDate={completedLectures.certificate?.issueDate}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full max-w-3xl bg-white rounded-xl flex flex-col items-center justify-center text-gray-500 shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <ShieldCheck size={40} className="text-gray-300" />
                  </div>
                  <p className="font-medium">Certificate template is being prepared.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
              <button 
                  onClick={() => setShowCertificateModal(false)}
                  className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
              </button>
              <button 
                onClick={() => {
                  const canvas = document.getElementById('certificate-canvas');
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = `Certificate-${course.title}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}
                className={`px-8 py-2.5 bg-[#0d9c06] text-white rounded-lg font-bold hover:bg-[#0b7e05] shadow-lg shadow-[#0d9c06]/20 transition-all flex items-center gap-2 ${!course.certificateTemplate ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Download size={18} />
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CertificateCanvas({ templateUrl, studentName, courseTitle, regNo, issueDate }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = templateUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw Template
      ctx.drawImage(img, 0, 0);

      // Configure Text Styles
      ctx.textAlign = 'center';
      
      // Draw Student Name
      ctx.font = 'bold 70px "Outfit", sans-serif';
      
      // Color Logic: Skin Care gets Gold (previous style), others get Brand Green
      const isSkinCare = courseTitle && courseTitle.toLowerCase().includes('skin');
      ctx.fillStyle = isSkinCare ? '#C5A059' : '#0d9c06';
      
      // Position: Just above the line (adjusted to +15 from center based on feedback)
      ctx.fillText(studentName, canvas.width / 2, canvas.height / 2 + 15);

      // Draw Course Title (Optional, if not on template)
      // ctx.font = '40px "Outfit", sans-serif';
      // ctx.fillText(courseTitle, canvas.width / 2, canvas.height / 2 + 60);

      // Draw Registration Number (Removed as per request)
      // Draw Registration Number
      if (regNo) {
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.fillStyle = '#4b5563'; // Gray-600
        ctx.textAlign = 'right';
        // Position at Top Right
        ctx.fillText(`Reference No: ${regNo}`, canvas.width - 60, 80);
      }

      // Draw Date - HIDDEN
      /*
      if (issueDate) {
        const dateStr = new Date(issueDate).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
        ctx.textAlign = 'right';
        ctx.fillText(`Date: ${dateStr}`, canvas.width - 100, canvas.height - 100);
      }
      */
    };
  }, [templateUrl, studentName, courseTitle, regNo, issueDate]);

  return <canvas id="certificate-canvas" ref={canvasRef} className="w-full rounded-md shadow-inner" style={{ maxWidth: '100%', height: 'auto' }} />;
}
