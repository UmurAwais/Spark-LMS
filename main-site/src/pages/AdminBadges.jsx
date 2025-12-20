import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Trash2, 
  Search, 
  Filter,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { apiFetch } from '../config';
import AdminLayout from '../components/AdminLayout';

export default function AdminBadges() {
  const [badges, setBadges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBadge, setNewBadge] = useState({
    name: '',
    icon: '🏆', // Default icon
    milestoneType: 'percentage',
    milestoneValue: 50,
    courseId: 'all',
    description: ''
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch badges
      const badgesRes = await apiFetch('/api/admin/badges');
      const badgesData = await badgesRes.json();
      if (badgesData.ok) setBadges(badgesData.badges);

      // Fetch online courses
      const onlineRes = await apiFetch('/api/courses/online');
      const onlineData = await onlineRes.json();
      
      console.log('Fetched online courses:', onlineData);

      if (onlineData.ok && Array.isArray(onlineData.courses)) {
        setCourses(onlineData.courses);
      } else {
        console.warn('Online courses data format unexpected:', onlineData);
        setCourses([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddBadge = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBadge)
      });
      const data = await res.json();
      if (data.ok) {
        setBadges([...badges, data.badge]);
        setShowAddModal(false);
        setNewBadge({
            name: '',
            icon: '🏆',
            milestoneType: 'percentage',
            milestoneValue: 50,
            courseId: 'all',
            description: ''
        });
        showNotification('success', 'Badge added successfully');
      } else {
        showNotification('error', data.message || 'Failed to add badge');
      }
    } catch (error) {
      console.error('Error adding badge:', error);
      showNotification('error', 'Failed to add badge');
    }
  };

  const handleDeleteBadge = async (id) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) return;
    try {
      const res = await apiFetch(`/api/admin/badges/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        setBadges(badges.filter(b => b.id !== id));
        showNotification('success', 'Badge deleted successfully');
      } else {
        showNotification('error', data.message || 'Failed to delete badge');
      }
    } catch (error) {
      console.error('Error deleting badge:', error);
      showNotification('error', 'Failed to delete badge');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Award size={24} color="#0d9c06" /> 
            Badges & Milestones</h1>
          <p className="text-gray-500 mt-1">Manage achievement badges for students</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#0d9c06] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#0b7e05] transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Add New Badge
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg flex items-center gap-2 z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Badges Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9c06]"></div>
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No badges yet</h3>
          <p className="text-gray-500 mt-1">Create your first badge to reward students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-white rounded-md shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                  {badge.icon}
                </div>
                <button 
                  onClick={() => handleDeleteBadge(badge.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-1">{badge.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{badge.description}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Milestone:</span>
                  <span className="font-medium text-gray-900">{badge.milestoneValue}% Completion</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Course:</span>
                  <span className="font-medium text-gray-900 truncate max-w-[150px]" title={badge.courseId === 'all' ? 'All Courses' : courses.find(c => c.id === badge.courseId)?.title || badge.courseId}>
                    {badge.courseId === 'all' ? 'All Courses' : courses.find(c => c.id === badge.courseId)?.title || 'Unknown Course'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Badge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Add New Badge</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddBadge}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge Name</label>
                  <input 
                    type="text" 
                    required
                    value={newBadge.name}
                    onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                    placeholder="e.g. Course Master"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                  <input 
                    type="text" 
                    required
                    value={newBadge.icon}
                    onChange={(e) => setNewBadge({...newBadge, icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                    placeholder="e.g. 🏆"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={newBadge.description}
                    onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                    rows="2"
                    placeholder="Brief description of the achievement"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Type</label>
                    <select 
                      value={newBadge.milestoneType}
                      onChange={(e) => setNewBadge({...newBadge, milestoneType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                    >
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (%)</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max="100"
                      value={newBadge.milestoneValue}
                      onChange={(e) => setNewBadge({...newBadge, milestoneValue: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select 
                    value={newBadge.courseId}
                    onChange={(e) => setNewBadge({...newBadge, courseId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer font-medium border border-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] transition-colors cursor-pointer font-medium shadow-sm hover:shadow-md border border-gray-300"
                >
                  Create Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
