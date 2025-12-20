import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Award, Upload, Check, X, Eye, FileText, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../config';
import { useNotifications } from '../context/NotificationContext';

export default function AdminCertificates() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const { addNotification } = useNotifications();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [certificateImage, setCertificateImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const onlineRes = await apiFetch('/api/courses/online');
      const onlineData = await onlineRes.json();
      
      if (onlineData.ok) {
        setCourses(onlineData.courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  }

  function openCertificateModal(course) {
    setSelectedCourse(course);
    setPreviewUrl(course.certificateTemplate || null); 
    setCertificateImage(null);
    setShowModal(true);
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setCertificateImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveCertificate() {
    if (!selectedCourse) {
       addNotification({ type: 'error', title: 'Error', message: 'Please select a course' });
       return;
    }

    if (!certificateImage && !previewUrl) {
       addNotification({ type: 'error', title: 'Error', message: 'Please select a certificate image' });
       return;
    }

    // If we have a preview URL but no new image, it means we're keeping the existing one
    if (!certificateImage && previewUrl) {
      setShowModal(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('courseId', selectedCourse.id);
      formData.append('certificate', certificateImage);

      const res = await apiFetch('/api/admin/certificates/upload', {
        method: 'POST',
        headers: {
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: formData
      });

      const data = await res.json();

      if (data.ok) {
        addNotification({
          type: 'success',
          title: 'Certificate Saved',
          message: `Certificate template updated for ${selectedCourse.title}`
        });
        setShowModal(false);
        fetchCourses(); // Refresh list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error uploading certificate:", error);
      addNotification({ type: 'error', title: 'Upload Failed', message: error.message });
    }
  }

  function toggleCourseSelection(courseId) {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  }

  async function handleDeleteSelected() {
    if (selectedCourses.length === 0) {
      addNotification({ type: 'error', title: 'Error', message: 'No courses selected' });
      return;
    }

    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    try {
      const res = await apiFetch('/api/admin/certificates/delete', {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({ courseIds: selectedCourses })
      });

      const data = await res.json();

      if (data.ok) {
        addNotification({
          type: 'success',
          title: 'Certificates Deleted',
          message: `Certificate templates removed for ${selectedCourses.length} course(s)`
        });
        setSelectedCourses([]);
        setShowDeleteModal(false);
        fetchCourses(); // Refresh list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error deleting certificates:", error);
      addNotification({ type: 'error', title: 'Delete Failed', message: error.message });
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9c06]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ShieldCheck size={24} color="#0d9c06" />
              Certificate Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage completion certificates for your courses
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedCourses.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-700 transition-colors cursor-pointer shadow-sm hover:shadow-md"
              >
                <Trash2 size={20} />
                Delete ({selectedCourses.length})
              </button>
            )}
            <button 
              onClick={() => {
                setSelectedCourse(null);
                setPreviewUrl(null);
                setCertificateImage(null);
                setShowModal(true);
              }}
              className="bg-[#0d9c06] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#0b7e05] transition-colors cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              Add Certificate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div 
              key={course.id} 
              className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group"
            >
               {/* Selection Checkbox - appears on hover */}
               <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 <input
                   type="checkbox"
                   checked={selectedCourses.includes(course.id)}
                   onChange={() => toggleCourseSelection(course.id)}
                   className="w-5 h-5 cursor-pointer accent-[#0d9c06] rounded"
                   onClick={(e) => e.stopPropagation()}
                 />
               </div>
               
               {/* Selected indicator - always visible when selected */}
               {selectedCourses.includes(course.id) && (
                 <div className="absolute top-0 left-0 right-0 bottom-0 bg-[#0d9c06]/10 pointer-events-none z-0"></div>
               )}

               <div className="p-6 relative z-5">
                 <div className="flex items-start justify-between mb-4">
                   <div className="p-3 rounded-md bg-green-100 text-[#0d9c06]">
                     <ShieldCheck size={24} color="#0d9c06" />
                   </div>
                   <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-[#0d9c06]">
                     Online
                   </span>
                 </div>
                 
                 <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 h-14">{course.title}</h3>
                 <p className="text-sm text-gray-500 mb-4">{course.id}</p>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                     <FileText size={16} />
                     <span>Template: {course.certificateTemplate ? 'Active' : 'Default'}</span>
                   </div>
                   <button 
                     onClick={() => openCertificateModal(course)}
                     className="text-[#0d9c06] font-medium text-sm hover:underline cursor-pointer"
                   >
                     Manage
                   </button>
                 </div>
               </div>
            </div>
          ))}
        </div>

        {/* Certificate Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedCourse ? 'Manage Certificate' : 'Add New Certificate'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedCourse ? selectedCourse.title : 'Upload a template for an online course'}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {!selectedCourse && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Course</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                      onChange={(e) => {
                        const course = courses.find(c => c.id === e.target.value);
                        setSelectedCourse(course);
                        setPreviewUrl(course?.certificateTemplate || null);
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select an online course...</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Certificate Template</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {previewUrl ? (
                      <div className="relative">
                        <img src={previewUrl} alt="Certificate Preview" className="max-h-64 mx-auto rounded shadow-lg" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded">
                          <p className="text-white font-medium flex items-center gap-2">
                            <Upload size={20} /> Change Template
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-600 font-medium">Click to upload certificate template</p>
                        <p className="text-xs text-gray-400 mt-1">Recommended size: 1920x1080px (Landscape)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">Dynamic Fields</h4>
                  <p className="text-xs text-blue-700">
                    The system will automatically overlay the student's name, course title, and completion date onto this template.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer font-medium border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCertificate}
                  className="px-6 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] font-medium flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  <Check size={18} />
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-red-100">
                    <Trash2 size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Delete Certificates
                    </h2>
                    <p className="text-sm text-gray-500">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-red-800">
                    Are you sure you want to delete certificate templates for <strong>{selectedCourses.length}</strong> course(s)?
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    The certificate template files will be permanently removed from the server.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600 font-medium mb-2">Selected courses:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {courses
                      .filter(course => selectedCourses.includes(course.id))
                      .map(course => (
                        <div key={course.id} className="text-xs text-gray-700 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          {course.title}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer font-medium border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  <Trash2 size={18} />
                  Delete {selectedCourses.length} Certificate{selectedCourses.length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
