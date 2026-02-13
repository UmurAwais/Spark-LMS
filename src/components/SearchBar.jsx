import React, { useState, useEffect, useRef } from "react";
import { Search, X, BookOpen, Clock } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { initialCourses } from "../data/initialCourses";
import { onlineCourses } from "../data/onlineCourses";

const SearchBar = ({ autoFocus = false }) => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Combine all courses for searching
  const allCourses = [
    ...initialCourses.map(c => ({ ...c, type: 'onsite' })),
    ...onlineCourses.map(c => ({ ...c, type: 'online' }))
  ];

  useEffect(() => {
    if (term.trim().length > 1) {
      const filtered = allCourses.filter(course =>
        course.title.toLowerCase().includes(term.toLowerCase()) ||
        course.excerpt?.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 6); // Limit to top 6 results
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [term]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    // If there's a exact match or first result, go there, otherwise go to courses
    if (results.length > 0) {
      handleSelect(results[0]);
    } else {
      navigate('/courses');
    }
  };

  const handleSelect = (course) => {
    const path = course.type === 'online' 
      ? `/online-course/${course.id}` 
      : `/course/${course.id}`;
    navigate(path);
    setIsOpen(false);
    setTerm("");
  };

  return (
    <div className="relative w-full md:w-[419px]" ref={searchRef}>
      <form
        onSubmit={handleSubmit}
        className="
          group bg-white flex px-1 py-1 
          rounded-md border border-slate-300
          transition-all duration-300 overflow-hidden w-full 
          focus-within:border-[#0d9c06] focus-within:ring-2 focus-within:ring-[#0d9c06]/10
        "
      >
        <div className="flex items-center pl-3 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          autoFocus={autoFocus}
          type="text"
          placeholder="What do you want to learn?"
          className="no-default-styles w-full outline-none bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 border-0! hover:border-0! focus:border-0! active:border-0!"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => term.length > 1 && setIsOpen(true)}
        />

        {term && (
          <button 
            type="button"
            onClick={() => setTerm("")}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <button
          type="submit"
          className="
            bg-[#0d9c06] hover:bg-[#0b7e05]
            cursor-pointer transition-all 
            text-white text-sm font-semibold rounded-md
            px-5 flex items-center justify-center
          "
        >
          Search
        </button>
      </form>

      {/* SEARCH RESULTS DROPDOWN */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-2xl border border-slate-100 overflow-hidden z-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Results</span>
            <span className="text-[11px] text-[#0d9c06] font-medium">{results.length} found</span>
          </div>
          
          <div className="max-h-[380px] overflow-y-auto">
            {results.map((course) => (
              <button
                key={`${course.type}-${course.id}`}
                onClick={() => handleSelect(course)}
                className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left group"
              >
                <div className="w-16 h-12 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img 
                    src={course.image} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {e.target.src = "https://via.placeholder.com/64x48?text=LS"}}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-[#0d9c06] transition-colors">
                    {course.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {course.type === 'online' ? 'Online' : 'Onsite'}
                    </span>
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {course.duration}
                      </span>
                    )}
                    <span className="font-bold text-[#0d9c06]">{course.price}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Link 
            to="/courses"
            onClick={() => setIsOpen(false)}
            className="block p-3 bg-slate-50 text-center text-xs font-bold text-slate-600 hover:text-[#0d9c06] transition-colors"
          >
            View all courses
          </Link>
        </div>
      )}

      {isOpen && results.length === 0 && term.trim().length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-2xl border border-slate-100 p-8 text-center z-100">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-300" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No results found for "{term}"</h4>
          <p className="text-xs text-slate-500 mt-1">Try checking your spelling or use more general terms</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;