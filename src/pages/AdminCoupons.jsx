import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Search, Ticket } from 'lucide-react';
import { apiFetch } from '../config';
import { useNotifications } from '../context/NotificationContext';
import AdminLayout from '../components/AdminLayout';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addNotification } = useNotifications();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState({
    code: '',
    type: 'percent',
    value: '',
    label: '',
    isActive: true,
    expiryDate: ''
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/coupons', {
        headers: { 'x-admin-token': localStorage.getItem('admin_token') }
      });
      const data = await res.json();
      console.log('AdminCoupons: Fetched coupons:', data);
      if (data.ok) {
        setCoupons(data.coupons || []);
      } else {
        console.error('AdminCoupons: Fetch failed:', data.error || data.message);
        addNotification({ type: 'error', title: 'Error', message: data.error || data.message || 'Failed to fetch coupons' });
      }
    } catch (err) {
      console.error('AdminCoupons: Network error fetching coupons:', err);
      addNotification({ type: 'error', title: 'Error', message: 'Network error: Failed to fetch coupons' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data
      const payload = { ...currentCoupon };
      payload.value = Number(payload.value);
      if (!payload.expiryDate) delete payload.expiryDate;

      const url = isEditing ? `/api/admin/coupons/${currentCoupon._id}` : '/api/admin/coupons';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log(`AdminCoupons: ${method} to ${url}`, payload);

      const res = await apiFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': localStorage.getItem('admin_token')
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.ok) {
        addNotification({ 
          type: 'success', 
          title: 'Success', 
          message: isEditing ? 'Coupon updated' : 'Coupon created' 
        });
        setShowModal(false);
        fetchCoupons();
      } else {
        console.error('AdminCoupons: Submit failed:', data);
        addNotification({ type: 'error', title: 'Error', message: data.error || data.message || 'Action failed' });
      }
    } catch (err) {
      console.error('AdminCoupons: Submit error:', err);
      addNotification({ type: 'error', title: 'Error', message: 'Network error or server failed' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const res = await apiFetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': localStorage.getItem('admin_token') }
      });
      const data = await res.json();
      if (data.ok) {
        addNotification({ type: 'success', title: 'Deleted', message: 'Coupon deleted successfully' });
        fetchCoupons();
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete' });
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search coupons..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setIsEditing(false);
              setCurrentCoupon({ code: '', type: 'percent', value: '', label: '', isActive: true, expiryDate: '' });
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#0d9c06] text-white px-4 py-2 rounded-md hover:bg-[#0b7e05] transition-all font-medium whitespace-nowrap"
          >
            <Plus size={20} />
            Add New Coupon
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9c06]"></div>
          </div>
        ) : (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden text-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Label</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Expiry</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-gray-500">No coupons found</td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{coupon.code}</td>
                        <td className="px-6 py-4 text-gray-600">{coupon.label}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${coupon.type === 'percent' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {coupon.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {coupon.type === 'percent' ? `${coupon.value}%` : `Rs. ${coupon.value.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {coupon.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <CheckCircle size={14} /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 font-medium">
                              <XCircle size={14} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No Limit'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setIsEditing(true);
                                setCurrentCoupon(coupon);
                                setShowModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(coupon._id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-999">
            <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
              <div className="bg-linear-to-r from-[#0d9c06] to-[#0b7e05] px-6 py-4 flex items-center justify-between text-white">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Ticket size={24} />
                  {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
                </h3>
                <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-md transition-all">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="spark-input-group">
                  <input 
                    type="text" 
                    required 
                    placeholder=" " 
                    className="input-field"
                    value={currentCoupon.code}
                    onChange={(e) => setCurrentCoupon({...currentCoupon, code: e.target.value})}
                  />
                  <Ticket className="spark-input-icon" />
                  <label className="floating-label">Coupon Code (e.g. SAVE20)</label>
                </div>

                <div className="spark-input-group">
                  <input 
                    type="text" 
                    required 
                    placeholder=" " 
                    className="input-field"
                    value={currentCoupon.label}
                    onChange={(e) => setCurrentCoupon({...currentCoupon, label: e.target.value})}
                  />
                  <label className="floating-label">Label (e.g. 20% Discount)</label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="spark-input-group">
                    <select 
                      className="input-field"
                      value={currentCoupon.type}
                      onChange={(e) => setCurrentCoupon({...currentCoupon, type: e.target.value})}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (Rs.)</option>
                    </select>
                    <label className="floating-label">Type</label>
                  </div>
                  <div className="spark-input-group">
                    <input 
                      type="number" 
                      required 
                      placeholder=" " 
                      className="input-field"
                      value={currentCoupon.value}
                      onChange={(e) => setCurrentCoupon({...currentCoupon, value: e.target.value})}
                    />
                    <label className="floating-label">Value</label>
                  </div>
                </div>

                <div className="spark-input-group">
                  <input 
                    type="date" 
                    placeholder=" " 
                    className="input-field"
                    value={currentCoupon.expiryDate ? currentCoupon.expiryDate.split('T')[0] : ''}
                    onChange={(e) => setCurrentCoupon({...currentCoupon, expiryDate: e.target.value})}
                  />
                  <label className="floating-label">Expiry Date (Optional)</label>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-md">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    className="h-5 w-5 rounded border-gray-300 text-[#0d9c06] focus:ring-[#0d9c06] cursor-pointer"
                    checked={currentCoupon.isActive}
                    onChange={(e) => setCurrentCoupon({...currentCoupon, isActive: e.target.checked})}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Coupon is active and ready to use
                  </label>
                </div>

                <div className="pt-2">
                  <button type="submit" className="spark-submit-btn w-full cursor-pointer">
                    {isEditing ? 'Save Changes' : 'Create Coupon'}
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
