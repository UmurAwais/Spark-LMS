import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  ExternalLink,
  Upload,
  Link as LinkIcon,
  X,
  Filter,
  Film,
  HardDrive,
  Search,
  Check,
  Loader
} from "lucide-react";
import { apiFetch, config } from "../config";
import { auth, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNotifications } from "../context/NotificationContext";
import { useImageUrl } from "../hooks/useImageUrl";

const CATEGORIES = ["General", "Classroom", "Students", "Setups", "Certificates", "Events"];

const GalleryCard = ({ item, onDelete }) => {
  const url = useImageUrl(item.type === 'video' ? item.thumbnail : item.url);
  const fullResUrl = useImageUrl(item.url);

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        {item.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center">
            {url ? (
              <img src={url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <Film size={48} className="text-gray-300" />
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white/90 p-3 rounded-full text-[#0d9c06]">
                <Video size={24} />
              </div>
            </div>
          </div>
        ) : (
          url && <img src={url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
        )}
        
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onDelete(item._id)}
            className="p-2 bg-white/90 text-red-600 rounded-md hover:bg-red-50 shadow-sm transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold rounded-md tracking-wider">
            {item.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 truncate mb-1">{item.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            {item.type === "image" ? <ImageIcon size={12} /> : <Video size={12} />}
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
          <a 
            href={fullResUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#0d9c06] hover:text-[#0b7e05] transition-colors cursor-pointer"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { addNotification } = useNotifications();
  
  // New Item State
  const [newItem, setNewItem] = useState({
    title: "",
    type: "image",
    category: "General",
    externalUrl: "",
    thumbnail: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Drive Picker State
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");
  const [pickingThumbnail, setPickingThumbnail] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    try {
      const res = await apiFetch("/api/gallery");
      const data = await res.json();
      if (data.ok) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDriveFiles() {
    setDriveLoading(true);
    try {
      const res = await apiFetch('/api/drive/list', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") },
      });
      const data = await res.json();
      if (data.ok) {
        setDriveFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error fetching drive files:", err);
    } finally {
      setDriveLoading(false);
    }
  }

  async function handleAddItem(e) {
    if (e) e.preventDefault();
    setUploading(true);

    try {
      let finalUrl = newItem.externalUrl;
      let finalThumbnail = newItem.thumbnail;

      // 1. Upload main file to Firebase if selected
      if (selectedFile) {
        const path = newItem.type === 'video' ? 'gallery/videos' : 'gallery/images';
        const storageRef = ref(storage, `${path}/${Date.now()}-${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        finalUrl = await getDownloadURL(storageRef);
      }

      // 2. Upload thumbnail if selected
      if (selectedThumbnail) {
        const storageRef = ref(storage, `gallery/thumbnails/${Date.now()}-${selectedThumbnail.name}`);
        await uploadBytes(storageRef, selectedThumbnail);
        finalThumbnail = await getDownloadURL(storageRef);
      }

      if (!finalUrl) {
        throw new Error("Please select a file or provide a URL");
      }

      const res = await apiFetch("/api/admin/gallery/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({
          title: newItem.title,
          type: newItem.type,
          category: newItem.category,
          url: finalUrl,
          thumbnail: finalThumbnail
        })
      });

      const data = await res.json();
      if (data.ok) {
        addNotification({
          type: "success",
          title: "Added",
          message: "Item added to gallery successfully"
        });
        fetchGallery();
        setShowAddModal(false);
        resetForm();
      } else {
        addNotification({
          type: "error",
          title: "Error",
          message: data.message || "Failed to add item"
        });
      }
    } catch (err) {
      console.error("Error adding gallery item:", err);
      addNotification({
        type: "error",
        title: "Server Error",
        message: "Failed to connect to server"
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await apiFetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": localStorage.getItem("admin_token")
        }
      });
      const data = await res.json();
      if (data.ok) {
        addNotification({
          type: "success",
          title: "Deleted",
          message: "Item removed from gallery"
        });
        setItems(items.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  }

  function resetForm() {
    setNewItem({
      title: "",
      type: "image",
      category: "General",
      externalUrl: "",
      thumbnail: ""
    });
    setSelectedFile(null);
    setSelectedThumbnail(null);
  }

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${config.apiUrl}${url}`;
  };

  const handleImportFromDrive = (file) => {
    if (pickingThumbnail) {
      setNewItem({
        ...newItem,
        thumbnail: file.thumbnailLink || file.webViewLink || ""
      });
    } else {
      setNewItem({
        ...newItem,
        title: file.name,
        type: file.mimeType.includes('video') ? 'video' : 'image',
        externalUrl: file.webViewLink,
        thumbnail: file.thumbnailLink || ""
      });
    }
    setShowDrivePicker(false);
    setPickingThumbnail(false);
  };

  const filteredDriveFiles = driveFiles.filter(file => 
    file.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gallery Management</h1>
          <p className="text-gray-600 font-medium">Manage images and videos on the site gallery</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0d9c06] hover:bg-[#0b7e05] text-white px-4 py-2 rounded-md flex items-center gap-2 font-semibold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9c06]"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-md border border-dashed border-gray-300 p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <ImageIcon className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No gallery items found</h3>
            <p className="text-gray-500 mb-6">Start by adding your first image or video</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-[#0d9c06] font-semibold hover:underline"
            >
              Add your first item
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <GalleryCard key={item._id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Add Gallery Item</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] outline-none transition-all"
                  placeholder="e.g. Graduation Batch 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => {
                      setNewItem({...newItem, type: e.target.value});
                      setSelectedFile(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] outline-none appearance-none bg-white font-medium"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] outline-none appearance-none bg-white font-medium"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="text-sm font-medium text-gray-600">Import from</p>
                <div className="flex items-center gap-3">
                  <a
                    href="/admin/drive"
                    target="_blank"
                    className="text-xs text-gray-500 hover:text-[#0d9c06] underline cursor-pointer"
                  >
                    Manage Resources Tab
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDrivePicker(true);
                      fetchDriveFiles();
                    }}
                    className="text-sm font-bold text-[#0d9c06] hover:underline flex items-center gap-1"
                  >
                    <HardDrive size={16} /> Resources
                  </button>
                </div>
              </div>

              {newItem.type === "video" ? (
                <>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Video Resource</label>
                    <div 
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#0d9c06] transition-colors cursor-pointer group"
                      onClick={() => document.getElementById('video-upload').click()}
                    >
                      <div className="space-y-1 text-center">
                        <Video className="mx-auto h-12 w-12 text-gray-400 group-hover:text-[#0d9c06] transition-colors" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-[#0d9c06] hover:text-[#0b7e05]">
                            <span>{selectedFile ? selectedFile.name : "Upload video from PC"}</span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">MP4, WebM up to 500MB</p>
                      </div>
                      <input 
                        id="video-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="video/*"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                    </div>

                    <div className="relative flex items-center gap-2">
                       <div className="h-px bg-gray-300 flex-1"></div>
                       <span className="text-[10px] uppercase font-bold text-gray-400">OR</span>
                       <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" size={16} />
                      <input
                        type="url"
                        value={newItem.externalUrl}
                        onChange={(e) => setNewItem({...newItem, externalUrl: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] outline-none transition-all"
                        placeholder="External Video URL (YT/Direct)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Thumbnail Resource</label>
                    <div 
                      className="mt-1 flex justify-center px-6 pt-5 pb-4 border-2 border-gray-300 border-dashed rounded-md hover:border-[#0d9c06] transition-colors cursor-pointer group"
                      onClick={() => document.getElementById('thumbnail-upload').click()}
                    >
                      <div className="space-y-1 text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-[#0d9c06] transition-colors" />
                        <div className="flex text-xs text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-[#0d9c06] hover:text-[#0b7e05]">
                            <span>{selectedThumbnail ? selectedThumbnail.name : "Upload thumbnail from PC"}</span>
                          </label>
                        </div>
                      </div>
                      <input 
                        id="thumbnail-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={(e) => setSelectedThumbnail(e.target.files[0])}
                      />
                    </div>

                    <div className="relative flex items-center gap-2 my-2">
                       <div className="h-px bg-gray-200 flex-1"></div>
                       <span className="text-[10px] uppercase font-bold text-gray-300">OR</span>
                       <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" size={14} />
                        <input
                          type="url"
                          value={newItem.thumbnail}
                          onChange={(e) => setNewItem({...newItem, thumbnail: e.target.value})}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#0d9c06] outline-none transition-all"
                          placeholder="Thumbnail URL"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPickingThumbnail(true);
                          setShowDrivePicker(true);
                          fetchDriveFiles();
                        }}
                        className="p-2 border border-gray-300 rounded-md text-gray-500 hover:text-[#0d9c06] hover:border-[#0d9c06] transition-all"
                        title="Import thumbnail from Resources"
                      >
                        <HardDrive size={18} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image Resource</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#0d9c06] transition-colors cursor-pointer group"
                       onClick={() => document.getElementById('file-upload').click()}>
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-[#0d9c06] transition-colors" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-[#0d9c06] hover:text-[#0b7e05]">
                          <span>{selectedFile ? selectedFile.name : "Upload a file"}</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input 
                      id="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                  </div>

                  {newItem.externalUrl && (
                    <div className="p-2 bg-gray-100 rounded text-xs truncate flex items-center gap-2">
                       <ExternalLink size={12} /> {newItem.externalUrl}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-[#0d9c06] text-white rounded-md font-semibold hover:bg-[#0b7e05] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Picker Modal */}
      {showDrivePicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-110 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Import from Resources</h3>
                <p className="text-xs text-gray-500">Select a file from your linked Google Drive</p>
              </div>
              <button 
                onClick={() => setShowDrivePicker(false)}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
               <div className="relative">
                 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   value={driveSearchQuery}
                   onChange={(e) => setDriveSearchQuery(e.target.value)}
                   placeholder="Search resources..."
                   className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-[#0d9c06]"
                 />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {driveLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader className="animate-spin text-[#0d9c06] mb-2" size={32} />
                  <p className="text-gray-500">Loading resources...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="text-center py-20">
                   <HardDrive size={48} className="text-gray-200 mx-auto mb-4" />
                   <p className="text-gray-600 font-medium">No resources found</p>
                   <p className="text-gray-400 text-sm">Please link your Google Drive in the Resources tab.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredDriveFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => handleImportFromDrive(file)}
                      className="group border border-gray-200 rounded-md p-3 hover:border-[#0d9c06] hover:bg-[#0d9c06]/5 transition-all cursor-pointer text-center"
                    >
                      <div className="h-24 bg-gray-50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                        {file.thumbnailLink ? (
                          <img src={file.thumbnailLink} className="h-full w-full object-cover" alt="" />
                        ) : file.mimeType.includes('video') ? (
                          <Video size={32} className="text-gray-300" />
                        ) : (
                          <ImageIcon size={32} className="text-gray-300" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 truncate" title={file.name}>{file.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase mt-1">
                        {file.mimeType.includes('video') ? 'Video' : 'Image'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
