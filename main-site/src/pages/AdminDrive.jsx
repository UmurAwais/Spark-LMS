import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  ExternalLink, 
  UploadCloud, 
  FileVideo, 
  FileImage, 
  FileText,
  Check,
  Download,
  Search,
  Filter,
  X,
  Loader,
  HardDrive
} from "lucide-react";
import { apiFetch } from "../config";


function getToken() {
  return localStorage.getItem("admin_token");
}

export default function AdminDrive() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, video, image, document
  
  // Google Drive Picker Modal State
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    setLoading(true);
    const token = getToken();
    try {
      const res = await apiFetch('/api/drive/list', {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (data.ok) {
        setFiles(data.files || []);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Could not connect to server. Make sure the backend is running.\n\nError: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDriveFiles() {
    setDriveLoading(true);
    const token = getToken();
    try {
      const res = await apiFetch('/api/drive/list', {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (data.ok) {
        // Filter to show only videos initially
        const allFiles = data.files || [];
        setDriveFiles(allFiles);
        
        // Check if using mock data
        if (data.mock) {
          console.warn('⚠️ Using mock Google Drive data');
          console.log('📝 To connect your Google Drive, follow: GOOGLE_DRIVE_SETUP.md');
        }
      } else {
        console.error(data.message);
        if (data.hint) {
          console.log('💡', data.hint);
        }
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Could not connect to server. Make sure the backend is running.\n\nError: " + err.message);
    } finally {
      setDriveLoading(false);
    }
  }

  function openDrivePicker() {
    setShowDrivePicker(true);
    setSelectedDriveFiles([]);
    fetchDriveFiles();
  }

  function toggleDriveFileSelection(fileId) {
    setSelectedDriveFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }

  function importFromDrive() {
    if (selectedDriveFiles.length === 0) {
      alert("Please select at least one file to import");
      return;
    }

    // Get selected file details
    const selectedFileDetails = driveFiles.filter(f => selectedDriveFiles.includes(f.id));
    
    // Add to existing files (merge with current resources)
    const newFiles = [...files];
    selectedFileDetails.forEach(file => {
      // Check if file already exists
      if (!newFiles.find(f => f.id === file.id)) {
        newFiles.push(file);
      }
    });
    
    setFiles(newFiles);
    setShowDrivePicker(false);
    setSelectedDriveFiles([]);
    
    alert(`Successfully imported ${selectedFileDetails.length} file(s) to Resources!`);
  }

  function getFileIcon(mimeType) {
    if (mimeType.includes('video')) return <FileVideo size={40} className="text-[#5022C3]" />;
    if (mimeType.includes('image')) return <FileImage size={40} className="text-[#0d9c06]" />;
    return <FileText size={40} className="text-[#f4c150]" />;
  }

  function getFileType(mimeType) {
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('image')) return 'image';
    return 'document';
  }

  function toggleFileSelection(fileId) {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }

  function handleImportSelected() {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file to import");
      return;
    }
    
    // Get selected file details
    const selectedFileDetails = files.filter(f => selectedFiles.includes(f.id));
    
    // Store in localStorage for access in course creation
    localStorage.setItem('importedResources', JSON.stringify(selectedFileDetails));
    
    setShowImportModal(true);
  }

  function clearSelection() {
    setSelectedFiles([]);
  }

  // Filter files based on search and type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || getFileType(file.mimeType) === filterType;
    return matchesSearch && matchesType;
  });

  // Filter drive files for picker modal
  const filteredDriveFiles = driveFiles.filter(file => {
    return file.name.toLowerCase().includes(driveSearchQuery.toLowerCase());
  });



  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <HardDrive className="text-[#0d9c06]" />
            Resources Library
          </h1>
          <p className="text-gray-600">Manage your Google Drive resources and import them to courses</p>
        </div>
        <button 
          onClick={openDrivePicker}
          className="bg-[#0d9c06] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0b7e05] transition-colors flex items-center gap-2 shadow-md cursor-pointer"
        >
          <UploadCloud size={20} />
          Import from Google Drive
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5022C3]/10 rounded-md">
              <FileVideo size={20} className="text-[#5022C3]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Videos</p>
              <p className="text-xl font-bold text-gray-800">
                {files.filter(f => f.mimeType.includes('video')).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d9c06]/10 rounded-md">
              <FileImage size={20} className="text-[#0d9c06]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Images</p>
              <p className="text-xl font-bold text-gray-800">
                {files.filter(f => f.mimeType.includes('image')).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f4c150]/10 rounded-md">
              <FileText size={20} className="text-[#f4c150]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Documents</p>
              <p className="text-xl font-bold text-gray-800">
                {files.filter(f => !f.mimeType.includes('video') && !f.mimeType.includes('image')).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-md">
              <Download size={20} />
            </div>
            <div>
              <p className="text-sm opacity-90">Selected</p>
              <p className="text-xl font-bold">{selectedFiles.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent"
            >
              <option value="all">All Files</option>
              <option value="video">Videos Only</option>
              <option value="image">Images Only</option>
              <option value="document">Documents Only</option>
            </select>
          </div>

          {/* Action Buttons */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <X size={16} />
                Clear
              </button>
              <button
                onClick={handleImportSelected}
                className="px-4 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download size={16} />
                Export ({selectedFiles.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-md">
          <FileVideo size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">
            {searchQuery || filterType !== 'all' ? 'No files match your search' : 'No resources imported yet'}
          </p>
          <button
            onClick={openDrivePicker}
            className="inline-flex items-center gap-2 bg-[#0d9c06] text-white px-6 py-3 rounded-md hover:bg-[#11c50a] transition-colors cursor-pointer"
          >
            <UploadCloud size={20} />
            Import from Google Drive
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFiles.map(f => {
            const isSelected = selectedFiles.includes(f.id);
            return (
              <div 
                key={f.id} 
                className={`bg-white border-2 rounded-md p-4 hover:shadow-lg transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-[#0d9c06] ring-2 ring-[#0d9c06]/20' 
                    : 'border-gray-200 hover:border-[#0d9c06]/50'
                }`}
                onClick={() => toggleFileSelection(f.id)}
              >
                {/* Selection Indicator */}
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-[#0d9c06] border-[#0d9c06]' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    getFileType(f.mimeType) === 'video' ? 'bg-[#5022C3]/10 text-[#5022C3]' :
                    getFileType(f.mimeType) === 'image' ? 'bg-[#0d9c06]/10 text-[#0d9c06]' :
                    'bg-[#f4c150]/10 text-[#f4c150]'
                  }`}>
                    {getFileType(f.mimeType)}
                  </span>
                </div>

                {/* Thumbnail */}
                <div className="flex items-center justify-center h-32 bg-gray-50 rounded-md mb-3">
                  {f.thumbnailLink ? (
                    <img src={f.thumbnailLink} alt={f.name} className="h-full object-contain rounded" />
                  ) : (
                    getFileIcon(f.mimeType)
                  )}
                </div>

                {/* File Info */}
                <h3 className="font-semibold text-gray-800 truncate mb-2" title={f.name}>
                  {f.name}
                </h3>

                {/* Actions */}
                <div className="flex gap-2">
                  <a 
                    href={f.webViewLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm text-[#0d9c06] hover:bg-[#0d9c06]/10 py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1 border border-[#0d9c06]/30"
                  >
                    View <ExternalLink size={14} />
                  </a>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(f.id);
                      alert("File ID copied!");
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-md transition-colors"
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Google Drive Picker Modal */}
      {showDrivePicker && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Import from Google Drive</h2>
                <p className="text-gray-600 text-sm mt-1">Select files to import to your resources library</p>
              </div>
              <button
                onClick={() => setShowDrivePicker(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Google Drive files..."
                  value={driveSearchQuery}
                  onChange={(e) => setDriveSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent"
                />
              </div>
            </div>

            {/* Files Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {driveLoading ? (
                <div className="text-center py-12">
                  <Loader className="animate-spin h-12 w-12 text-[#0d9c06] mx-auto mb-4" />
                  <p className="text-gray-600">Loading Google Drive files...</p>
                </div>
              ) : filteredDriveFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileVideo size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No files found in Google Drive</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredDriveFiles.map(file => {
                    const isSelected = selectedDriveFiles.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        onClick={() => toggleDriveFileSelection(file.id)}
                        className={`border-2 rounded-md p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0d9c06] bg-[#0d9c06]/5 ring-2 ring-[#0d9c06]/20'
                            : 'border-gray-200 hover:border-[#0d9c06]/50 hover:shadow-md'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="flex justify-between items-start mb-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#0d9c06] border-[#0d9c06]'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            getFileType(file.mimeType) === 'video' ? 'bg-[#5022C3]/10 text-[#5022C3]' :
                            getFileType(file.mimeType) === 'image' ? 'bg-[#0d9c06]/10 text-[#0d9c06]' :
                            'bg-[#f4c150]/10 text-[#f4c150]'
                          }`}>
                            {getFileType(file.mimeType)}
                          </span>
                        </div>

                        {/* Thumbnail */}
                        <div className="flex items-center justify-center h-24 bg-gray-50 rounded-md mb-3">
                          {file.thumbnailLink ? (
                            <img src={file.thumbnailLink} alt={file.name} className="h-full object-contain rounded" />
                          ) : (
                            getFileIcon(file.mimeType)
                          )}
                        </div>

                        {/* File Name */}
                        <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedDriveFiles.length} file(s) selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDrivePicker(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer font-medium border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={importFromDrive}
                  disabled={selectedDriveFiles.length === 0}
                  className="px-6 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer font-medium shadow-sm hover:shadow-md"
                >
                  <Download size={18} />
                  Import {selectedDriveFiles.length > 0 && `(${selectedDriveFiles.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Success Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0d9c06]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-[#0d9c06]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Files Exported Successfully!</h3>
              <p className="text-gray-600 mb-6">
                {selectedFiles.length} file(s) have been exported and are ready to use in course creation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    clearSelection();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer font-medium border border-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    window.location.href = '/admin/courses';
                  }}
                  className="flex-1 px-4 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] transition-colors cursor-pointer font-medium shadow-sm hover:shadow-md"
                >
                  Add to Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
