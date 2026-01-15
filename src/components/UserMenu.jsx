import React, { useState, useEffect } from "react";
import Button from "./Button";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { BookOpen, User, LogOut } from "lucide-react";

const linkStyle = `relative hover:text-[#0d9c06] hover:underline`;

const UserMenu = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowDropdown(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex justify-between items-center gap-6">
      <div className="flex gap-4 font-display text-[15px] font-regular text-black">
        <Link to="/" className={linkStyle}>
          Home
        </Link>

        <Link to="/courses" className={linkStyle}>
          Courses
        </Link>

        <Link to="/about" className={linkStyle}>
          About Us
        </Link>

        <Link to="/gallery" className={linkStyle}>
          Gallery
        </Link>

        <Link to="/contact" className={linkStyle}>
          Contact Us
        </Link>

        {/* Show My Learning if user is logged in */}
        {user && (
          <Link to="/student/dashboard" className={`${linkStyle} flex items-center gap-1 font-semibold text-[#0d9c06]`}>
            <BookOpen size={16} />
            My Learning
          </Link>
        )}
      </div>

      <div className="flex flex-row gap-3">
        {user ? (
          // User is logged in - show profile dropdown
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-[#0d9c06] hover:bg-[#11c50a] cursor-pointer transition-all text-white text-sm rounded-md px-4 py-2.5"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#0d9c06] font-bold text-xs overflow-hidden">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()
                )}
              </div>
              <span>{user.displayName || 'Student'}</span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{user.displayName || 'Student'}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
                
                <Link
                  to="/student/dashboard"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <BookOpen size={16} />
                  My Learning
                </Link>
                
                <Link
                  to="/student/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User size={16} />
                  Profile
                </Link>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          // User is not logged in - show login/signup buttons
          <>
            <Link
              to="/login"
              className="bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-[15px] hover:shadow-xl cursor-pointer transition-all hover:scale-105 text-white text-sm rounded-md px-7 py-2.5 flex flex-row gap-1 items-center font-bold"
            >
              Login
            </Link>
            <Button />
          </>
        )}
      </div>
    </div>
  );
};

export default UserMenu;