import React, { useEffect, useState } from "react";
import { Star, BadgeCheck, Flame, Trophy, Sprout } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { onlineCourses as initialOnlineCourses } from "../data/onlineCourses";
import { CourseCardSkeleton } from "./SkeletonLoaders";
import { apiFetch } from "../config";
import { useCart } from "../components/CartContext";

function OnlineCourseCard({ c }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const priceNumber =
    typeof c.price === "number"
      ? c.price
      : parseInt(String(c.price).replace(/[^\d]/g, ""), 10) || 0;

  const handleEnroll = () => {
    addToCart({
      id: c.id,
      title: c.title,
      image: c.image,
      price: priceNumber,
    });

    navigate("/cart", { state: { addedCourseId: c.id } });
  };

  return (
    <Link
      to={`/online-course/${c.id}`}
      className="block rounded-[15px] ring-1 ring-slate-200 bg-white hover:shadow-[0_10px_30px_rgba(2,6,23,0.08)] transition-shadow overflow-hidden group h-full cursor-pointer"
    >
      {/* IMAGE */}
      <div className="p-3 pb-0">
        <div className="overflow-hidden rounded-[15px]">
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

      {/* CONTENT */}
      <div className="px-4 pt-3 pb-4">
        {/* Badge */}
        {c.badge && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold mb-2 ${c.badge.color}`}
          >
            {c.badge.label.includes('Premium') && (
              <BadgeCheck size={15} className="stroke-[3px]" />
            )}
            {c.badge.label.includes('Hot') && (
              <Flame size={15} className="fill-current" />
            )}
            {c.badge.label.includes('Best') && (
              <Trophy size={14} className="fill-current" />
            )}
            {c.badge.label.includes('Beginner') && (
              <Sprout size={14} className="stroke-[3px]" />
            )}
            {c.badge.label}
          </span>
        )}

        <h3 className="text-[18px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">
          {c.title}
        </h3>

        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
          {c.excerpt}
        </p>

        {/* Price + meta */}
        <div className="mb-3">
          {c.price && (
            <p className="mt-1 text-[20px] text-slate-700 font-semibold">
              {c.price}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="inline-flex items-center gap-1 text-[13px] text-slate-700">
                {c.rating ? c.rating.toFixed(1) : 4.5}
              </span>
              <span className="text-[12px] text-slate-500 ring-1 ring-slate-200 px-2 py-0.5 rounded-md">
                {c.ratingCount || "0 ratings"}
              </span>
            </div>
          </div>
        </div>

        {/* Enroll Now */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleEnroll();
          }}
          className="w-full bg-[#0d9c06] hover:bg-[#11c50a] text-white font-semibold text-sm py-3 rounded-md flex items-center justify-center gap-2 transition cursor-pointer"
        >
          Enroll now
        </button>
      </div>
    </Link>
  );
}

export default function OnlineCoursesGrid() {
  const [courses, setCourses] = useState(() => {
    // Try to load from cache first
    const cached = localStorage.getItem('online_courses_cache');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }
    return initialOnlineCourses;
  });
  const [loading, setLoading] = useState(false);

  // Fetch dynamic courses from API
  async function fetchDynamicCourses() {
    try {
      // Only set loading to true if we don't have courses already (e.g., from cache or initial data)
      if (courses.length === 0) {
        setLoading(true);
      }
      const timestamp = new Date().getTime();
      const response = await apiFetch(`/api/courses/online?t=${timestamp}`);
      const data = await response.json();
      
      if (data.ok && data.courses) {
        setCourses(data.courses);
        // Cache the results
        localStorage.setItem('online_courses_cache', JSON.stringify({
          data: data.courses,
          timestamp: Date.now()
        }));
      }
    } catch (e) {
      console.error("Error fetching dynamic online courses:", e);
      // Keep cached/static courses if API fails
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Only fetch if cache is expired or empty
    const cached = localStorage.getItem('online_courses_cache');
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
    <section className="bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-2">
        {/* Heading */}
        <div className="max-w-3xl mb-6">
          <h2 className="font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-tight lg:leading-10">
            Build Your Future Career Online
          </h2>
          <p className="mt-2 text-[15px] sm:text-base text-slate-600">
            Flexible online courses with live classes, recordings and practical projects —
            join from anywhere in Pakistan.
          </p>
        </div>

        {/* 3-card grid like Udemy (1 / 2 / 3 cols responsive) */}
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))
          ) : (
            courses.map((course) => (
              <OnlineCourseCard key={course.id} c={course} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}