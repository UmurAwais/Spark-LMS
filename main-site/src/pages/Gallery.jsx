import React, { useState } from "react";

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Classroom",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Students",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Setups",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Certificates",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Classroom",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Students",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Setups",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Certificates",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Events",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Events",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Students",
  },
  {
    src: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Classroom",
  },
];

const FILTERS = ["All", "Classroom", "Students", "Setups", "Certificates", "Events"];

const GalleryPage = () => {
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(8); // lazy load count

  const filteredImages =
    activeFilter === "All"
      ? IMAGES
      : IMAGES.filter((img) => img.category === activeFilter);

  const visibleImages = filteredImages.slice(0, visibleCount);

  const canLoadMore = visibleCount < filteredImages.length;

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setVisibleCount(8); // reset lazy load when filter changes
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4); // load 4 more at a time
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* PAGE TITLE */}
        <h1 className="text-3xl sm:text-4xl font-bold font-sora text-[#1c1d1f] mb-3">
          Spark Trainings Gallery
        </h1>
        <p className="text-[15px] text-slate-600 max-w-2xl mb-6">
          A gallery of classroom sessions, students, setups, certificates and
          training events at Spark Trainings.
        </p>

        {/* FILTERS */}
        <div className="mb-8 border-b border-gray-200 pb-3 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 text-sm">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 transition text-[13px] sm:text-sm ${
                  activeFilter === filter
                    ? "bg-[#1c1d1f] text-white border-[#1c1d1f]"
                    : "bg-white text-[#1c1d1f] border-gray-300 hover:bg-gray-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* 🟣 MASONRY GRID */}
        {visibleImages.length === 0 ? (
          <p className="text-sm text-slate-600">No images found for this category.</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {visibleImages.map((img, i) => (
              <div
                key={`${img.src}-${i}`}
                className="rounded-xl overflow-hidden break-inside-avoid cursor-pointer group ring-1 ring-slate-200 bg-white"
                onClick={() => setSelected(img.src)}
              >
                <img
                  src={img.src}
                  alt={`${img.category} ${i + 1}`}
                  loading="lazy"
                  className="w-full mb-4 rounded-xl transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
        )}

        {/* LOAD MORE BUTTON */}
        {canLoadMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-5 py-2.5 rounded-md bg-[#0d9c06] text-sm font-sans font-semibold text-white hover:bg-[#11c50a] cursor-pointer transition"
            >
              Load more photos
            </button>
          </div>
        )}

        {/* 🔵 LIGHTBOX MODAL */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()} // prevent closing when clicking on image area
            >
              <img
                src={selected}
                alt="Large preview"
                className="w-full rounded-xl shadow-2xl"
              />

              <button
                onClick={() => setSelected(null)}
                className="mt-5 w-full py-3 bg-white rounded-md font-semibold text-black hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;