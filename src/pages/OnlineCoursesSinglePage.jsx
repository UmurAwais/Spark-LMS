// src/pages/OnlineCoursePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Globe, CheckCircle, PlayCircle, Lock, Video } from "lucide-react";
import { apiFetch } from "../config";
import VideoPlayer from "../components/VideoPlayer";

import { CourseDetailSkeleton } from "../components/SkeletonLoaders";
import { onlineCourses as initialOnlineCourses } from "../data/onlineCourses";

export default function OnlineCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);

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
    if (url.includes('drive.google.com')) {
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
  };

  return (
    <div className="bg-[#f7f9fa] pb-16">
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
          <section className="bg-white rounded-md shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Course Preview</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Video size={16} />
                <span>{lectures.length} lectures</span>
              </div>
            </div>
            
            {selectedLecture ? (
              <div className="w-full aspect-video bg-black rounded-md overflow-hidden shadow-lg">
                {selectedLecture.videoUrl && (selectedLecture.videoUrl.includes('drive.google.com') || selectedLecture.videoUrl.includes('youtube') || selectedLecture.videoUrl.includes('vimeo')) ? (
                   <iframe 
                    src={getEmbedUrl(selectedLecture.videoUrl)} 
                    title={selectedLecture.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                ) : (
                  <VideoPlayer
                    videoUrl={selectedLecture.videoUrl}
                    previewUrl={selectedLecture.videoUrl} // Use same URL for preview
                    title={selectedLecture.title}
                    isPreview={true}
                  />
                )}
              </div>
            ) : (
              <div className="w-full aspect-video bg-linear-to-br from-[#1c1d1f] to-[#2d2e30] rounded-md flex items-center justify-center">
                <div className="text-center text-white">
                  <PlayCircle size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No lectures available</p>
                </div>
              </div>
            )}
          </section>

          {/* Course Curriculum */}
          <section className="bg-white rounded-md shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Course Curriculum</h2>
            <div className="space-y-2">
              {lectures.map((lecture, index) => {
                const isPreview = index === 0; // Only first lecture is preview
                return (
                  <div
                    key={lecture.id}
                    onClick={() => handleLectureClick(lecture, index)}
                    className={`flex items-center justify-between p-4 rounded-md border transition-all ${
                      isPreview
                        ? 'border-[#0d9c06]/30 bg-[#0d9c06]/5 hover:bg-[#0d9c06]/10 cursor-pointer hover:border-[#0d9c06]'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    } ${selectedLecture?.id === lecture.id ? 'ring-2 ring-[#0d9c06]' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPreview ? 'bg-[#0d9c06] text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {isPreview ? (
                          <PlayCircle size={16} fill="white" />
                        ) : (
                          <Lock size={16} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {index + 1}. {lecture.title}
                        </h3>
                        {isPreview && (
                          <span className="text-xs text-[#0d9c06] font-semibold">Preview Available</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{lecture.duration || "10:00"}</span>
                  </div>
                );
              })}
              {lectures.length === 0 && (
                <p className="text-gray-500 text-center py-4">No lectures added yet.</p>
              )}
            </div>
            <div className="mt-4 p-4 bg-[#5022C3]/10 border border-[#5022C3]/30 rounded-md">
              <p className="text-sm text-gray-700">
                <strong className="text-[#5022C3]">Note:</strong> Enroll in the course to unlock all {lectures.length} lectures and get lifetime access to the content.
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