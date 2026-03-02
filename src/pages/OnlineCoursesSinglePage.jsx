// src/pages/OnlineCoursePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Globe, CheckCircle, PlayCircle, Lock, Video, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch, API_URL } from "../config";
import VideoPlayer from "../components/VideoPlayer";
import SEO from "../components/SEO";

import { CourseDetailSkeleton } from "../components/SkeletonLoaders";
import { onlineCourses as initialOnlineCourses } from "../data/onlineCourses";

export default function OnlineCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    async function fetchCourse() {
      // 1. Instant Local Fallback
      const localCourse = initialOnlineCourses.find(c => c.id === id || c.slug === id);
      if (localCourse) {
        setCourse(localCourse);
        // Map lectures if they exist in static data (usually not, but good to have)
        if (localCourse.lectures) {
           let all = [];
           localCourse.lectures.forEach(s => s.lectures ? all = [...all, ...s.lectures] : all.push(s));
           setLectures(all);
           if (all.length > 0) setSelectedLecture({ ...all[0], isPreview: true });
        }
      } else {
        setLoading(true);
      }

      try {
        const response = await apiFetch(`/api/course/${id}`);
        const data = await response.json();
        
        if (data.ok && data.course) {
          const foundCourse = data.course;
          setCourse(foundCourse);
          
          // Flatten lectures
          let allLectures = [];
          if (foundCourse.lectures) {
            foundCourse.lectures.forEach(section => {
              if (section.lectures) {
                allLectures = [...allLectures, ...section.lectures];
              } else {
                allLectures.push(section);
              }
            });
          }
          
          setLectures(allLectures);
          
          // Auto-expand first section
          if (foundCourse.lectures && foundCourse.lectures.length > 0 && foundCourse.lectures[0].id) {
            setExpandedSections({ [foundCourse.lectures[0].id]: true });
          } else if (foundCourse.lectures && foundCourse.lectures.length > 0) {
             setExpandedSections({ 0: true });
          }
          
          // Set first lecture as preview automatically if available
          if (allLectures.length > 0) {
            const firstLec = { ...allLectures[0], isPreview: true };
            setSelectedLecture(firstLec);
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourse();
  }, [id]);

  if (loading && !course) return <CourseDetailSkeleton />;

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-2xl font-semibold">
        Online course not found 😢
      </div>
    );
  }

  const handleLectureClick = (lecture, index) => {
    // Allow clicking first lecture or any marked as preview
    // For now, let's assume only the first one is free/preview
    if (index === 0 || lecture.isPreview) {
      setSelectedLecture({ ...lecture, isPreview: true });
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // Handle YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('youtube.com/shorts/')[1].split('?')[0];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Handle Vimeo URLs
    if (url.includes('vimeo.com')) {
      const vimeoIdMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
      if (vimeoIdMatch && vimeoIdMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoIdMatch[1]}`;
      }
    }
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
      const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idParamMatch && idParamMatch[1]) {
        return `https://drive.google.com/file/d/${idParamMatch[1]}/preview`;
      }
    }
    
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  return (
    <div className="bg-[#f7f9fa] pb-16">
      <SEO 
        title={`${course.title} | Online Course`} 
        description={course.excerpt || `Master ${course.title} with our world-class online training program. Get HD recordings and lifelong access at Spark Trainings.`}
        keywords={`${course.title} online, learn ${course.title} worldwide, best online ${course.title} course`}
        canonical={`/online-course/${id}`}
        ogImage={course.image}
      />
      {/* TOP HERO */}
      <section className="bg-[#1c1d1f] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <p className="text-xs uppercase text-[#cec0fc] font-semibold mb-2">
            Online course • Spark Trainings
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {course.title}
          </h1>

          <p className="text-sm sm:text-base text-[#d1d7dc] mb-4">
            {course.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Rating */}
            <div className="flex items-center gap-1 text-[#f4c150]">
              <span className="font-semibold">{course.rating ? Number(course.rating).toFixed(1) : 4.5}</span>
              <Star size={16} fill="#f4c150" stroke="none" />
              <span className="text-[#d1d7dc]">{course.ratingCount || "0 ratings"}</span>
            </div>

            <span className="text-[#d1d7dc]">•</span>

            {/* Language */}
            <div className="flex items-center gap-1 text-[#d1d7dc]">
              <Globe size={16} />
              <span>{course.language || "Urdu / English (Online)"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT */}
        <div className="flex-1">
          {/* Video Player Section */}
          <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-1 sm:p-2 mb-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-8 bg-[#0d9c06] rounded-full"></div>
                Course Preview
              </h2>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <Video size={16} />
                <span>{lectures.length} lectures</span>
              </div>
            </div>
            
            <div className="p-2 sm:p-4 pt-0">
              {selectedLecture ? (
                <div className="w-full max-w-[900px] mx-auto aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                  {selectedLecture.videoUrl && (selectedLecture.videoUrl.includes('drive.google.com') || selectedLecture.videoUrl.includes('youtube') || selectedLecture.videoUrl.includes('vimeo')) ? (
                    <div className="w-full h-full relative overflow-hidden rounded-2xl">
                      <iframe 
                        src={getEmbedUrl(selectedLecture.videoUrl)} 
                        title={selectedLecture.title}
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
                      ></iframe>
                    </div>
                  ) : (
                    <VideoPlayer 
                      videoUrl={selectedLecture.videoUrl} 
                      poster={course.image}
                      title={selectedLecture.title}
                      isPreview={true}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full max-w-[900px] mx-auto aspect-video bg-linear-to-br from-[#1c1d1f] to-[#2d2e30] rounded-2xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                      <PlayCircle size={40} className="text-white/50" />
                    </div>
                    <p className="text-lg font-semibold mb-1">No lectures available</p>
                    <p className="text-sm text-white/40">Select a lecture to start watching</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Course Curriculum */}
          <section className="bg-white rounded-md shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Course Curriculum</h2>
            <div className="space-y-3">
              {course.lectures && course.lectures.length > 0 ? (
                course.lectures.map((item, sIdx) => {
                   const isSection = item.lectures && Array.isArray(item.lectures);
                   const sectionId = item.id || sIdx;
                   const isExpanded = expandedSections[sectionId];

                   if (isSection) {
                     return (
                       <div key={sectionId} className="border border-gray-100 rounded-lg overflow-hidden">
                         <button 
                           onClick={() => toggleSection(sectionId)}
                           className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                         >
                           <div className="flex items-center gap-3">
                             {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                             <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                               {item.title}
                             </h3>
                           </div>
                           <span className="text-xs text-gray-500 font-medium">
                             {item.lectures.length} lectures
                           </span>
                         </button>
                         
                         {isExpanded && (
                           <div className="divide-y divide-gray-50 bg-white">
                             {item.lectures.map((lecture, lIdx) => {
                               // Find global index for preview logic
                               const globalIndex = lectures.findIndex(l => l.id === lecture.id);
                               const isPreview = globalIndex === 0 || lecture.isPreview;
                               const isSelected = selectedLecture?.id === lecture.id;

                               return (
                                 <div
                                   key={lecture.id || lIdx}
                                   onClick={() => handleLectureClick(lecture, globalIndex)}
                                   className={`flex items-center justify-between p-4 pl-10 transition-all ${
                                     isPreview
                                       ? 'hover:bg-[#0d9c06]/5 cursor-pointer'
                                       : 'bg-gray-50/30 cursor-not-allowed opacity-80'
                                   } ${isSelected ? 'bg-[#0d9c06]/10 ring-1 ring-inset ring-[#0d9c06]/30' : ''}`}
                                 >
                                   <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                     <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                                       isPreview ? 'bg-[#0d9c06]/10 text-[#0d9c06]' : 'bg-gray-200 text-gray-400'
                                     }`}>
                                       {isPreview ? <PlayCircle size={14} /> : <Lock size={14} />}
                                     </div>
                                     <div className="flex-1 truncate">
                                       <h4 className={`text-sm ${isSelected ? 'font-bold text-[#0d9c06]' : 'text-gray-700'}`}>
                                         {lecture.title}
                                       </h4>
                                       {isPreview && !isSelected && (
                                         <span className="text-[10px] text-[#0d9c06] font-bold uppercase tracking-wider">Preview Available</span>
                                       )}
                                       {isSelected && (
                                         <span className="text-[10px] text-[#0d9c06] font-bold uppercase tracking-wider">Currently Watching</span>
                                       )}
                                     </div>
                                   </div>
                                   <span className="text-xs text-gray-500 tabular-nums ml-4">{lecture.duration || "10:00"}</span>
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     );
                   } else {
                     // Standalone lecture
                     const globalIndex = lectures.findIndex(l => l.id === item.id);
                     const isPreview = globalIndex === 0 || item.isPreview;
                     const isSelected = selectedLecture?.id === item.id;

                     return (
                       <div
                         key={item.id}
                         onClick={() => handleLectureClick(item, globalIndex)}
                         className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                           isPreview
                             ? 'border-gray-200 hover:border-[#0d9c06] hover:bg-[#0d9c06]/5 cursor-pointer'
                             : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-75'
                         } ${isSelected ? 'ring-2 ring-[#0d9c06] bg-[#0d9c06]/5' : ''}`}
                       >
                         <div className="flex items-center gap-3 flex-1">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                             isPreview ? 'bg-[#0d9c06] text-white shadow-sm' : 'bg-gray-200 text-gray-500'
                           }`}>
                             {isPreview ? <PlayCircle size={16} fill="currentColor" /> : <Lock size={16} />}
                           </div>
                           <div className="flex-1">
                             <h3 className={`font-semibold text-sm ${isSelected ? 'text-[#0d9c06]' : 'text-gray-900'}`}>
                               {item.title}
                             </h3>
                             {isPreview && (
                               <span className="text-[10px] text-[#0d9c06] font-bold uppercase tracking-wider">Preview Available</span>
                             )}
                           </div>
                         </div>
                         <span className="text-xs text-gray-500 font-medium">{item.duration || "10:00"}</span>
                       </div>
                     );
                   }
                })
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                   <p className="text-gray-500">No curriculum items available yet.</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-[#5022C3]/5 border border-[#5022C3]/10 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5022C3]/10 flex items-center justify-center shrink-0 mt-0.5">
                 <Lock size={12} className="text-[#5022C3]" />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-[#5022C3]">Unlock Course:</strong> Enroll now to get full lifetime access to all {lectures.length} lectures, downloadable resources, and start your learning journey.
              </p>
            </div>
          </section>

          {/* What you'll learn */}
          {course.whatYouWillLearn && (
            <section className="bg-white rounded-md shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">What you'll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.whatYouWillLearn.map((item, i) => (
                  <p
                    key={i}
                    className="flex items-start gap-2 text-sm text-[#1c1d1f]"
                  >
                    <CheckCircle className="text-[#0d9c06] shrink-0 mt-0.5" size={20} />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          {course.fullDescription && course.fullDescription.length > 0 && (
            <section className="bg-white rounded-md shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-3">Course description</h2>
              <div className="space-y-3 text-sm sm:text-[15px] leading-7 text-[#1c1d1f]">
                {course.fullDescription.map((paragraph, index) => (
                  <div 
                    key={index} 
                    dangerouslySetInnerHTML={{ __html: paragraph }}
                    className="course-description-content"
                  />
                ))}
              </div>
              
              <style>{`
                .course-description-content ul {
                  list-style-type: disc;
                  margin-left: 1.5rem;
                  margin-top: 0.5rem;
                  margin-bottom: 0.5rem;
                }
                
                .course-description-content ol {
                  list-style-type: decimal;
                  margin-left: 1.5rem;
                  margin-top: 0.5rem;
                  margin-bottom: 0.5rem;
                }
                
                .course-description-content li {
                  margin-bottom: 0.25rem;
                  padding-left: 0.25rem;
                }
                
                .course-description-content ul li {
                  display: list-item;
                }
                
                .course-description-content ol li {
                  display: list-item;
                }
              `}</style>
            </section>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full lg:w-80 cursor-pointer">
          <div className="bg-white rounded-md shadow-xl overflow-hidden sticky top-4">
            {/* Image */}
            <div className="w-full aspect-video overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover"
                onError={(e) => {e.target.src = "https://via.placeholder.com/300x200?text=No+Image"}}
              />
            </div>

            <div className="p-6">
              {/* Price */}
              <div className="mb-3">
                {course.price && (
                  <span className="text-2xl font-bold text-[#1c1d1f]">
                    {course.price}
                  </span>
                )}
                <p className="text-xs text-[#6a6f73] mt-1">
                  Online course • HD Recordings
                </p>
              </div>

              {/* Enroll now */}
              <Link
                to="/cart"
                state={{ addedCourseId: course.id }}
                className="
                  w-full bg-[#0d9c06] hover:bg-[#0b7e05]
                  text-white font-semibold text-sm py-3 rounded-md
                  flex items-center justify-center gap-2 transition
                 cursor-pointer"
              >
                <PlayCircle size={18} />
                Enroll now
              </Link>

              <p className="mt-2 text-[11px] text-[#6a6f73]">
                Enroll to get full access to live classes, recordings, assignments and Q&A.
              </p>

              <hr className="mt-5 mb-4 border-gray-200" />

              <p className="text-xs text-[#6a6f73] mb-1">
                This online course includes:
              </p>
              <ul className="mt-1 text-xs text-[#1c1d1f] space-y-1">
                {course.includes && course.includes.length > 0 ? (
                  course.includes.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))
                ) : (
                  <>
                    <li>• Live online sessions</li>
                    <li>• Access to class recordings</li>
                    <li>• Practical projects & assignments</li>
                    <li>• Certificate of completion from Spark Trainings</li>
                  </>
                )}
              </ul>

              <div className="mt-4 text-center">
                <Link
                  to="/contact"
                  className="text-[12px] text-[#0d9c06] font-semibold hover:underline cursor-pointer"
                >
                  Have questions? Contact support
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}