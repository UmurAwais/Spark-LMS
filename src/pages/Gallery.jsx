import React, { useState, useEffect } from "react";
import { PlayCircle, X } from "lucide-react";
import { apiFetch, config } from "../config";
import SEO from "../components/SEO";

const FILTERS = ["All", "Classroom", "Students", "Setups", "Certificates", "Events"];

const GalleryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await apiFetch("/api/gallery");
        const data = await res.json();
        if (data.ok && data.items && data.items.length > 0) {
          setItems(data.items);
        } else {
          // Hardcoded fallback if database is empty
          setItems([
            {
              url: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              category: "Classroom",
              type: "image",
              title: "Classroom Session"
            },
            {
              url: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              category: "Students",
              type: "image",
              title: "Students Learning"
            },
            {
              url: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              category: "Setups",
              type: "image",
              title: "Lab Setup"
            },
            {
              url: "https://images.unsplash.com/photo-1763333868819-9ae30223a897?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              category: "Certificates",
              type: "image",
              title: "Certificate Distribution"
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching gallery:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  const filteredItems =
    activeFilter === "All"
      ? items
      : items.filter((item) => item.category === activeFilter);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredItems.length;

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setVisibleCount(8);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${config.apiUrl}${url}`;
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] py-10 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Gallery - Life at Spark Trainings" 
        description="Explore our training sessions, workshops, and student success events. See how our community learns and grows together at Spark Trainings campus."
        keywords="training gallery, student activities, learning environment photos, spark trainings events, education workshops"
        canonical="/gallery"
      />
      <div className="max-w-6xl mx-auto">
        {/* PAGE TITLE */}
        <h1 className="text-3xl sm:text-4xl font-bold font-sora text-[#1c1d1f] mb-3">
          Spark Trainings Gallery
        </h1>
        <p className="text-[15px] text-slate-600 max-w-2xl mb-6">
          Explore our classroom sessions, student success stories, lab setups, and events at Spark Trainings.
        </p>

        {/* FILTERS */}
        <div className="mb-8 border-b border-gray-200 pb-3 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 text-sm">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 transition text-[13px] sm:text-sm font-semibold cursor-pointer ${
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

        {/* MASONRY GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9c06]"></div>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-md border border-dashed border-gray-200">
            <p className="text-slate-500 font-medium">No items found for this category.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {visibleItems.map((item, i) => (
              <div
                key={item._id || i}
                className="rounded-md overflow-hidden break-inside-avoid cursor-pointer group ring-1 ring-slate-200 bg-white relative"
                onClick={() => setSelectedItem(item)}
              >
                {item.type === "video" ? (
                  <div className="relative">
                    <img
                      src={getFullUrl(item.thumbnail || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400")}
                      alt={item.title}
                      loading="lazy"
                      className="w-full rounded-md transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="bg-white/90 p-3 rounded-full text-[#0d9c06] shadow-xl">
                        <PlayCircle size={24} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={getFullUrl(item.url)}
                    alt={item.title || item.category}
                    loading="lazy"
                    className="w-full rounded-md transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold rounded-md">
                      {item.category}
                   </span>
                </div>
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
              className="px-6 py-2.5 rounded-md bg-[#0d9c06] text-sm font-semibold text-white hover:bg-[#11c50a] cursor-pointer transition shadow-sm"
            >
              Load more
            </button>
          </div>
        )}

        {/* LIGHTBOX MODAL */}
        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-100 px-4"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="max-w-5xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X size={32} />
              </button>

              {selectedItem.type === "video" ? (
                <div className="aspect-video w-full bg-black rounded-md overflow-hidden shadow-2xl">
                  {selectedItem.url.includes("youtube.com") || selectedItem.url.includes("youtu.be") ? (
                    <iframe
                      src={selectedItem.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      title={selectedItem.title}
                    />
                  ) : (
                    <video 
                      src={getFullUrl(selectedItem.url)} 
                      controls 
                      autoPlay
                      className="w-full h-full"
                    />
                  )}
                </div>
              ) : (
                <img
                  src={getFullUrl(selectedItem.url)}
                  alt={selectedItem.title}
                  className="w-full rounded-md shadow-2xl max-h-[80vh] object-contain"
                />
              )}
              
              <div className="mt-4 text-white">
                 <h3 className="text-xl font-bold">{selectedItem.title}</h3>
                 <p className="text-gray-400 text-sm uppercase font-semibold tracking-wider mt-1">{selectedItem.category}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;