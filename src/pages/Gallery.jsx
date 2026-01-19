import React, { useState, useEffect } from "react";
import { PlayCircle, X } from "lucide-react";
import { apiFetch, config } from "../config";
import SEO from "../components/SEO";
import { useImageUrl } from "../hooks/useImageUrl";

const FILTERS = ["All", "Classroom", "Students", "Setups", "Certificates", "Events"];

const GalleryItem = ({ item, onClick }) => {
  const url = useImageUrl(item.type === 'video' ? item.thumbnail : item.url);
  
  return (
    <div
      className="rounded-md overflow-hidden break-inside-avoid cursor-pointer group ring-1 ring-slate-200 bg-white relative mb-4"
      onClick={() => onClick(item)}
    >
      {item.type === "video" ? (
        <div className="relative">
          {url ? (
            <img
              src={url}
              alt={item.title}
              loading="lazy"
              className="w-full rounded-md transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-md">
              <PlayCircle className="text-gray-300" size={48} />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="bg-white/90 p-3 rounded-full text-[#0d9c06] shadow-xl">
              <PlayCircle size={24} />
            </div>
          </div>
        </div>
      ) : (
        url && (
          <img
            src={url}
            alt={item.title || item.category}
            loading="lazy"
            className="w-full rounded-md transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )
      )}
      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold rounded-md">
            {item.category}
         </span>
      </div>
    </div>
  );
};

const Lightbox = ({ item, onClose }) => {
  const fullUrl = useImageUrl(item.url);
  
  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-100 px-4"
      onClick={onClose}
    >
      <div
        className="max-w-5xl w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X size={32} />
        </button>

        {item.type === "video" ? (
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden shadow-2xl">
            {item.url && (item.url.includes("youtube.com") || item.url.includes("youtu.be")) ? (
              <iframe
                src={item.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                className="w-full h-full"
                allowFullScreen
                title={item.title}
              />
            ) : (
              <video 
                src={fullUrl} 
                controls 
                autoPlay
                className="w-full h-full"
              />
            )}
          </div>
        ) : (
          <img
            src={fullUrl}
            alt={item.title}
            className="w-full rounded-md shadow-2xl max-h-[80vh] object-contain"
          />
        )}
        
        <div className="mt-4 text-white text-center">
           <h3 className="text-xl font-bold">{item.title}</h3>
           <p className="text-gray-400 text-sm uppercase font-semibold tracking-wider mt-1">{item.category}</p>
        </div>
      </div>
    </div>
  );
};

export default function GalleryPage() {
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
          // Fallback static data if needed
          setItems([]);
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

  return (
    <div className="min-h-screen bg-[#f7f9fa] py-10 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Gallery - Life at Spark Trainings" 
        description="Explore our training sessions, workshops, and student success events."
        keywords="training gallery, student activities, learning environment"
        canonical="/gallery"
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold font-sora text-[#1c1d1f] mb-3 text-center">
          Spark Trainings Gallery
        </h1>
        <p className="text-[15px] text-slate-600 max-w-2xl mb-8 mx-auto text-center">
          Explore our classroom sessions, student success stories, lab setups, and events at Spark Trainings.
        </p>

        {/* FILTERS */}
        <div className="mb-8 border-b border-gray-200 pb-3 overflow-x-auto">
          <div className="flex justify-center gap-2 sm:gap-3 text-sm">
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
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {visibleItems.map((item, i) => (
              <GalleryItem 
                key={item._id || i} 
                item={item} 
                onClick={(item) => setSelectedItem(item)} 
              />
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
          <Lightbox 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </div>
    </div>
  );
}