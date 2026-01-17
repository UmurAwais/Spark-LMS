import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Globe, CheckCircle, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { initialCourses as aiCourses } from "../data/initialCourses"; // Fallback data
import { db } from "../firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs as firestoreGetDocs } from "firebase/firestore";
import { apiFetch } from "../config"; // This import is not used but kept for completeness

import { CourseDetailSkeleton } from "../components/SkeletonLoaders";
import SEO from "../components/SEO";

const defaultWhatYouLearn = [
  "Comprehensive understanding of the subject",
  "Real-world project experience",
  "Industry-standard tools and techniques",
  "Certificate of completion"
];
const defaultRequirements = ["Basic computer skills", "Internet connection", "Willingness to learn"];
const defaultIncludes = ["On-site training", "Project files", "Certificate", "Lifetime access to resources"];

const SingleCoursePage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState({ open: false, lecture: null });

  useEffect(() => {
    async function load() {
      // Avoid flash of loading if data is in initialCourses and we can find it instantly
      const localCourse = aiCourses.find((c) => c.id === id || c.slug === id);
      if (localCourse) {
        setCourse(localCourse);
        // We still fetch from API to get the latest dynamic data (lectures, etc.)
      } else {
        setLoading(true);
      }

      try {
        let foundCourse = null;

        // 1. Try to get from API (Most up-to-date)
        try {
          const response = await apiFetch(`/api/course/${id}`);
          const data = await response.json();
          if (data.ok && data.course) {
            foundCourse = data.course;
          }
        } catch (apiErr) {
          console.warn("API fetch failed, falling back to Firestore/local", apiErr);
        }

        // 2. Fallback to Firestore (Legacy/Backup)
        if (!foundCourse) {
          try {
            const docRef = doc(db, "courses", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              foundCourse = { id: docSnap.id, ...docSnap.data() };
            } else {
              const q = query(collection(db, "courses"), where("slug", "==", id));
              const querySnapshot = await firestoreGetDocs(q);
              if (!querySnapshot.empty) {
                const d = querySnapshot.docs[0];
                foundCourse = { id: d.id, ...d.data() };
              }
            }
          } catch (firestoreErr) {
            console.warn("Firestore fetch error:", firestoreErr);
          }
        }

        // 3. Final Fallback: Check local data
        if (!foundCourse) {
          foundCourse = localCourse;
        }

        if (foundCourse) {
           setCourse(foundCourse);
        }

      } catch (e) {
        console.error("Error loading course:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading && !course) return <CourseDetailSkeleton />;
  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-40 text-center">
        <h2 className="text-3xl font-bold mb-4">Course not found 😢</h2>
        <p className="text-slate-600 mb-8">The course you are looking for might have been moved or deleted.</p>
        <Link to="/courses" className="bg-[#0b7e05] text-white px-6 py-3 rounded-md font-semibold hover:scale-105 transition-transform inline-block cursor-pointer">
          Browse All Courses
        </Link>
      </div>
    );
  }

  const whatYouLearn = course.whatYouWillLearn || defaultWhatYouLearn;
  const requirements = course.requirements || defaultRequirements;
  const includes = course.includes || defaultIncludes;
  const language = course.language || "Urdu / English";

  return (
    <div className="bg-[#f7f9fa] pb-16">
      <SEO 
        title={`${course.title} | Onsite Course`} 
        description={course.excerpt || `Master ${course.title} with our intensive onsite training program. Join hands-on classes at Spark Trainings campus in Pakistan.`}
        keywords={`${course.title}, onsite training, professional ${course.title} course, spark trainings ${course.title}`}
        canonical={`/course/${id}`}
        ogImage={course.image}
      />
      {/* TOP HERO */}
      <section className="bg-[#1c1d1f] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {course.title}
          </h1>

          {course.excerpt && (
            <p className="text-sm sm:text-[15px] text-[#d1d7dc] mb-3 max-w-3xl">
              {course.excerpt}
            </p>
          )}

          <p className="text-sm sm:text-base text-[#d1d7dc] mb-4">
            {course.instructor || "Spark Trainings"}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-[#f4c150]">
              <span className="font-semibold">{course.rating || 4.5}</span>
              <Star size={16} fill="#f4c150" stroke="none" />
              <span className="text-[#d1d7dc]">{course.ratingCount || "0 ratings"}</span>
            </div>

            <span className="text-[#d1d7dc]">•</span>

            <div className="flex items-center gap-1 text-[#d1d7dc]">
              <Globe size={16} />
              <span>{language}</span>
            </div>

            <span className="text-[#d1d7dc]">•</span>

            <div className="flex items-center gap-1 text-[#d1d7dc]">
              <CalendarDays size={16} />
              <span>{course.duration || "Self-paced"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN BODY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT CONTENT */}
        <div className="flex-1">
          {/* WHAT YOU'LL LEARN */}
          <section className="bg-white rounded-md shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">What you'll learn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {whatYouLearn.map((item, i) => (
                <p
                  key={i}
                  className="flex items-start gap-2 text-sm text-[#1c1d1f]"
                >
                  <CheckCircle className="text-[#0d9c06]" size={25} />
                  {item}
                </p>
              ))}
            </div>
          </section>

          {/* CURRICULUM / LECTURES */}
          <section className="bg-white rounded-md shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">Curriculum</h2>
            {Array.isArray(course.lectures) && course.lectures.length > 0 ? (
              <div className="space-y-2">
                {course.lectures.map((lec) => (
                  <div key={lec.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-semibold">{lec.title}</div>
                      <div className="text-xs text-gray-600">{lec.preview ? 'Preview' : 'Locked'}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => setPlayer({ open: true, lecture: lec })}
                        className="px-3 py-1 rounded bg-[#0d9c06] text-white"
                      >
                        Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No lectures yet.</div>
            )}
          </section>

          {/* DESCRIPTION */}
          <section className="bg-white rounded-md shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">Course description</h2>

            {Array.isArray(course.fullDescription) ? (
              course.fullDescription.map((para, index) => (
                <p
                  key={index}
                  className="text-sm sm:text-[15px] leading-7 text-[#1c1d1f] mb-3 last:mb-0"
                >
                  {para}
                </p>
              ))
            ) : (
              <p className="text-sm sm:text-[15px] leading-7 text-[#1c1d1f]">
                {course.fullDescription || "No description provided."}
              </p>
            )}
          </section>

          {/* REQUIREMENTS */}
          <section className="bg-white rounded-md shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">Requirements</h2>
            <ul className="text-sm text-[#1c1d1f] list-disc ml-5 space-y-1">
              {requirements.map((req, i) => (
                <li key={i}>• {req}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full lg:w-80 cursor-pointer">
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            {/* Course image */}
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
              <div className="mb-4">
                <span className="text-[25px] font-bold text-[#1c1d1f]">
                  {course.price}
                </span>
              </div>

              {/* Get Started Button */}
              <div className="mb-6">
                <Link 
                  to="/contact" 
                  className="w-full bg-linear-to-r from-[#0d9c06] to-[#0b7e05] hover:shadow-xl cursor-pointer transition-all hover:scale-105 text-white text-sm rounded-md px-7 py-2.5 flex flex-row gap-1 items-center justify-center font-bold"
                >
                  Get Started 
                  <ArrowRight size={14} />
                </Link>
              </div>

              <hr className="mb-4 border-gray-300" />

              {/* This course includes */}
              <p className="text-xs text-[#6a6f73] mb-2">This course includes:</p>
              <ul className="text-xs text-[#1c1d1f] space-y-1">
                {includes.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* Video Player Modal */}
      {player.open && player.lecture && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{player.lecture.title}</h3>
              <button onClick={() => setPlayer({ open: false, lecture: null })} className="px-2 py-1 bg-gray-200 rounded">Close</button>
            </div>
            <div className="aspect-video">
              <iframe
                title={player.lecture.title}
                src={`https://drive.google.com/file/d/${player.lecture.driveFileId}/preview`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleCoursePage;