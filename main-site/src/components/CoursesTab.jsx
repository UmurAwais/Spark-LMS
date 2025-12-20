import React, { useEffect, useState } from "react";
import { Star, BadgeCheck, Flame, Trophy, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { initialCourses } from "../data/initialCourses";
import { CourseCardSkeleton } from "./SkeletonLoaders";
import { apiFetch } from "../config";

export default function UdemyCoursesCarousel({ hideHeading = false }) {
  const [courses, setCourses] = useState(() => {
    // Try to load from cache first
    const cached = localStorage.getItem('onsite_courses_cache');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }
    return initialCourses;
  });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Fetch dynamic courses from API
    async function fetchDynamicCourses() {
      try {
        const timestamp = new Date().getTime();
        const response = await apiFetch(`/api/courses/onsite?t=${timestamp}`);
        const data = await response.json();
        
        if (data.ok && data.courses) {
          setCourses(data.courses);
          // Cache the results
          localStorage.setItem('onsite_courses_cache', JSON.stringify({
            data: data.courses,
            timestamp: Date.now()
          }));
        }
      } catch (e) {
        console.error("CoursesTab: Error fetching dynamic courses:", e);
        // Keep cached/static courses if API fails
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch if cache is expired or empty
    const cached = localStorage.getItem('onsite_courses_cache');
    if (!cached || courses.length === 0) {
      fetchDynamicCourses();
    } else {
      const { timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp >= 5 * 60 * 1000) {
        fetchDynamicCourses();
      }
    }
  }, []);

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-2 mt-8 lg:mt-18">
        {!hideHeading && (
          <div className="max-w-3xl">
            <h2 className="font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-tight lg:leading-10">
              Transform Your Future in Our Classrooms
            </h2>
            <p className="mt-2 text-[15px] sm:text-base text-slate-600">
              From critical skills to technical topics, Spark Trainings supports your professional development.
            </p>
          </div>
        )}

        <div className="mt-6 lg:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))
          ) : (
            courses.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function CourseCard({ c }) {
  return (
    <Link
      to={`/course/${c.slug || c.id}`}
      className="block rounded-[15px] ring-1 ring-slate-200 bg-white hover:shadow-[0_10px_30px_rgba(2,6,23,0.08)] transition-shadow overflow-hidden group h-full cursor-pointer"
    >
      <div className="p-3 pb-0">
        <div className="overflow-hidden rounded-[15px] h-full bg-gray-100">
          <img
            src={
              c.image?.startsWith('http') 
                ? c.image 
                : c.image?.startsWith('/uploads')
                  ? `${import.meta.env.VITE_API_URL || 'https://spark-lms-backend-production.up.railway.app'}${c.image}`
                  : c.image
            }
            alt={c.title}
            className="h-full w-full object-cover"
            onError={(e) => {e.target.src = "https://via.placeholder.com/300x200?text=No+Image"}}
          />
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        {c.badge && (
           <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold mb-2 ${typeof c.badge === 'string' ? 'bg-gray-100 text-gray-800' : c.badge.color}`}>
             {(typeof c.badge === 'object' ? c.badge.label : c.badge).includes('Premium') && (
               <BadgeCheck size={15} className="stroke-[3px]" />
             )}
             {(typeof c.badge === 'object' ? c.badge.label : c.badge).includes('Hot') && (
               <Flame size={15} className="fill-current" />
             )}
             {(typeof c.badge === 'object' ? c.badge.label : c.badge).includes('Best') && (
               <Trophy size={14} className="fill-current" />
             )}
             {(typeof c.badge === 'object' ? c.badge.label : c.badge).includes('Beginner') && (
               <Sprout size={14} className="stroke-[3px]" />
             )}
             {typeof c.badge === 'object' ? c.badge.label : c.badge}
           </span>
        )}

        <h3 className="text-[18px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">
          {c.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
          {c.excerpt}
        </p>

        <h4 className="mt-1 text-[20px] text-slate-700 font-semibold">{c.price}</h4>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[13px] text-slate-700">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {c.rating || 4.5}
          </span>
          <span className="text-[12px] text-slate-500 ring-1 ring-slate-200 px-2 py-0.5 rounded-md">
            {c.ratingCount || "0 ratings"}
          </span>
          <span className="text-[12px] text-slate-500 ring-1 ring-slate-200 px-2 py-0.5 rounded-md">
            {c.duration || "Self-paced"}
          </span>
        </div>
      </div>
    </Link>
  );
}