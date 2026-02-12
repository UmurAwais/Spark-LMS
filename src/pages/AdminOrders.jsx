import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, ArrowUpRight, ArrowDownRight, Image, X, CheckCircle, Trash2 } from "lucide-react";
import { apiFetch, config } from "../config";
import { AdminTableSkeleton } from "../components/SkeletonLoaders";

export default function AdminOrders(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    thisMonthOrders: 0,
    lastMonthOrders: 0,
    courseBreakdown: {}
  });
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const [statusModal, setStatusModal] = useState({ show: false, order: null, newStatus: '' });

  useEffect(()=>{
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  },[]);

  async function fetchOrders(){
    try{
      const res = await apiFetch('/api/orders', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();
      
      if (data.ok && data.orders) {
        // Sort by createdAt (newest first)
        const sortedOrders = data.orders.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setOrders(sortedOrders);
        calculateAnalytics(sortedOrders);
      }
    }catch(e){
      console.error("Error fetching orders:", e);
    }
  }

  function openStatusModal(order, newStatus) {
    setStatusModal({ show: true, order, newStatus });
  }

  async function confirmStatusChange() {
    const { order, newStatus } = statusModal;
    if (!order) return;

    try {
      const res = await apiFetch(`/api/admin/orders/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (data.ok) {
        fetchOrders(); // Refresh
        setStatusModal({ show: false, order: null, newStatus: '' });
      } else {
        alert("Failed to update status: " + data.message);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error updating status");
    }
  }

  async function handleDeleteOrder(id) {
    if (!window.confirm("🗑️ Are you sure you want to delete this order? This action cannot be undone.")) return;

    try {
      const res = await apiFetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();

      if (data.ok) {
        // Refresh orders
        fetchOrders();
      } else {
        alert("Failed to delete order: " + data.message);
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Error deleting order");
    }
  }

  function calculateAnalytics(ordersData) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalRevenue = 0;
    let thisMonthCount = 0;
    let lastMonthCount = 0;
    let pendingCount = 0;
    const courseCount = {};

    ordersData.forEach(order => {
      // Calculate revenue (extract number from amount string like "Rs. 13,000")
      const amountStr = String(order.amount || "0");
      const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, '')) || 0;
      
      if (order.status === 'Approved') {
        totalRevenue += numericAmount;
      }

      // Count pending orders
      if (order.status === 'Pending' || !order.status) {
        pendingCount++;
      }

      // Count orders by month
      const orderDate = new Date(order.createdAt);
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        thisMonthCount++;
      }
      if (orderDate.getMonth() === currentMonth - 1 && orderDate.getFullYear() === currentYear) {
        lastMonthCount++;
      }

      // Course breakdown
      const courseTitle = order.courseTitle || 'Unknown';
      courseCount[courseTitle] = (courseCount[courseTitle] || 0) + 1;
    });

    const avgOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0;

    setAnalytics({
      totalOrders: ordersData.length,
      totalRevenue,
      averageOrderValue: avgOrderValue,
      pendingOrders: pendingCount,
      thisMonthOrders: thisMonthCount,
      lastMonthOrders: lastMonthCount,
      courseBreakdown: courseCount
    });
  }

  const growthRate = analytics.lastMonthOrders > 0 
    ? ((analytics.thisMonthOrders - analytics.lastMonthOrders) / analytics.lastMonthOrders * 100).toFixed(1)
    : 0;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <ShoppingCart className="text-[#0d9c06]" />
          Orders Analytics
        </h1>
        <p className="text-gray-600">Track and analyze your student enrollments and revenue</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <ShoppingCart size={24} />
            </div>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Orders</h3>
          <p className="text-3xl font-bold">{analytics.totalOrders}</p>
          <p className="text-xs mt-2 opacity-80">All time enrollments</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-linear-to-br from-[#5022C3] to-[#3d1a99] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold">Rs. {analytics.totalRevenue.toLocaleString()}</p>
          <p className="text-xs mt-2 opacity-80">Total earnings</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-linear-to-br from-[#f4c150] to-[#d4a840] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <Calendar size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Pending Orders</h3>
          <p className="text-3xl font-bold">{analytics.pendingOrders}</p>
          <p className="text-xs mt-2 opacity-80">Needs approval</p>
        </div>

        {/* This Month */}
        <div className="bg-linear-to-br from-[#1c1d1f] to-[#2d2e30] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <Users size={24} />
            </div>
            {growthRate >= 0 ? (
              <ArrowUpRight size={20} className="text-green-400" />
            ) : (
              <ArrowDownRight size={20} className="text-red-400" />
            )}
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">This Month</h3>
          <p className="text-3xl font-bold">{analytics.thisMonthOrders}</p>
          <p className={`text-xs mt-2 flex items-center gap-1 ${growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate)}% from last month
          </p>
        </div>
      </div>

      {/* Course Breakdown */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Orders by Course</h2>
        <div className="space-y-4">
          {Object.entries(analytics.courseBreakdown).map(([course, count]) => {
            const percentage = (count / analytics.totalOrders * 100).toFixed(1);
            return (
              <div key={course} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{course}</span>
                  <span className="text-sm text-gray-500">{count} orders ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-linear-to-r from-[#0d9c06] to-[#5022C3] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          {Object.keys(analytics.courseBreakdown).length === 0 && (
            <p className="text-gray-500 text-center py-4">No course data available</p>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="p-4">Student Name</th>
                <th className="p-4">City</th>
                <th className="p-4">Course</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment SS</th>
                <th className="p-4">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                orders.slice(0, 10).map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-[14px] text-gray-900">{o.firstName} {o.lastName}</div>
                      <div className="text-xs text-gray-500">{o.email}</div>
                    </td>
                    <td className="p-4 text-[12px] text-gray-700">{o.city || 'N/A'}</td>
                    <td className="p-4 text-[12px] text-gray-700">{o.courseTitle || 'N/A'}</td>
                    <td className="p-4 text-[13px] text-gray-600">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {o.amount ? (String(o.amount).includes('Rs.') ? o.amount : `Rs. ${parseInt(o.amount).toLocaleString()}`) : 'Rs. 0'}
                    </td>
                    <td className="p-4">
                      {o.paymentScreenshot ? (
                        <button
                          onClick={() => {
                            // Directly use the stored URL (Firebase Storage URL)
                            console.log('Opening Screenshot:', o.paymentScreenshot);
                            setSelectedScreenshot(o.paymentScreenshot);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Image size={14} />
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No screenshot</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          o.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          o.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {o.status || 'Pending'}
                        </span>
                        {o.status !== 'Approved' ? (
                          <button
                            onClick={() => openStatusModal(o, 'Approved')}
                            className="px-3 py-1.5 bg-[#0d9c06] text-white text-xs font-medium rounded-md hover:bg-[#0b7e05] transition-colors shadow-sm cursor-pointer"
                          >
                            Give Access
                          </button>
                        ) : (
                          <button
                            onClick={() => openStatusModal(o, 'Pending')}
                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(o._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer group"
                          title="Delete Order"
                        >
                          <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {orders.length > 10 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">Showing 10 of {orders.length} orders</p>
          </div>
        )}
      </div>

      {/* Payment Screenshot Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div 
            className="relative bg-white rounded-md shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Image size={20} className="text-[#0d9c06]" />
                Payment Screenshot
              </h3>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="flex items-center justify-center bg-gray-100 rounded-md p-4">
                {(() => {
                  const imageUrl = selectedScreenshot.startsWith('http') 
                    ? selectedScreenshot 
                    : `${config.apiUrl}${selectedScreenshot}`;
                  
                  return (
                    <>
                      <img
                        src={imageUrl}
                        alt="Payment Screenshot"
                        className="max-w-full h-auto rounded-md shadow-lg"
                        onError={(e) => {
                          console.error('Failed to load image:', imageUrl);
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <div style={{ display: 'none' }} className="text-center p-8">
                        <p className="text-red-600 font-semibold mb-2">❌ Failed to load image</p>
                        <p className="text-sm text-gray-600 mb-4">The screenshot could not be loaded from:</p>
                        <code className="block bg-gray-200 p-3 rounded text-xs break-all">{imageUrl}</code>
                        <p className="text-xs text-gray-500 mt-4">Please check if the file exists on the server.</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Download/Open Link */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <a
                  href={selectedScreenshot.startsWith('http') ? selectedScreenshot : `${config.apiUrl}${selectedScreenshot}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9c06] hover:bg-[#0b7e05] text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  <ArrowUpRight size={16} />
                  Open in New Tab
                </a>
                <button
                  onClick={() => {
                    const fullUrl = selectedScreenshot.startsWith('http') 
                      ? selectedScreenshot 
                      : `${config.apiUrl}${selectedScreenshot}`;
                    navigator.clipboard.writeText(fullUrl);
                    alert('URL copied to clipboard!');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {statusModal.show && statusModal.order && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${statusModal.newStatus === 'Approved' ? 'bg-linear-to-r from-[#0d9c06] to-[#0b7e05]' : 'bg-linear-to-r from-red-600 to-red-700'} text-white`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {statusModal.newStatus === 'Approved' ? 'Confirm Access' : 'Revoke Access'}
              </h2>
              <button
                onClick={() => setStatusModal({ show: false, order: null, newStatus: '' })}
                className="text-white hover:bg-white/20 p-2 rounded-md transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-lg">
                Are you sure you want to <span className="font-bold">{statusModal.newStatus === 'Approved' ? 'give access' : 'revoke access'}</span> for:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md space-y-2 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Student:</span>
                  <span className="font-medium text-gray-900">{statusModal.order.firstName} {statusModal.order.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Enrolled Course:</span>
                  <span className="font-medium text-gray-900">{statusModal.order.courseTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Paid Amount:</span>
                  <span className="font-medium text-gray-900">{statusModal.order.amount}</span>
                </div>
              </div>

              {statusModal.newStatus === 'Approved' && (
                <div className="flex items-start gap-3 p-3 bg-green-50 text-green-800 rounded-md text-sm">
                  <CheckCircle size={18} className="mt-0.5 shrink-0" />
                  <p>This will immediately allow the student to access the course content from their dashboard.</p>
                </div>
              )}
              
              {statusModal.newStatus === 'Pending' && (
                <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                  <X size={18} className="mt-0.5 shrink-0" />
                  <p>The student will lose access to the course content immediately.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setStatusModal({ show: false, order: null, newStatus: '' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-6 py-2 text-white rounded-md font-medium transition-colors shadow-sm cursor-pointer ${
                  statusModal.newStatus === 'Approved' 
                    ? 'bg-[#0d9c06] hover:bg-[#0b7e05]' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {statusModal.newStatus === 'Approved' ? 'Access' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
