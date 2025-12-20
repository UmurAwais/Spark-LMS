import React, { useState, useEffect, useRef } from "react";
import { Search, X, BookOpen, Users, ShoppingCart, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../config";

const AdminSearchBar = ({ autoFocus = false }) => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const searchAdminData = async () => {
      if (term.trim().length > 1) {
        setIsLoading(true);
        const searchTerm = term.toLowerCase();
        const filtered = [];

        try {
          const token = localStorage.getItem('admin_token');
          
          // Fetch courses
          try {
            const coursesRes = await apiFetch('/api/admin/courses', {
              headers: { 'x-admin-token': token }
            });
            const coursesData = await coursesRes.json();
            if (coursesData.ok && coursesData.courses) {
              coursesData.courses.forEach(course => {
                if (course.title.toLowerCase().includes(searchTerm) || 
                    course.excerpt?.toLowerCase().includes(searchTerm)) {
                  filtered.push({
                    id: course._id,
                    title: course.title,
                    subtitle: course.excerpt,
                    type: 'course',
                    category: 'Courses',
                    icon: <BookOpen size={12} />
                  });
                }
              });
            }
          } catch (err) {
            console.error('Error fetching courses:', err);
          }

          // Fetch users
          try {
            const usersRes = await apiFetch('/api/admin/users', {
              headers: { 'x-admin-token': token }
            });
            const usersData = await usersRes.json();
            if (usersData.ok && usersData.users) {
              usersData.users.forEach(user => {
                if (user.name?.toLowerCase().includes(searchTerm) || 
                    user.email?.toLowerCase().includes(searchTerm)) {
                  filtered.push({
                    id: user._id,
                    title: user.name,
                    subtitle: user.email,
                    type: 'user',
                    category: 'Users',
                    icon: <Users size={12} />
                  });
                }
              });
            }
          } catch (err) {
            console.error('Error fetching users:', err);
          }

          // Fetch orders
          try {
            const ordersRes = await apiFetch('/api/admin/orders', {
              headers: { 'x-admin-token': token }
            });
            const ordersData = await ordersRes.json();
            if (ordersData.ok && ordersData.orders) {
              ordersData.orders.forEach(order => {
                const studentName = order.student?.name || order.studentName || '';
                const courseName = order.course?.title || order.courseName || '';
                if (studentName.toLowerCase().includes(searchTerm) || 
                    courseName.toLowerCase().includes(searchTerm)) {
                  filtered.push({
                    id: order._id,
                    title: `${studentName} - ${courseName}`,
                    subtitle: `Rs. ${order.amount || order.totalAmount || 0}`,
                    type: 'order',
                    category: 'Orders',
                    icon: <ShoppingCart size={12} />
                  });
                }
              });
            }
          } catch (err) {
            console.error('Error fetching orders:', err);
          }

          // Fetch contacts
          try {
            const contactsRes = await apiFetch('/api/admin/contacts', {
              headers: { 'x-admin-token': token }
            });
            const contactsData = await contactsRes.json();
            if (contactsData.ok && contactsData.contacts) {
              contactsData.contacts.forEach(contact => {
                if (contact.name?.toLowerCase().includes(searchTerm) || 
                    contact.message?.toLowerCase().includes(searchTerm)) {
                  filtered.push({
                    id: contact._id,
                    title: contact.name,
                    subtitle: contact.message?.substring(0, 50) + '...',
                    type: 'contact',
                    category: 'Contacts',
                    icon: <MessageSquare size={12} />
                  });
                }
              });
            }
          } catch (err) {
            console.error('Error fetching contacts:', err);
          }

          setResults(filtered.slice(0, 8)); // Limit to top 8 results
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchAdminData, 300);
    return () => clearTimeout(timeoutId);
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
    // Keep dropdown open to show results
  };

  const handleSelect = (item) => {
    // Navigate based on item type
    if (item.type === 'course') {
      navigate('/admin/courses');
    } else if (item.type === 'user') {
      navigate('/admin/users');
    } else if (item.type === 'order') {
      navigate('/admin/orders');
    } else if (item.type === 'contact') {
      navigate('/admin/contacts');
    }
    setIsOpen(false);
    setTerm("");
  };

  return (
    <div className="relative w-full md:w-[520px]" ref={searchRef}>
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
          placeholder="Search courses, users, orders..."
          className="no-default-styles w-full outline-none bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 border-0! hover:border-0! focus:border-0! active:border-0!"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => term.length > 1 && setIsOpen(true)}
        />

        {term && (
          <button 
            type="button"
            onClick={() => setTerm("")}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-2xl border border-slate-100 overflow-hidden z-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isLoading ? 'Searching...' : 'Search Results'}
            </span>
            {!isLoading && results.length > 0 && (
              <span className="text-[11px] text-[#0d9c06] font-medium">{results.length} found</span>
            )}
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0d9c06] border-r-transparent"></div>
              <p className="text-sm text-slate-500 mt-3">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[380px] overflow-y-auto">
              {results.map((item, index) => (
                <button
                  key={`${item.type}-${item.id || index}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left group cursor-pointer"
                >
                  <div className="mt-1 h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-600">
                    {item.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-[#0d9c06] transition-colors mt-1">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : term.trim().length > 1 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-300" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No results found for "{term}"</h4>
              <p className="text-xs text-slate-500 mt-1">Try checking your spelling or use more general terms</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AdminSearchBar;
