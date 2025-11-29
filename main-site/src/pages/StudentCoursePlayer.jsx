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
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../config';
import { auth } from '../firebaseConfig';

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
      if (data.ok && data.newBadges && data.newBadges.length > 0) {
        setShowBadgeModal(data.newBadges[0]); // Show first new badge
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

  const handleLectureClick = (lecture) => {
    setCurrentLecture(lecture);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
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
    });

    if (totalLectures === 0) return 0;

    const completedCount = Object.values(completedLectures).filter(Boolean).length;
    return Math.round((completedCount / totalLectures) * 100);
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white text-gray-900 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link to="/student/dashboard" className="hover:text-[#0d9c06] transition-colors p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </Link>
          <div className="border-l border-gray-300 pl-4 h-8 flex items-center">
            <h1 className="text-base md:text-lg font-bold truncate max-w-[200px] md:max-w-md text-gray-800">
              {course.title}
            </h1>
          </div>
        </div>
        <button 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-gray-700"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content (Video) */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          <div className="w-full bg-black">
            <div className="max-w-6xl mx-auto aspect-video bg-black shadow-2xl">
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
                      // Handle Google Drive URLs
                      if (url.includes('drive.google.com')) {
                        // Extract File ID and convert to preview URL
                        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (fileIdMatch && fileIdMatch[1]) {
                          return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
                        }
                        const idParamMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
                        if (idParamMatch && idParamMatch[1]) {
                          return `https://drive.google.com/file/d/${idParamMatch[1]}/preview`;
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
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Select a lecture to start watching
                </div>
              )}
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto w-full px-4 py-6 md:px-8">
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  nextLecture 
                    ? 'bg-white text-[#0d9c06] border border-[#0d9c06] hover:bg-green-50 shadow-sm hover:shadow-md' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                Next Lecture
                <ChevronRight size={20} />
              </button>
            </div>
            
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
          style={{ top: '64px', height: 'calc(100vh - 64px)' }}
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
            
            {progress === 100 && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="w-full py-2 bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white rounded-lg font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
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
              className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${
                activeTab === 'curriculum' 
                  ? 'text-[#0d9c06] border-b-2 border-[#0d9c06] bg-green-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Curriculum
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${
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
                              onClick={() => handleLectureClick(lecture)}
                              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-100 transition-all text-left border-l-[3px] ${
                                currentLecture?.id === lecture.id 
                                  ? 'border-[#0d9c06] bg-green-50/60' 
                                  : 'border-transparent'
                              }`}
                            >
                              <div className="mt-0.5">
                                {currentLecture?.id === lecture.id ? (
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
                                  <PlayCircle size={10} />
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
                      onClick={() => handleLectureClick(section)}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center transform scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
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
              className="w-full py-3 bg-[#0d9c06] text-white rounded-xl font-bold hover:bg-[#0b7e05] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
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
                <div className="aspect-video w-full max-w-3xl bg-white rounded-lg flex flex-col items-center justify-center text-gray-500 shadow-sm">
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
                className={`px-8 py-3 bg-[#0d9c06] text-white rounded-lg font-bold hover:bg-[#0b7e05] shadow-lg transition-colors flex items-center gap-2 cursor-pointer ${!course.certificateTemplate ? 'opacity-50 pointer-events-none' : ''}`}
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
      ctx.font = 'bold 60px "Outfit", sans-serif';
      ctx.fillStyle = '#1f2937'; // Gray-800
      ctx.fillText(studentName, canvas.width / 2, canvas.height / 2 - 60);

      // Draw Course Title (Optional, if not on template)
      // ctx.font = '40px "Outfit", sans-serif';
      // ctx.fillText(courseTitle, canvas.width / 2, canvas.height / 2 + 60);

      // Draw Registration Number (Removed as per request)
      /*
      if (regNo) {
        ctx.font = '24px "Outfit", sans-serif';
        ctx.fillStyle = '#4b5563'; // Gray-600
        ctx.textAlign = 'left';
        ctx.fillText(`Reg No: ${regNo}`, 100, canvas.height - 100);
      }
      */

      // Draw Date
      if (issueDate) {
        const dateStr = new Date(issueDate).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
        ctx.textAlign = 'right';
        ctx.fillText(`Date: ${dateStr}`, canvas.width - 100, canvas.height - 100);
      }
    };
  }, [templateUrl, studentName, courseTitle, regNo, issueDate]);

  return <canvas id="certificate-canvas" ref={canvasRef} className="w-full rounded-lg shadow-inner" style={{ maxWidth: '100%', height: 'auto' }} />;
}
