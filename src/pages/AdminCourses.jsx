import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Plus, X, Loader, Trash2, Check, Star, FileVideo, FileImage, FileText, Search, BookOpen, Edit, Save, ChevronDown, ChevronUp, PlayCircle, Layers, CheckCircle, AlertTriangle, HelpCircle, GripVertical } from "lucide-react";
import { initialCourses } from "../data/initialCourses";
import { onlineCourses as initialOnlineCourses } from "../data/onlineCourses";
import { apiFetch, config } from "../config";
import { auth, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNotifications } from "../context/NotificationContext";
import { AdminGridSkeleton } from "../components/SkeletonLoaders";
import RichTextEditor from "../components/RichTextEditor";

const formatDuration = (ms) => {
  if (!ms) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function AdminCourses() {
  const { addNotification } = useNotifications();
  const [courses, setCourses] = useState([]);
  const [onlineCourses, setOnlineCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [courseType, setCourseType] = useState(null);
  
  // Selection state
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state with all required fields
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    excerpt: "",
    price: "",
    rating: "4.5",
    ratingCount: "0 ratings",
    duration: "2 Months",
    language: "Urdu / Hindi",
    badge: "",
    companyLogo: "",
    whatYouWillLearn: [""],
    includes: [""],
    fullDescription: [""]
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  
  // Resource picker state
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [resourcePickerType, setResourcePickerType] = useState(null); // 'video' or 'image'
  const [availableResources, setAvailableResources] = useState([]);
  const [resourceSearchQuery, setResourceSearchQuery] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Imported resource URLs (from Google Drive)
  const [importedVideoUrl, setImportedVideoUrl] = useState(null);
  const [importedImageUrl, setImportedImageUrl] = useState(null);

  // Curriculum state
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [curriculumCourse, setCurriculumCourse] = useState(null);
  const [curriculumSections, setCurriculumSections] = useState([]);
  
  // Delete Confirmation State
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Delete Courses Confirmation Modal
  const [showDeleteCoursesModal, setShowDeleteCoursesModal] = useState(false);

  // Quiz Modal State & Functions
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizSectionId, setCurrentQuizSectionId] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState([]); // Array of questions

  function openQuizModal(sectionId) {
    const section = curriculumSections.find(s => s.id === sectionId);
    if (section) {
      setCurrentQuizSectionId(sectionId);
      // Initialize with existing quiz or empty array
      // If quiz exists but serves as object (legacy), convert to array or handle accordingly
      // We'll assume structure: section.quiz = [{ question, options: [], answer: "" }]
      setCurrentQuiz(section.quiz || []);
      setShowQuizModal(true);
    }
  }

  function addQuestion() {
    setCurrentQuiz([
      ...currentQuiz,
      {
        id: Date.now(),
        question: "",
        options: ["", "", "", ""],
        answer: "" // String matching one of the options or index (let's use the exact string value for simplicity)
      }
    ]);
  }

  function updateQuestion(index, field, value) {
    const updatedQuiz = [...currentQuiz];
    updatedQuiz[index] = { ...updatedQuiz[index], [field]: value };
    setCurrentQuiz(updatedQuiz);
  }
  
  function updateOption(qIndex, oIndex, value) {
    const updatedQuiz = [...currentQuiz];
    const newOptions = [...updatedQuiz[qIndex].options];
    newOptions[oIndex] = value;
    updatedQuiz[qIndex].options = newOptions;
    
    // If we changed the correct answer text, we might need to update the answer field too
    // But for now let's rely on the user re-selecting the correct answer if text changes significantly
    setCurrentQuiz(updatedQuiz);
  }

  function deleteQuestion(index) {
    const updatedQuiz = currentQuiz.filter((_, i) => i !== index);
    setCurrentQuiz(updatedQuiz);
  }

  function saveQuiz() {
    if (currentQuizSectionId) {
      setCurriculumSections(prev => prev.map(sec => 
        sec.id === currentQuizSectionId ? { ...sec, quiz: currentQuiz } : sec
      ));
      
      addNotification({
        type: 'success',
        title: 'Quiz Saved',
        message: 'Quiz questions saved to section temporarily. Click "Save Curriculum" to persist changes.'
      });
      
      setShowQuizModal(false);
    }
  }

  // Curriculum functions
  function openCurriculumModal(course) {
    setCurriculumCourse(course);
    // Ensure lectures is always an array, even if undefined in course object
    const lectures = course.lectures || [];
    setCurriculumSections(JSON.parse(JSON.stringify(lectures)));
    setShowCurriculumModal(true);
  }

  function addSection() {
    setCurriculumSections([
      ...curriculumSections,
      { id: `sec-${Date.now()}`, title: "New Section", lectures: [] }
    ]);
  }

  function updateSectionTitle(id, newTitle) {
    setCurriculumSections(prev => prev.map(sec => 
      sec.id === id ? { ...sec, title: newTitle } : sec
    ));
  }

  function deleteSection(id) {
    setSectionToDelete(id);
    setShowDeleteSectionModal(true);
  }

  function confirmDeleteSection() {
    if (sectionToDelete) {
      setCurriculumSections(prev => prev.filter(sec => sec.id !== sectionToDelete));
      setShowDeleteSectionModal(false);
      setSectionToDelete(null);
    }
  }

  function addLecture(sectionId) {
    setCurriculumSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          lectures: [...sec.lectures, {
            id: `lec-${Date.now()}`,
            title: "New Lecture",
            description: "",
            resources: [],
            duration: "10:00",
            type: "video",
            videoUrl: ""
          }]
        };
      }
      return sec;
    }));
  }

  function updateLecture(sectionId, lectureId, field, value) {
    setCurriculumSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          lectures: sec.lectures.map(lec => 
            lec.id === lectureId ? { ...lec, [field]: value } : lec
          )
        };
      }
      return sec;
    }));
  }

  function deleteLecture(sectionId, lectureId) {
    setCurriculumSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          lectures: sec.lectures.filter(lec => lec.id !== lectureId)
        };
      }
      return sec;
    }));
  }

  // Drag and Drop State & Handlers
  const [draggedItem, setDraggedItem] = useState(null);

  function handleDragStart(e, type, index, sectionIndex = null) {
    e.stopPropagation();
    // For Firefox, dataTransfer.setData is required
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, index, sectionIndex }));
    
    setDraggedItem({ type, index, sectionIndex });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, type, targetIndex, targetSectionIndex = null) {
    e.preventDefault();
    if (!draggedItem) return;

    // Reorder Sections
    if (draggedItem.type === 'section' && type === 'section') {
       if (draggedItem.index === targetIndex) return;
       
       const newSections = [...curriculumSections];
       const [moved] = newSections.splice(draggedItem.index, 1);
       newSections.splice(targetIndex, 0, moved);
       setCurriculumSections(newSections);
    }

    // Reorder Lectures
    if (draggedItem.type === 'lecture' && type === 'lecture') {
       // Allow moving between sections or within same section
       // Scenario 1: Same Section
       if (draggedItem.sectionIndex === targetSectionIndex) {
         if (draggedItem.index === targetIndex) return;
         
         const newSections = [...curriculumSections];
         const section = newSections[draggedItem.sectionIndex];
         const newLectures = [...section.lectures];
         
         const [moved] = newLectures.splice(draggedItem.index, 1);
         newLectures.splice(targetIndex, 0, moved);
         
         newSections[draggedItem.sectionIndex] = { ...section, lectures: newLectures };
         setCurriculumSections(newSections);
       } 
       // Scenario 2: Different Section (Advanced, optional but good)
       else {
         const newSections = [...curriculumSections];
         const sourceSection = newSections[draggedItem.sectionIndex];
         const targetSection = newSections[targetSectionIndex];
         
         const sourceLectures = [...sourceSection.lectures];
         const targetLectures = [...targetSection.lectures];
         
         const [moved] = sourceLectures.splice(draggedItem.index, 1);
         targetLectures.splice(targetIndex, 0, moved);
         
         newSections[draggedItem.sectionIndex] = { ...sourceSection, lectures: sourceLectures };
         newSections[targetSectionIndex] = { ...targetSection, lectures: targetLectures };
         setCurriculumSections(newSections);
       }
    }
    
    setDraggedItem(null);
  }

  async function saveCurriculum() {
    try {
      const res = await apiFetch('/api/courses/curriculum', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({
          courseId: curriculumCourse.id,
          lectures: curriculumSections
        })
      });
      
      const data = await res.json();
      if (data.ok) {
        addNotification({
          type: 'success',
          title: 'Curriculum Saved',
          message: 'Course curriculum updated successfully'
        });
        setShowCurriculumModal(false);
        fetchDynamicCourses();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error saving curriculum:", error);
      alert("Failed to save curriculum");
    }
  }

  useEffect(() => {
    fetchDynamicCourses();
  }, []);

  async function fetchDynamicCourses() {
    setLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const [onsiteRes, onlineRes] = await Promise.all([
        apiFetch(`/api/courses/onsite?t=${timestamp}`),
        apiFetch(`/api/courses/online?t=${timestamp}`)
      ]);

      const onsiteData = await onsiteRes.json();
      const onlineData = await onlineRes.json();

      // Prioritize MongoDB data, use static only as fallback on error
      if (onsiteData.ok) {
        // Use MongoDB data (even if empty - means no courses in DB)
        setCourses(onsiteData.courses || []);
      } else {
        // API error - show static courses as fallback
        setCourses(initialCourses);
      }
      
      if (onlineData.ok) {
        // Use MongoDB data (even if empty - means no courses in DB)
        setOnlineCourses(onlineData.courses || []);
      } else {
        // API error - show static courses as fallback
        setOnlineCourses(initialOnlineCourses);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImportedImageUrl(null); // Clear imported URL if user selects new file
    }
  }

  function handleVideoSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(file.name);
      setImportedVideoUrl(null); // Clear imported URL if user selects new file
    }
  }

  const [currentLectureForResource, setCurrentLectureForResource] = useState(null);

  function openResourcePicker(type, lectureContext = null) {
    setResourcePickerType(type);
    if (lectureContext) {
      setCurrentLectureForResource(lectureContext);
    } else {
      setCurrentLectureForResource(null);
    }
    
    // Get resources from localStorage
    const importedResources = localStorage.getItem('importedResources');
    if (importedResources) {
      const resources = JSON.parse(importedResources);
      setAvailableResources(resources);
      setShowResourcePicker(true);
    } else {
      if (confirm('No resources imported yet. Go to Resources tab to import files from Google Drive?')) {
        window.location.href = '/admin/drive';
      }
    }
  }

  function selectResource(resource) {
    if (currentLectureForResource) {
      const { sectionId, lectureId } = currentLectureForResource;
      
      // Handle PDF resources (add to downloadable resources)
      if (resourcePickerType === 'pdf') {
        const section = curriculumSections.find(s => s.id === sectionId);
        const lecture = section?.lectures.find(l => l.id === lectureId);
        
        if (lecture) {
          const newResource = { 
            title: resource.name, 
            url: resource.webViewLink 
          };
          const currentResources = lecture.resources || [];
          updateLecture(sectionId, lectureId, 'resources', [...currentResources, newResource]);
        }
      } else {
        // Handle video resources (update lecture video)
        updateLecture(sectionId, lectureId, 'videoUrl', resource.webViewLink);
        
        // Auto-fetch duration if available
        if (resource.videoMediaMetadata && resource.videoMediaMetadata.durationMillis) {
          const duration = formatDuration(parseInt(resource.videoMediaMetadata.durationMillis));
          updateLecture(sectionId, lectureId, 'duration', duration);
        }
      }
      
      setCurrentLectureForResource(null);
    } else {
      // Standard course video/image
      if (resourcePickerType === 'video') {
        setImportedVideoUrl(resource.webViewLink);
        setVideoPreview(resource.name + ' (from Resources)');
        setVideoFile(null);
      } else if (resourcePickerType === 'image') {
        setImportedImageUrl(resource.thumbnailLink || resource.webViewLink);
        setImagePreview(resource.thumbnailLink || resource.webViewLink);
        setImageFile(null);
      }
    }
    
    setShowResourcePicker(false);
    setResourceSearchQuery("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Check if we have either a file or imported URL or existing image for image
    if (!imageFile && !importedImageUrl && !imagePreview) {
      alert("Please select a course image or import one from resources");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('courseType', courseType);
      formDataToSend.append('id', formData.id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('excerpt', formData.excerpt);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('ratingCount', formData.ratingCount);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('language', formData.language);
      formDataToSend.append('badge', formData.badge);
      formDataToSend.append('companyLogo', formData.companyLogo || '');
      
      // Add array fields (filter out empty strings)
      formDataToSend.append('whatYouWillLearn', JSON.stringify(formData.whatYouWillLearn.filter(item => item.trim())));
      formDataToSend.append('includes', JSON.stringify(formData.includes.filter(item => item.trim())));
      formDataToSend.append('fullDescription', JSON.stringify(formData.fullDescription.filter(item => item.trim())));
      
      // 1. Upload image to Firebase Storage if we have a new file
      if (imageFile) {
        setUploadProgress(10);
        const storageRef = ref(storage, `courses/${Date.now()}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        const persistentImageUrl = await getDownloadURL(storageRef);
        formDataToSend.append('imageUrl', persistentImageUrl);
      } else if (importedImageUrl) {
        formDataToSend.append('imageUrl', importedImageUrl);
      } else if (isEditing && imagePreview) {
        // Keep existing image when editing
        formDataToSend.append('existingImageUrl', imagePreview);
      }
      
      setUploadProgress(40);

      // Use different endpoint and method for editing vs creating
      const endpoint = isEditing ? `/api/courses/update/${courseType}/${formData.id}` : '/api/courses/upload';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await apiFetch(endpoint, {
        method: method,
        headers: { "x-admin-token": localStorage.getItem("admin_token") },
        body: formDataToSend
      });

      setUploadProgress(70);

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || (isEditing ? 'Update failed' : 'Upload failed'));
      }

      setUploadProgress(100);
      addNotification({
        type: 'success',
        title: isEditing ? 'Course Updated' : 'Course Added',
        message: isEditing ? `Successfully updated "${formData.title}"` : `Successfully added "${formData.title}"`
      });
      
      // Show success modal
      setSuccessMessage(isEditing ? `Course "${formData.title}" has been updated successfully!` : `Course "${formData.title}" has been added successfully!`);
      setShowSuccessModal(true);
      resetForm();
      setShowModal(false);
      setIsEditing(false);
      setSelectedCourses([]);
      
      // Refetch courses instead of reloading
      await fetchDynamicCourses();
    } catch (error) {
      console.error(isEditing ? "Error updating course:" : "Error adding course:", error);
      alert((isEditing ? "Error updating course: " : "Error adding course: ") + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function resetForm() {
    setFormData({
      id: "",
      title: "",
      excerpt: "",
      price: "",
      rating: "4.5",
      ratingCount: "0 ratings",
      duration: "2 Months",
      language: "Urdu / Hindi",
      badge: "",
      companyLogo: "",
      whatYouWillLearn: [""],
      includes: [""],
      fullDescription: [""]
    });
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setImportedVideoUrl(null);
    setImportedImageUrl(null);
    setCourseType(null);
    setIsEditing(false);
  }

  function toggleCourseSelection(courseId, type) {
    const key = `${type}-${courseId}`;
    setSelectedCourses(prev => 
      prev.includes(key) ? prev.filter(id => id !== key) : [...prev, key]
    );
  }

  function selectAllCourses(type) {
    const coursesToSelect = type === 'onsite' ? courses : onlineCourses;
    const keys = coursesToSelect.map(c => `${type}-${c.id}`);
    setSelectedCourses(prev => {
      const allSelected = keys.every(k => prev.includes(k));
      if (allSelected) {
        return prev.filter(k => !keys.includes(k));
      } else {
        return [...new Set([...prev, ...keys])];
      }
    });
  }

  async function deleteSelected() {
    if (selectedCourses.length === 0) {
      addNotification({
        type: 'error',
        title: 'No Selection',
        message: 'Please select at least one course to delete'
      });
      return;
    }

    // Show delete confirmation modal
    setShowDeleteCoursesModal(true);
  }
  
  async function confirmDeleteCourses() {
    setShowDeleteCoursesModal(false);

    try {
      for (const key of selectedCourses) {
        const [type, courseId] = key.split('-');
        await apiFetch(`/api/courses/${type}/${courseId}`, {
          method: 'DELETE',
          headers: { "x-admin-token": localStorage.getItem("admin_token") }
        });
      }
      
      addNotification({
        type: 'success',
        title: 'Courses Deleted',
        message: `Successfully deleted ${selectedCourses.length} course(s)`
      });
      
      setSuccessMessage(`Successfully deleted ${selectedCourses.length} course(s)!`);
      setShowSuccessModal(true);
      setSelectedCourses([]);
      await fetchDynamicCourses();
    } catch (error) {
      console.error("Error deleting courses:", error);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Error deleting courses: ' + error.message
      });
    }
  }

  // Filter resources based on search
  const filteredResources = availableResources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(resourceSearchQuery.toLowerCase());
    let matchesType = false;
    
    if (resourcePickerType === 'video') {
      matchesType = resource.mimeType.includes('video');
    } else if (resourcePickerType === 'image') {
      matchesType = resource.mimeType.includes('image');
    } else if (resourcePickerType === 'pdf') {
      matchesType = resource.mimeType.includes('pdf') || resource.mimeType.includes('application/pdf');
    }
    
    return matchesSearch && matchesType;
  });

  // Course Card Component matching home page design
  function CourseCard({ course, type }) {
    const isSelected = selectedCourses.includes(`${type}-${course.id}`);
    const isHovered = hoveredCourse === `${type}-${course.id}`;

    return (
      <div
        className="relative block rounded-md ring-1 ring-slate-200 bg-white hover:shadow-[0_10px_30px_rgba(2,6,23,0.08)] transition-shadow overflow-hidden h-full cursor-pointer"
        onMouseEnter={() => setHoveredCourse(`${type}-${course.id}`)}
        onMouseLeave={() => setHoveredCourse(null)}
        onClick={() => toggleCourseSelection(course.id, type)}
      >
        {(isHovered || isSelected) && (
          <div className="absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 border-green-600 bg-white flex items-center justify-center">
            {isSelected && <Check size={16} className="text-green-600" />}
          </div>
        )}

        <div className="p-3 pb-0">
          <div className="overflow-hidden rounded-md h-48 bg-gray-100">
            <img
              src={
                course.image?.startsWith('http') 
                  ? course.image 
                  : course.image?.startsWith('/uploads')
                    ? `${import.meta.env.VITE_API_URL || 'https://spark-lms-backend-production.up.railway.app'}${course.image}`
                    : course.image
              }
              alt={course.title}
              className="h-full w-full object-cover"
              onError={(e) => {e.target.src = "https://via.placeholder.com/300x200?text=No+Image"}}
            />
          </div>
        </div>

        <div className="px-4 pt-3 pb-4">
          {course.badge && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${typeof course.badge === 'string' ? 'bg-gray-100 text-gray-800' : course.badge.color}`}>
              {typeof course.badge === 'object' ? course.badge.label : course.badge}
            </span>
          )}

          <h3 className="text-[18px] font-semibold text-slate-900 leading-snug line-clamp-2">
            {course.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">
            {course.excerpt}
          </p>

          <h4 className="mt-1 text-[20px] text-slate-700 font-semibold">{course.price}</h4>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[13px] text-slate-700">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {course.rating || 4.5}
            </span>
            <span className="text-[12px] text-slate-500 ring-1 ring-slate-200 px-2 py-0.5 rounded-md">
              {course.ratingCount || "0 ratings"}
            </span>
            {type === 'onsite' && (
              <span className="text-[12px] text-slate-500 ring-1 ring-slate-200 px-2 py-0.5 rounded-md">
                {course.duration || "Self-paced"}
              </span>
            )}
          </div>

          {type === 'online' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // Set loading state on the button or global
                setLoading(true);
                try {
                  const res = await apiFetch(`/api/courses/detail/${type}/${course.id}`, {
                    headers: { "x-admin-token": localStorage.getItem("admin_token") }
                  });
                  const data = await res.json();
                  if (data.ok) {
                    openCurriculumModal(data.course);
                  } else {
                    addNotification({ type: 'error', title: 'Error', message: data.message });
                  }
                } catch (err) {
                  addNotification({ type: 'error', title: 'Error', message: 'Failed to fetch course details' });
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-green-50 text-[#0d9c06] hover:bg-green-100 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              <Layers size={16} />
              Manage Curriculum
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="text-[#0d9c06]" />
              Courses
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your course catalog ({courses.length} onsite, {onlineCourses.length} online)
            </p>
          </div>
          <div className="flex gap-2">
            {selectedCourses.length > 0 && (
              <>
                {selectedCourses.length === 1 && (
                  <button
                    onClick={async () => {
                      // Get the selected course
                      const [type, courseId] = selectedCourses[0].split('-');
                      
                      setLoading(true);
                      try {
                        const res = await apiFetch(`/api/courses/detail/${type}/${courseId}`, {
                          headers: { "x-admin-token": localStorage.getItem("admin_token") }
                        });
                        const data = await res.json();
                        
                        if (data.ok) {
                          const courseToEdit = data.course;
                          // Set editing mode
                          setIsEditing(true);
                          
                          // Populate form with course data
                          setFormData({
                            id: courseToEdit.id || '',
                            title: courseToEdit.title || '',
                            excerpt: courseToEdit.excerpt || '',
                            price: courseToEdit.price || '',
                            rating: courseToEdit.rating || '4.5',
                            ratingCount: courseToEdit.ratingCount || '0 ratings',
                            duration: courseToEdit.duration || '2 Months',
                            language: courseToEdit.language || 'Urdu / Hindi',
                            badge: typeof courseToEdit.badge === 'object' ? (courseToEdit.badge?.label || '') : (courseToEdit.badge || ''),
                            companyLogo: courseToEdit.companyLogo || '',
                            whatYouWillLearn: courseToEdit.whatYouWillLearn || [''],
                            includes: courseToEdit.includes || [''],
                            fullDescription: courseToEdit.fullDescription || ['']
                          });
                          
                          // Set image preview if exists
                          if (courseToEdit.image) {
                            setImagePreview(courseToEdit.image);
                          }
                          
                          // Set course type
                          setCourseType(type);
                          
                          // Open modal
                          setShowModal(true);
                        } else {
                          addNotification({ type: 'error', title: 'Error', message: data.message });
                        }
                      } catch (err) {
                        addNotification({ type: 'error', title: 'Error', message: 'Failed to fetch course details' });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition cursor-pointer"
                  >
                    <Edit size={20} />
                    Edit Course
                  </button>
                )}
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition cursor-pointer"
                >
                  <Trash2 size={20} />
                  Delete ({selectedCourses.length})
                </button>
              </>
            )}
            <button
              onClick={() => { setIsEditing(false); resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 bg-[#0d9c06] hover:bg-[#0b7e05] text-white px-4 py-2 rounded-md transition cursor-pointer"
            >
              <Plus size={20} />
              Add Course
            </button>
          </div>
        </div>

        <div className="space-y-8">
            {loading && courses.length === 0 && onlineCourses.length === 0 ? (
              <AdminGridSkeleton />
            ) : (
              <>
                {/* Onsite Courses */}
                <div className="bg-white rounded-md shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Onsite Courses ({courses.length})</h2>
                    {courses.length > 0 && (
                      <button
                        onClick={() => selectAllCourses('onsite')}
                        className="text-sm text-[#0d9c06] hover:py-2 hover:px-2 px-2 py-2 hover:bg-[#daffd8] hover:text-[#0d9c06] rounded-md transition-all ease-in-out duration-300 cursor-pointer"
                      >
                        {courses.every(c => selectedCourses.includes(`onsite-${c.id}`)) ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <CourseCard key={course.id} course={course} type="onsite" />
                    ))}
                  </div>
                </div>

                {/* Online Courses */}
                <div className="bg-white rounded-md shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Online Courses ({onlineCourses.length})</h2>
                    {onlineCourses.length > 0 && (
                      <button
                        onClick={() => selectAllCourses('online')}
                        className="text-sm text-[#0d9c06] hover:py-2 hover:px-2 px-2 py-2 hover:bg-[#daffd8] hover:text-[#0d9c06] rounded-md transition-all ease-in-out duration-300 cursor-pointer"
                      >
                        {onlineCourses.every(c => selectedCourses.includes(`online-${c.id}`)) ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {onlineCourses.map((course) => (
                      <CourseCard key={course.id} course={course} type="online" />
                    ))}
                  </div>
                </div>
              </>
            )}
        </div>

        {/* Add Course Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-md max-w-3xl w-full my-8">
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Course' : 'Add New Course'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {!courseType ? (
                  <div className="space-y-4">
                    <p className="text-gray-700 font-medium mb-6">Select course type to continue:</p>
                    <button
                      onClick={() => setCourseType("online")}
                      className="w-full p-8 border-2 border-[#0d9c06] rounded-md hover:bg-green-50 transition group cursor-pointer"
                    >
                      <h3 className="text-xl font-bold text-[#0d9c06] mb-2">Online Course</h3>
                      <p className="text-sm text-gray-600">Manage curriculum and lectures online</p>
                    </button>
                    <button
                      onClick={() => setCourseType("onsite")}
                      className="w-full p-8 border-2 border-[#0d9c06] rounded-md hover:bg-green-50 transition group cursor-pointer"
                    >
                      <h3 className="text-xl font-bold text-[#0d9c06] mb-2">Onsite Course</h3>
                      <p className="text-sm text-gray-600">Physical location course in Pakistan</p>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <p className="text-sm text-blue-900">
                        Creating: <strong className="text-blue-700">{courseType === "online" ? "Online" : "Onsite"}</strong> Course
                        <button
                          type="button"
                          onClick={() => setCourseType(null)}
                          className="ml-3 text-blue-600 hover:text-blue-800 underline text-xs font-medium cursor-pointer"
                        >
                          Change Type
                        </button>
                      </p>
                    </div>



                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Course Image *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="flex-1 border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        />
                        <button
                          type="button"
                          onClick={() => openResourcePicker('image')}
                          className="px-4 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"
                        >
                          <FileImage size={18} />
                          Import from Resources
                        </button>
                      </div>
                      {imagePreview && (
                        <img 
                          src={
                            imagePreview.startsWith('blob:') 
                              ? imagePreview  // Local file preview
                              : imagePreview.startsWith('/courses/') 
                                ? imagePreview  // Public folder path
                                : imagePreview.startsWith('http') 
                                  ? imagePreview  // Full URL (imported from resources)
                                  : imagePreview.startsWith('/uploads')
                                    ? `${import.meta.env.VITE_API_URL || 'https://spark-lms-backend-production.up.railway.app'}${imagePreview}`  // Backend upload
                                    : imagePreview  // Fallback
                          }
                          alt="Preview" 
                          className="mt-3 w-full h-auto max-h-96 object-contain rounded-md border-2 border-gray-200" 
                          onError={(e) => {
                            console.error('Image preview failed to load:', imagePreview);
                            e.target.src = "https://via.placeholder.com/400x300?text=Image+Preview+Failed";
                          }}
                        />
                      )}
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Course ID *</label>
                        <input
                          type="text"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder="e.g., web-development-2026"
                          disabled={isEditing}
                          required
                        />
                        {isEditing && (
                          <p className="text-xs text-gray-500 mt-1">Course ID cannot be changed when editing</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Price *</label>
                        <input
                          type="text"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder="e.g., Rs. 25,000"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Course Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        placeholder="e.g., Web Development Masterclass 2026"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Short Description (Excerpt) *
                      </label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        rows="3"
                        placeholder="Brief description of the course..."
                        required
                      />
                    </div>

                    <div className={`grid grid-cols-1 gap-4 ${courseType === 'onsite' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.rating}
                          onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Rating Count</label>
                        <input
                          type="text"
                          value={formData.ratingCount}
                          onChange={(e) => setFormData({ ...formData, ratingCount: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder="e.g., 1,234 ratings"
                        />
                      </div>
                      {courseType === 'onsite' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Duration</label>
                          <input
                            type="text"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            placeholder="e.g., 2 Months"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Language</label>
                        <input
                          type="text"
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder="e.g., Urdu / Hindi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Badge Label</label>
                        <input
                          type="text"
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder="e.g., Premium, Best Seller"
                        />
                      </div>
                    </div>

                    {/* Company Logo Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Company Logo
                        <span className="text-gray-500 text-xs font-normal ml-2">(Optional - Logo to display with Spark Trainings)</span>
                      </label>
                      <select
                        value={formData.companyLogo || ''}
                        onChange={(e) => setFormData({ ...formData, companyLogo: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      >
                        <option value="">None (Spark Trainings only)</option>
                        <option value="uk">🇬🇧 UK Flag (English/IELTS)</option>
                        <option value="wordpress">WordPress</option>
                        <option value="adobe">Adobe</option>
                        <option value="shopify">Shopify</option>
                        <option value="meta">Meta</option>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select a platform logo to display alongside Spark Trainings logo in the course player header
                      </p>
                    </div>

                    {/* What You Will Learn */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        What You Will Learn
                      </label>
                      <div className="space-y-2">
                        {formData.whatYouWillLearn.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...formData.whatYouWillLearn];
                                newItems[index] = e.target.value;
                                setFormData({ ...formData, whatYouWillLearn: newItems });
                              }}
                              className="flex-1 border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                              placeholder="e.g., Master the fundamentals of..."
                            />
                            {formData.whatYouWillLearn.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = formData.whatYouWillLearn.filter((_, i) => i !== index);
                                  setFormData({ ...formData, whatYouWillLearn: newItems });
                                }}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors cursor-pointer"
                              >
                                <X size={20} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              whatYouWillLearn: [...formData.whatYouWillLearn, ""] 
                            });
                          }}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-[#0d9c06] hover:text-[#0d9c06] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Add Learning Point
                        </button>
                      </div>
                    </div>

                    {/* Includes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Course Includes
                      </label>
                      <div className="space-y-2">
                        {formData.includes.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...formData.includes];
                                newItems[index] = e.target.value;
                                setFormData({ ...formData, includes: newItems });
                              }}
                              className="flex-1 border-2 border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                              placeholder="e.g., Certificate of completion"
                            />
                            {formData.includes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = formData.includes.filter((_, i) => i !== index);
                                  setFormData({ ...formData, includes: newItems });
                                }}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors cursor-pointer"
                              >
                                <X size={20} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              includes: [...formData.includes, ""] 
                            });
                          }}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-[#0d9c06] hover:text-[#0d9c06] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Add Include Item
                        </button>
                      </div>
                    </div>

                    {/* Full Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Course Description (Paragraphs)
                      </label>
                      <div className="space-y-2">
                        {formData.fullDescription.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="flex-1">
                              <RichTextEditor
                                value={item}
                                onChange={(html) => {
                                  const newItems = [...formData.fullDescription];
                                  newItems[index] = html;
                                  setFormData({ ...formData, fullDescription: newItems });
                                }}
                                placeholder="Write a detailed paragraph about the course..."
                              />
                            </div>
                            {formData.fullDescription.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = formData.fullDescription.filter((_, i) => i !== index);
                                  setFormData({ ...formData, fullDescription: newItems });
                                }}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors cursor-pointer h-fit"
                              >
                                <X size={20} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              fullDescription: [...formData.fullDescription, ""] 
                            });
                          }}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-[#0d9c06] hover:text-[#0d9c06] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Add Paragraph
                        </button>
                      </div>
                    </div>

                    {uploading && (
                      <div className="bg-blue-50 border-2 border-blue-300 rounded-md p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <Loader className="animate-spin text-blue-600" size={24} />
                          <span className="text-sm font-semibold text-blue-900">Uploading... {uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        disabled={uploading}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer font-medium border border-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex-1 bg-[#0d9c06] hover:bg-[#0b8005] text-white py-2 px-6 rounded-md font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {uploading ? (isEditing ? "Saving..." : "Uploading...") : (isEditing ? "Save Changes" : "Add Course")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resource Picker Modal */}
        {showResourcePicker && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-md max-w-4xl w-full max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Select {resourcePickerType === 'video' ? 'Video' : resourcePickerType === 'pdf' ? 'PDF' : 'Image'} from Resources
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Choose a file from your imported resources
                  </p>
                </div>
                <button
                  onClick={() => setShowResourcePicker(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-gray-200">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${resourcePickerType}s...`}
                    value={resourceSearchQuery}
                    onChange={(e) => setResourceSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Resources Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredResources.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-300 mb-4">
                      {resourcePickerType === 'video' ? <FileVideo size={48} className="mx-auto" /> : <FileImage size={48} className="mx-auto" />}
                    </div>
                    <p className="text-gray-500">
                      No {resourcePickerType}s found in resources.
                    </p>
                    <button
                      onClick={() => {
                        setShowResourcePicker(false);
                        window.location.href = '/admin/drive';
                      }}
                      className="mt-4 text-[#0d9c06] hover:underline font-medium cursor-pointer"
                    >
                      Go to Resources to import files
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredResources.map(resource => (
                      <div
                        key={resource.id}
                        onClick={() => selectResource(resource)}
                        className="border-2 border-gray-200 rounded-md p-4 cursor-pointer hover:border-[#0d9c06] hover:shadow-md transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-md mb-3">
                          {resource.thumbnailLink ? (
                            <img src={resource.thumbnailLink} alt={resource.name} className="h-full object-contain rounded" />
                          ) : (
                            resourcePickerType === 'video' ? <FileVideo size={48} className="text-[#5022C3]" /> : 
                            resourcePickerType === 'pdf' ? <FileText size={48} className="text-[#f4c150]" /> : 
                            <FileImage size={48} className="text-[#0d9c06]" />
                          )}
                        </div>

                        {/* File Name */}
                        <p className="text-sm font-medium text-gray-800 truncate" title={resource.name}>
                          {resource.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Click to select
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowResourcePicker(false)}
                  className="w-full px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Curriculum Modal */}
        {showCurriculumModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manage Curriculum</h2>
                  <p className="text-sm text-gray-500">{curriculumCourse?.title}</p>
                </div>
                <button onClick={() => setShowCurriculumModal(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="space-y-6">
                  {curriculumSections.map((section, sIdx) => (
                    <div 
                      key={section.id} 
                      className={`bg-white border border-gray-200 rounded-md overflow-hidden transition-all ${draggedItem?.type === 'section' && draggedItem?.index === sIdx ? 'opacity-50 ring-2 ring-[#0d9c06] border-[#0d9c06]' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'section', sIdx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'section', sIdx)}
                      onDragEnd={() => setDraggedItem(null)}
                    >
                      <div className="bg-gray-100 p-4 border-b border-gray-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="mt-8 text-gray-400 cursor-move hover:text-gray-600" title="Drag to reorder section">
                             <GripVertical size={20} />
                          </div>
                          <div className="flex-1">
                             <label className="block text-xs font-semibold text-gray-700 mb-1">Section Name</label>
                             <input
                                type="text"
                                value={section.title}
                                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#0d9c06] focus:ring-1 focus:ring-[#0d9c06]"
                                placeholder="e.g. Introduction to Course"
                              />
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <span className="text-xs text-gray-500 whitespace-nowrap">{section.lectures.length} lectures</span>
                            <button 
                              onClick={() => deleteSection(section.id)}
                              className="text-red-500 hover:bg-[#ffd8d8] p-2 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                            <button
                              onClick={() => openQuizModal(section.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                section.quiz && section.quiz.length > 0 
                                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <HelpCircle size={14} />
                              {section.quiz && section.quiz.length > 0 ? `Edit Quiz (${section.quiz.length})` : 'Add Quiz'}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {section.lectures.map((lecture, lIdx) => (
                          <div 
                            key={lecture.id} 
                            className={`bg-white border border-gray-200 rounded-md overflow-hidden group hover:border-gray-300 transition-colors ${draggedItem?.type === 'lecture' && draggedItem?.index === lIdx && draggedItem?.sectionIndex === sIdx ? 'opacity-50 ring-2 ring-[#0d9c06]' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'lecture', lIdx, sIdx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'lecture', lIdx, sIdx)}
                            onDragEnd={() => setDraggedItem(null)}
                          >
                            {/* Lecture Header / Summary */}
                            <div className="flex items-center gap-3 p-3 bg-white cursor-pointer hover:bg-gray-50" onClick={() => {
                                const el = document.getElementById(`lecture-content-${lecture.id}`);
                                if (el) el.classList.toggle('hidden');
                            }}>
                              <div className="text-gray-300 group-hover:text-gray-600 cursor-move" title="Drag to reorder lecture" onClick={(e) => e.stopPropagation()}>
                                <GripVertical size={16} />
                              </div>
                              <div className="text-gray-400 group-hover:text-gray-600">
                                <PlayCircle size={16} />
                              </div>
                              <div className="flex-1 font-medium text-sm text-gray-700 flex items-center gap-2">
                                <span>Lecture {lIdx + 1}:</span>
                                <span className="text-gray-900">{lecture.title}</span>
                                {lecture.videoUrl && <FileVideo size={14} className="text-[#0d9c06]" />}
                                {lecture.resources && lecture.resources.length > 0 && <FileText size={14} className="text-blue-500" />}
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteLecture(section.id, lecture.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Lecture"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <ChevronDown size={16} className="text-gray-400" />
                              </div>
                            </div>

                            {/* Lecture Content (Collapsible) */}
                            <div id={`lecture-content-${lecture.id}`} className="hidden border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lecture Title</label>
                                  <input
                                    type="text"
                                    value={lecture.title}
                                    onChange={(e) => updateLecture(section.id, lecture.id, 'title', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0d9c06] focus:ring-1 focus:ring-[#0d9c06]"
                                    placeholder="e.g. Introduction to the topic"
                                  />
                                </div>
                                
                                <div className="col-span-1 md:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                  <textarea
                                    value={lecture.description || ''}
                                    onChange={(e) => updateLecture(section.id, lecture.id, 'description', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0d9c06] focus:ring-1 focus:ring-[#0d9c06]"
                                    placeholder="What will students learn in this lecture?"
                                    rows="2"
                                  />
                                </div>

                                 <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Video Content</label>
                                  <div className="flex flex-col gap-2">
                                    <div className="relative">
                                      <input 
                                        type="text"
                                        placeholder="Paste Video URL (YouTube, Vimeo, Google Drive, etc.)"
                                        value={lecture.videoUrl || ''}
                                        onChange={(e) => updateLecture(section.id, lecture.id, 'videoUrl', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[11px] focus:outline-none focus:border-[#0d9c06] focus:ring-1 focus:ring-[#0d9c06]"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 truncate flex items-center h-[38px]">
                                        {lecture.videoUrl ? (
                                          <span className="flex items-center gap-2 text-[#0d9c06] font-medium text-xs">
                                            <FileVideo size={14} />
                                            Content Connected
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 italic text-xs">No content connected</span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => openResourcePicker('video', { sectionId: section.id, lectureId: lecture.id })}
                                        className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 hover:text-[#0d9c06] hover:border-[#0d9c06] transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer h-[38px]"
                                      >
                                        <FileVideo size={14} />
                                        Select from Drive
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
                                  <input
                                    type="text"
                                    value={lecture.duration}
                                    onChange={(e) => updateLecture(section.id, lecture.id, 'duration', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0d9c06] focus:ring-1 focus:ring-[#0d9c06]"
                                    placeholder="e.g. 10:00"
                                  />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Downloadable Resources</label>
                                  <div className="space-y-2">
                                    {lecture.resources && lecture.resources.map((res, rIdx) => (
                                      <div key={rIdx} className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-md group/res">
                                        <FileText size={14} className="text-gray-400" />
                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-700 truncate">{res.title}</span>
                                          <span className="text-[10px] text-gray-400 truncate border-l border-gray-200 pl-2">{res.url}</span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const newResources = lecture.resources.filter((_, i) => i !== rIdx);
                                            updateLecture(section.id, lecture.id, 'resources', newResources);
                                          }}
                                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover/res:opacity-100 transition-opacity cursor-pointer"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ))}
                                    
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Title"
                                        className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#0d9c06] focus:ring-1 focus:ring-[#0d9c06]"
                                        id={`res-title-${lecture.id}`}
                                      />
                                      <input
                                        type="text"
                                        placeholder="URL"
                                        className="flex-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#0d9c06] focus:ring-1 focus:ring-[#0d9c06]"
                                        id={`res-url-${lecture.id}`}
                                      />
                                      <button
                                        onClick={() => {
                                          const titleInput = document.getElementById(`res-title-${lecture.id}`);
                                          const urlInput = document.getElementById(`res-url-${lecture.id}`);
                                          if (titleInput.value && urlInput.value) {
                                            const newResource = { title: titleInput.value, url: urlInput.value };
                                            const currentResources = lecture.resources || [];
                                            updateLecture(section.id, lecture.id, 'resources', [...currentResources, newResource]);
                                            titleInput.value = '';
                                            urlInput.value = '';
                                          }
                                        }}
                                        className="px-3 py-2 bg-gray-800 text-white rounded-md text-xs font-medium hover:bg-gray-900 transition-colors cursor-pointer"
                                      >
                                        Add Resource
                                      </button>
                                    </div>
                                    
                                    {/* Select from Resources Button */}
                                    <button
                                      onClick={() => openResourcePicker('pdf', { sectionId: section.id, lectureId: lecture.id })}
                                      className="w-full px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
                                    >
                                      <FileText size={14} />
                                      Select PDF from Resources
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => addLecture(section.id)}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-[#0d9c06] hover:text-[#0d9c06] transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus size={16} />
                          Add Lecture
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addSection}
                    className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-[#0d9c06] hover:text-[#0d9c06] transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus size={20} />
                    Add New Section
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowCurriculumModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurriculum}
                  className="px-6 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Section Confirmation Modal */}
        {showDeleteSectionModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl transform transition-all scale-100">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Section?</h3>
              <p className="text-center text-gray-500 mb-6">
                Are you sure you want to delete this section? All lectures within it will also be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteSectionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSection}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors shadow-sm cursor-pointer"
                >
                  Delete Section
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Editor Modal */}
        {showQuizModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-70 p-4">
             <div className="bg-white rounded-md shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
               <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50 rounded-t-xl">
                 <div>
                   <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <HelpCircle className="text-[#0d9c06]" />
                     Quiz Editor
                   </h2>
                   <p className="text-sm text-gray-500">Add checklist/MCQs for this section</p>
                 </div>
                 <button 
                   onClick={() => setShowQuizModal(false)}
                   className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 rounded-full hover:bg-white/50"
                 >
                   <X size={24} />
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                 {currentQuiz.length === 0 ? (
                   <div className="text-center py-10 bg-white rounded-md border-2 border-dashed border-gray-300">
                     <HelpCircle size={48} className="mx-auto text-gray-300 mb-3" />
                     <p className="text-gray-500 font-medium">No questions added yet</p>
                     <p className="text-gray-400 text-sm mb-4">Create a quiz to test student knowledge</p>
                     <button
                       onClick={addQuestion}
                       className="px-4 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0d9c06] transition-colors font-medium text-sm cursor-pointer"
                     >
                       + Add First Question
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-6">
                     {currentQuiz.map((q, qIdx) => (
                       <div key={q.id} className="bg-white p-5 rounded-md border border-gray-200 shadow-sm relative group">
                         <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                             onClick={() => deleteQuestion(qIdx)}
                             className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded cursor-pointer"
                             title="Delete Question"
                           >
                             <Trash2 size={18} />
                           </button>
                         </div>
                         
                         <div className="mb-4 pr-8">
                           <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                             Question {qIdx + 1}
                           </label>
                           <input
                             type="text"
                             value={q.question}
                             onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                             className="w-full border-b-2 border-gray-200 focus:border-[#0d9c06] focus:outline-none py-2 text-gray-800 font-medium transition-colors bg-transparent placeholder-gray-400"
                             placeholder="Enter your question here..."
                           />
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {q.options.map((opt, oIdx) => (
                             <div key={oIdx} className="flex items-center gap-3">
                               <input
                                 type="radio"
                                 name={`correct-answer-${q.id}`}
                                 checked={q.answer === opt && opt !== ""}
                                 onChange={() => updateQuestion(qIdx, 'answer', opt)}
                                 className="w-4 h-4 text-[#0d9c06] focus:ring-[#0d9c06] cursor-pointer"
                                 title="Mark as correct answer"
                                 disabled={!opt}
                               />
                               <input
                                 type="text"
                                 value={opt}
                                 onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                 className={`flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all ${
                                   q.answer === opt && opt !== "" 
                                     ? 'border-[#0d9c06] ring-[#0d9c06] bg-[#0d9c06]' 
                                     : 'focus:border-[#0d9c06] focus:ring-[#0d9c06]'
                                 }`}
                                 placeholder={`Option ${oIdx + 1}`}
                               />
                             </div>
                           ))}
                         </div>
                         
                         <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                           <span>Select the radio button next to the correct answer.</span>
                           {(!q.answer || !q.options.includes(q.answer)) && (
                             <span className="text-amber-600 font-medium flex items-center gap-1">
                               <AlertTriangle size={12} />
                               Select a correct answer
                             </span>
                           )}
                         </div>
                       </div>
                     ))}
                     
                     <button
                       onClick={addQuestion}
                       className="w-full py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-[#0d9c06] hover:text-[#0d9c06] hover:bg-[#0c8506] transition-all font-medium flex items-center justify-center gap-2 cursor-pointer"
                     >
                       <Plus size={18} />
                       Add Another Question
                     </button>
                   </div>
                 )}
               </div>
               
               <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white rounded-b-xl">
                 <button
                   onClick={() => setShowQuizModal(false)}
                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors cursor-pointer"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={saveQuiz}
                   className="px-6 py-2 bg-[#0d9c06] hover:bg-[#0c8506] text-white rounded-md font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                 >
                   <Save size={18} />
                   Save Quiz
                 </button>
               </div>
             </div>
          </div>
        )}
        
        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="p-6 border-b border-gray-100 bg-linear-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full mb-4">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-900">Success!</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-center text-gray-700 text-lg">
                  {successMessage}
                </p>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-[#0d9c06] text-white px-4 py-3 rounded-md hover:bg-[#0b7e05] font-medium transition-colors cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Courses Confirmation Modal */}
        {showDeleteCoursesModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="p-6 border-b border-gray-100 bg-linear-to-r from-red-50 to-orange-50">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-900">Delete Courses?</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-center text-gray-700">
                  Are you sure you want to delete <strong>{selectedCourses.length}</strong> course(s)?
                </p>
                <p className="text-center text-sm text-gray-500">
                  This action cannot be undone. All course data will be permanently removed.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowDeleteCoursesModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteCourses}
                    className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-md hover:bg-red-700 font-medium shadow-sm transition-colors cursor-pointer"
                  >
                    Delete Courses
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
