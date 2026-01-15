import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../config';
import { auth } from '../firebaseConfig';
import SparkLogo from '../assets/Logo.png';

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
    if (sectionIndex === 0) return false;
    
    // Check previous sections
    for (let i = 0; i < sectionIndex; i++) {
        const prevSection = course.lectures[i];
        if (prevSection.quiz && prevSection.quiz.length > 0) {
            const quizKey = `quiz-${prevSection.id}`;
            if (!completedLectures[quizKey]) {
                return true;
            }
        }
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white text-gray-900 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link to="/student/dashboard" className="hover:text-[#0d9c06] transition-colors p-2 rounded-full hover:bg-gray-100 cursor-pointer">
            <ArrowLeft size={20} />
          </Link>
          
          {/* Platform Logos - Coursera + Meta Style */}
          <div className="flex items-center gap-2 pl-4">
            {platformLogos.map((platform, index) => (
              <React.Fragment key={platform.name}>
                {platform.logo ? (
                  <img 
                    src={platform.logo} 
                    alt={platform.name}
                    className="h-6 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <img 
                    src={SparkLogo} 
                    alt="Spark Trainings"
                    className="h-12 object-contain"
                  />
                )}
                {index < platformLogos.length - 1 && (
                  <div className="h-8 border-l border-gray-300 mx-3"></div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="hidden md:block border-l border-gray-300 pl-4 h-8 flex items-center">
            <h1 className="text-base md:text-lg font-bold truncate max-w-[200px] md:max-w-md text-gray-800">
              {course.title}
            </h1>
          </div>
        </div>
        <button 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-gray-700 cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content (Video) */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Video Player Container with Padding and Rounded Corners */}
          <div className="w-full bg-white py-6 px-6">
            <div className="max-w-6xl mx-auto aspect-video bg-black rounded-md overflow-hidden shadow-lg">
              {currentLecture ? (
                currentLecture.videoUrl && (currentLecture.videoUrl.endsWith('.mp4') || currentLecture.videoUrl.includes('/uploads/videos/')) ? (
                  <video
                    src={currentLecture.videoUrl}
                    className="w-full h-full"
                    controls
                    autoPlay
                    onEnded={() => {
                      if (!completedLectures[currentLecture.id]) {
                        handleMarkComplete();
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <iframe 
                    src={(() => {
                      const url = currentLecture.videoUrl;
                      if (!url) return '';
                      
                      // Handle YouTube URLs
                      if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        let videoId = '';
                        if (url.includes('youtube.com/watch')) {
                          const urlParams = new URLSearchParams(new URL(url).search);
                          videoId = urlParams.get('v');
                        } else if (url.includes('youtu.be/')) {
                          videoId = url.split('youtu.be/')[1].split('?')[0];
                        }
                        if (videoId) {
                          return `https://www.youtube.com/embed/${videoId}`;
                        }
                      }
                      
                      // Handle Google Drive URLs
                      if (url.includes('drive.google.com')) {
                        // Extract File ID from various Google Drive URL formats
                        let fileId = '';
                        
                        // Format: https://drive.google.com/file/d/FILE_ID/view
                        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (fileIdMatch && fileIdMatch[1]) {
                          fileId = fileIdMatch[1];
                        }
                        
                        // Format: https://drive.google.com/open?id=FILE_ID
                        const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                        if (idParamMatch && idParamMatch[1]) {
                          fileId = idParamMatch[1];
                        }
                        
                        if (fileId) {
                          // Use the embed URL which works better for shared files
                          return `https://drive.google.com/file/d/${fileId}/preview`;
                        }
                      }
                      
                      return url;
                    })()} 
                    title={currentLecture.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8">
                  <p className="text-lg mb-2">Select a lecture to start watching</p>
                  <p className="text-sm text-gray-400">Choose a lecture from the sidebar</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto w-full px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentLecture?.title}
              </h2>
              <button
                onClick={handleMarkComplete}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                  completedLectures[currentLecture?.id]
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-[#0d9c06] text-white hover:bg-[#0b7e05]'
                }`}
              >
                {completedLectures[currentLecture?.id] ? (
                  <>
                    <CheckCircle size={20} />
                    Completed
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/80"></div>
                    Mark as Complete
                  </>
                )}
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-8">
              <button
                onClick={() => prevLecture && handleLectureClick(prevLecture)}
                disabled={!prevLecture}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all ${
                  prevLecture 
                    ? 'text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400' 
                    : 'text-gray-300 cursor-not-allowed border border-gray-100'
                }`}
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <button
                onClick={() => nextLecture && handleLectureClick(nextLecture)}
                disabled={!nextLecture}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all ${
                  nextLecture 
                    ? 'bg-white text-[#0d9c06] border border-[#0d9c06] hover:bg-green-50 shadow-sm hover:shadow-md' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                Next Lecture
                <ChevronRight size={20} />
              </button>
            </div>

            {/* End of Section Quiz Prompt */}
             {(() => {
                // Find current section
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
                            <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-8 text-center">
                                <div className="w-16 h-16 bg-green-100 text-[#0d9c06] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <HelpCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {isPassed ? "Section Quiz Completed!" : "Ready for a Challenge?"}
                                </h3>
                                <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                                    {isPassed 
                                        ? "You've already passed this section's quiz. You can retake it to improve your score." 
                                        : "Complete the quiz to verify your understanding and unlock the next section. You need 55% to pass."}
                                </p>
                                <button
                                    onClick={() => handleStartQuiz(section)}
                                    className="px-8 py-3 bg-[#0d9c06] text-white rounded-md font-bold hover:bg-[#0b7e05] shadow-md transition-all cursor-pointer"
                                >
                                    {isPassed ? "Retake Quiz" : "Start Quiz"}
                                </button>
                            </div>
                        );
                    }
                }
                return null;
            })()}
            
            <div className="prose max-w-none">
              <h3 className="font-bold text-lg mb-4 text-gray-900">About this lecture</h3>
              <p className="text-gray-700 leading-relaxed">
                {currentLecture?.description || "No description available for this lecture."}
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar (Course Content) */}
        <aside 
          className={`
            fixed lg:relative inset-y-0 right-0 w-full lg:w-96 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 shadow-xl lg:shadow-none
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            lg:block flex flex-col
          `}
          style={{ height: 'calc(100vh - 64px)' }}
        >
          {/* Sidebar Header with Progress */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Course Progress</span>
              <span className="text-sm font-bold text-[#0d9c06]">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-[#0d9c06] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {progress >= 100 && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="w-full py-2 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white rounded-md font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <ShieldCheck size={18} />
                Collect Your Certificate
              </button>
            )}
          </div>
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-colors cursor-pointer ${
                activeTab === 'curriculum' 
                  ? 'text-[#0d9c06] border-b-2 border-[#0d9c06] bg-green-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Curriculum
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-colors cursor-pointer ${
                activeTab === 'resources' 
                  ? 'text-[#0d9c06] border-b-2 border-[#0d9c06] bg-green-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Resources
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {activeTab === 'curriculum' ? (
              <div className="pb-20">
                {course.lectures?.map((section, idx) => (
                  section.lectures ? (
                    <div key={section.id || idx} className="border-b border-gray-200 bg-white mb-2 last:mb-0">
                      <button 
                        onClick={() => toggleSection(section.id)}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-left">
                          <h4 className="font-bold text-sm text-gray-900">{section.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {section.lectures.length} lectures
                          </p>
                        </div>
                        {expandedSections[section.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {expandedSections[section.id] && (
                        <div className="bg-gray-50/50">
                          {section.lectures.map((lecture) => (
                            <button
                              key={lecture.id}
                              onClick={() => handleLectureClick(lecture, idx)}
                              className={`w-full px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-100 transition-all text-left border-l-[3px] ${
                                currentLecture?.id === lecture.id 
                                  ? 'border-[#0d9c06] bg-green-50/60' 
                                  : 'border-transparent'
                              }`}
                            >
                              <div className="mt-0.5">
                                {isSectionLocked(idx) ? (
                                    <Lock size={16} className="text-gray-400" />
                                ) : currentLecture?.id === lecture.id ? (
                                   <PlayCircle size={16} className="text-[#0d9c06]" />
                                ) : (
                                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${completedLectures[lecture.id] ? 'bg-[#0d9c06] border-[#0d9c06]' : 'border-gray-400'}`}>
                                     {completedLectures[lecture.id] && <CheckCircle size={10} className="text-white" />}
                                   </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${currentLecture?.id === lecture.id ? 'font-semibold text-[#0d9c06]' : 'text-gray-700'}`}>
                                  {lecture.title}
                                </p>
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  {isSectionLocked(idx) ? <Lock size={10} /> : <PlayCircle size={10} />}
                                  {lecture.duration}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      key={section.id}
                      onClick={() => handleLectureClick(section, idx)}
                      className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-all text-left border-l-[3px] border-b border-gray-100 bg-white ${
                        currentLecture?.id === section.id 
                          ? 'border-l-[#0d9c06] bg-green-50/60' 
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="mt-0.5">
                        <PlayCircle size={16} className={currentLecture?.id === section.id ? "text-[#0d9c06]" : "text-gray-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${currentLecture?.id === section.id ? 'font-semibold text-[#0d9c06]' : 'text-gray-700'}`}>
                          {section.title}
                        </p>
                      </div>
                    </button>
                  )
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="text-gray-400" size={32} />
                </div>
                <h3 className="text-gray-900 font-bold mb-2">No Resources Yet</h3>
                <p className="text-gray-500 text-sm">
                  There are no downloadable resources available for this course yet.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
      {/* Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-md shadow-2xl max-w-sm w-full p-8 text-center transform scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            {/* Confetti/Background Effect */}
            <div className="absolute inset-0 bg-linear-to-b from-yellow-50 to-white -z-10"></div>
            
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-inner animate-bounce">
              {showBadgeModal.icon}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Badge Unlocked!</h2>
            <h3 className="text-xl font-bold text-[#0d9c06] mb-4">{showBadgeModal.name}</h3>
            
            <p className="text-gray-600 mb-8">
              Congratulations! You've earned this badge for your progress. Keep up the great work!
            </p>
            
            <button
              onClick={() => setShowBadgeModal(null)}
              className="w-full py-3 bg-[#0d9c06] text-white rounded-md font-bold hover:bg-[#0b7e05] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
             {/* Header */}
             <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">
                  {quizResult ? "Quiz Result" : "Section Quiz"}
                </h2>
                <button onClick={() => setShowQuizModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
             </div>
             
             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6">
                {quizResult ? (
                   <div className="text-center py-8">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${quizResult.passed ? 'bg-green-100 text-[#0d9c06]' : 'bg-red-100 text-red-600'}`}>
                         {quizResult.passed ? <ShieldCheck size={48} /> : <AlertCircle size={48} />}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{quizResult.passed ? "Congratulations!" : "Keep Trying!"}</h3>
                      <p className="text-gray-600 mb-6">You scored <span className="font-bold text-gray-900">{quizResult.score}%</span> ({quizResult.correct} / {quizResult.total} correct).</p>
                      
                      {quizResult.passed ? (
                         <div className="p-4 bg-green-50 rounded-md border border-green-200 text-green-800 text-sm">
                            You have passed this section! The next section is now unlocked.
                         </div>
                      ) : (
                         <div className="p-4 bg-red-50 rounded-md border border-red-200 text-red-800 text-sm">
                            You need 55% to pass. Please review the material and try again.
                         </div>
                      )}
                      
                      <div className="mt-8 flex justify-center gap-4">
                         {!quizResult.passed && (
                            <button 
                               onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                               className="px-6 py-2 bg-[#0d9c06] text-white rounded-md font-bold hover:bg-[#0b7e05] transition-colors cursor-pointer"
                            >
                               Try Again
                            </button>
                         )}
                         <button 
                            onClick={() => setShowQuizModal(false)}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-bold hover:bg-gray-300 transition-colors cursor-pointer"
                         >
                            Close
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="space-y-8">
                      {currentQuiz.questions.map((q, idx) => (
                         <div key={idx} className="bg-gray-50 p-6 rounded-md border border-gray-200">
                            <p className="font-semibold text-gray-900 mb-4 flex gap-3">
                               <span className="text-[#0d9c06]">{idx + 1}.</span>
                               {q.question}
                            </p>
                            <div className="space-y-3 pl-6">
                               {q.options.map((opt, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-3 cursor-pointer group">
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${quizAnswers[idx] === opt ? 'border-[#0d9c06] bg-white' : 'border-gray-400 group-hover:border-gray-500'}`}>
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
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                   <button 
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < currentQuiz.questions.length}
                      className="px-8 py-3 bg-[#0d9c06] text-white rounded-md font-bold hover:bg-[#0b7e05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-md shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
              {course.certificateTemplate ? (
                <div className="relative shadow-lg max-w-full">
                  <CertificateCanvas 
                    templateUrl={course.certificateTemplate}
                    studentName={auth.currentUser?.displayName || "Student Name"}
                    courseTitle={course.title}
                    regNo={completedLectures.certificate?.regNo || "Generating..."}
                    issueDate={completedLectures.certificate?.issueDate}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full max-w-3xl bg-white rounded-md flex flex-col items-center justify-center text-gray-500 shadow-sm">
                  <ShieldCheck size={64} className="mb-4 text-gray-300" />
                  <p>Certificate template not available yet.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-center">
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
                className={`px-8 py-3 bg-[#0d9c06] text-white rounded-md font-bold hover:bg-[#0b7e05] shadow-lg transition-colors flex items-center gap-2 cursor-pointer ${!course.certificateTemplate ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Download size={20} />
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
