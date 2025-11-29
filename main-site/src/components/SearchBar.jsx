import React, { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ autoFocus = false }) => {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div className="w-full md:w-[440px]">
      <form
        onSubmit={handleSubmit}
        className="
          group bg-white flex px-1 py-1 
          rounded-md md:rounded-full 
          border border-[#9fa2b7]
          transition-all duration-300 overflow-hidden w-full 
          [&:has(input:focus)]:border-[#11c50a]
        "
      >
        <input
          autoFocus={autoFocus}
          type="search"
          placeholder="Search Something..."
          className="w-full outline-none bg-white pl-4 text-sm"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />

        <button
          type="submit"
          className="
            bg-[#0d9c06] hover:bg-[#11c50a]
            cursor-pointer transition-all 
            text-white text-sm rounded-md md:rounded-full
            px-5 py-1.5 flex items-center justify-center
          "
        >
          <Search className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;