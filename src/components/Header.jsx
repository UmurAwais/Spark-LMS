import React, { useState, useEffect } from "react";
import { Menu, X, Search, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import SearchBar from "./SearchBar";
import { auth } from "../firebaseConfig";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Track authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close on Escape for menu and search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearchOpen(false);
      }
    };
    if (open || searchOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, searchOpen]);

  return (
    <div className="sticky top-0 z-50 bg-white">
      <div className="relative border-b border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
        <div className="w-full max-w-[1440px] mx-auto px-4 p-3 flex items-center justify-between relative">
          {/* Left: mobile search icon and desktop left cluster */}
          <div className='flex items-center gap-4'>
            {/* Mobile menu button on the left (visible only on small screens) */}
            <div className='md:hidden'>
              <button
                aria-expanded={open}
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((s) => !s)}
                className='p-2 rounded-md text-black hover:bg-gray-100 cursor-pointer'
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Desktop cluster: logo, nav, search - hidden on small screens */}
            <div className='hidden md:flex items-center gap-6'>
              <Logo />
              <div className="hidden sm:flex">
                <Link to="/courses" className='text-black text-[14px] flex items-center cursor-pointer'>Explore</Link>
              </div>

              {/* Desktop search only */}
              <div className='hidden md:block'>
                <SearchBar />
              </div>
            </div>
          </div>

          {/* Center: Mobile logo (centered on small screens). Hidden on md+ because desktop logo shown on left */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none">
            <div className='md:hidden'>
              <Logo />
            </div>
          </div>

          {/* Right: desktop user menu or mobile menu toggle */}
          <div className='flex items-center gap-4'>
            <div className='hidden md:flex items-center'>
              <UserMenu />
            </div>

            {/* Mobile controls: search icon on the right (menu moved to left) */}
            <div className='md:hidden flex items-center gap-2'>
              <button className='p-2 rounded-md text-gray-700 hover:bg-gray-100' aria-label='Open search' onClick={() => { setSearchOpen(s => !s); setOpen(false); }}>
                <Search />
              </button>
            </div>
          </div>
        </div>

        {/* Backdrop */}
        <div
          className={`md:hidden fixed inset-0 bg-white bg-opacity-40 transition-opacity duration-300 z-100 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setOpen(false)}
          aria-hidden={!open}
        />

        {/* Search Backdrop (when mobile search is open) */}
        <div
          className={`md:hidden fixed inset-0 bg-white bg-opacity-40 transition-opacity duration-200 z-110 ${searchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSearchOpen(false)}
          aria-hidden={!searchOpen}
        />

        {/* Mobile search close (X) button shown over the search backdrop */}
        {searchOpen && (
          <button
            onClick={(e) => { e.stopPropagation(); setSearchOpen(false); }}
            aria-label="Close mobile search"
            className="md:hidden fixed top-4 right-4 z-110 p-2 bg-white rounded-full shadow-lg text-gray-700 animate-[scale-in_0.2s_ease-out]"
          >
            <X size={20} />
          </button>
        )}

        {/* Mobile close (X) button shown over the backdrop */}
        {open && (
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Close mobile menu"
            className="md:hidden fixed top-4 left-4 z-110 p-2 bg-white rounded-full shadow-lg text-gray-700"
          >
            <X size={20} />
          </button>
        )}

        {/* Mobile animated panel (slides down) */}
        <div className={`md:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-200 transform transition-all duration-300 z-100 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="w-full px-4 pb-4 pt-3">
            {/* Mobile nav links */}
            <div className='flex flex-col gap-3'>
              <Link to='/' className="block text-gray-700 py-2 cursor-pointer" onClick={() => setOpen(false)}>Home</Link>
              <Link to='/courses' className="block text-gray-700 py-2 cursor-pointer" onClick={() => setOpen(false)}>Courses</Link>
              <Link to='/about' className="block text-gray-700 py-2 cursor-pointer" onClick={() => setOpen(false)}>About Us</Link>
              <Link to="/gallery" className="block text-gray-700 py-2 cursor-pointer" onClick={() => setOpen(false)}>Gallery</Link>
              <Link to='/contact' className="block text-gray-700 py-2 cursor-pointer" onClick={() => setOpen(false)}>Contact Us</Link>
              
              {/* Show My Learning if user is logged in */}
              {user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link to='/student/dashboard' className="flex items-center gap-2 text-[#0d9c06] font-semibold py-2 cursor-pointer" onClick={() => setOpen(false)}>
                    <BookOpen size={18} />
                    My Learning
                  </Link>
                  <Link to='/student/profile' className="block text-gray-700 py-2 cursor-pointer" onClick={() => setOpen(false)}>Profile</Link>
                </>
              )}
              
              {!user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link to='/login' className="block bg-[#0d9c06] text-white text-center py-2 rounded-md cursor-pointer" onClick={() => setOpen(false)}>Login</Link>
                  <Link to='/register' className="block bg-white border-2 border-[#0d9c06] text-[#0d9c06] text-center py-2 rounded-md cursor-pointer" onClick={() => setOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search panel (appears when search icon clicked) */}
        <div className={`md:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-200 transform transition-all duration-200 z-120 ${searchOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="w-full px-4 pb-4 pt-3">
            <div className="relative">
              <SearchBar autoFocus />
              <button
                onClick={(e) => { e.stopPropagation(); setSearchOpen(false); }}
                aria-label="Close mobile search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;