import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Image, 
  X, 
  CheckCircle, 
  Trash2, 
  Filter, 
  Ticket, 
  ShoppingBag 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer 
} from 'recharts';
import { apiFetch, config } from "../config";
import { AdminTableSkeleton } from "../components/SkeletonLoaders";

const MetricCard = ({ title, value, label, icon, color, growth, data }) => {
  const colors = {
    green: { bg: "bg-emerald-50/50", icon: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-100", chart: "#10b981" },
    blue: { bg: "bg-blue-50/50", icon: "bg-blue-500", text: "text-blue-700", border: "border-blue-100", chart: "#3b82f6" },
    amber: { bg: "bg-amber-50/50", icon: "bg-amber-500", text: "text-amber-700", border: "border-amber-100", chart: "#f59e0b" },
    indigo: { bg: "bg-indigo-50/50", icon: "bg-indigo-500", text: "text-indigo-700", border: "border-indigo-100", chart: "#6366f1" }
  };

  const theme = colors[color] || colors.green;

  return (
    <div className="relative group bg-white p-6 rounded-md border border-gray-100 shadow-xs hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 overflow-hidden font-sora">
      {/* Decorative Gradient Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${theme.icon}`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`w-12 h-12 rounded-2xl ${theme.icon} text-white flex items-center justify-center shadow-lg shadow-gray-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
            {icon}
          </div>
          {growth !== undefined && (
            <div className={`flex items-center gap-1.5 text-[11px] font-black py-1 px-3 rounded-full border ${growth >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              <TrendingUp size={12} className={growth < 0 ? "rotate-180" : ""} />
              <span>{Math.abs(growth)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{title}</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
          </div>
          <p className="text-xs text-gray-500 font-bold tracking-tight opacity-70">{label}</p>
        </div>

        {/* Activity Sparkline */}
        <div className="h-10 mt-6 w-full opacity-40 group-hover:opacity-100 transition-opacity duration-500">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || [{v:10}, {v:15}, {v:12}, {v:18}, {v:14}, {v:22}, {v:20}]}>
              <defs>
                <linearGradient id={`sparkChart-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.chart} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={theme.chart} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey={data ? "amount" : "v"} 
                stroke={theme.chart} 
                strokeWidth={2} 
                fill={`url(#sparkChart-${color})`} 
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

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
  const [filter, setFilter] = useState('all'); // all, coupon, regular
  const [displayOrders, setDisplayOrders] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const [statusModal, setStatusModal] = useState({ show: false, order: null, newStatus: '' });

  useEffect(()=>{
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll less frequently
    return () => clearInterval(interval);
  },[]);

  // Update filtered orders and analytics when orders or filter change
  useEffect(() => {
    let filtered = [...orders];
    if (filter === 'coupon') {
      filtered = filtered.filter(o => o.couponCode);
    } else if (filter === 'regular') {
      filtered = filtered.filter(o => !o.couponCode);
    }
    setDisplayOrders(filtered);
    calculateAnalytics(filtered);
  }, [orders, filter]);

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
        // analytics will be updated by the useEffect hook
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <ShoppingCart className="text-[#0d9c06]" />
            Orders Management
          </h1>
          <p className="text-gray-600">Track and analyze your student enrollments and revenue</p>
        </div>

        {/* Filter Bar */}
        <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
          <button 
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-[#0d9c06] text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter size={16} />
            All Orders
          </button>
          <button 
            onClick={() => setFilter('coupon')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              filter === 'coupon' 
                ? 'bg-[#5022C3] text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Ticket size={16} />
            Coupon Orders
          </button>
          <button 
            onClick={() => setFilter('regular')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              filter === 'regular' 
                ? 'bg-[#1c1d1f] text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag size={16} />
            Regular Orders
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Orders"
          value={analytics.totalOrders}
          label="All time enrollments"
          icon={<ShoppingCart size={24} />}
          color="green"
          data={orders.slice(-7).map((o, i) => ({ v: i + 5 }))}
        />
        <MetricCard
          title="Total Revenue"
          value={`Rs. ${analytics.totalRevenue.toLocaleString()}`}
          label="Total earnings"
          icon={<DollarSign size={24} />}
          color="blue"
          data={orders.slice(-30).filter(o => o.status === 'Approved').map(o => ({ v: parseInt(String(o.amount || 0).replace(/[^0-9]/g, '')) }))}
        />
        <MetricCard
          title="Pending Orders"
          value={analytics.pendingOrders}
          label="Needs approval"
          icon={<Calendar size={24} />}
          color="amber"
          data={orders.filter(o => o.status === 'Pending').slice(-10).map((_, i) => ({ v: 10 - i }))}
        />
        <MetricCard
          title="Orders This Month"
          value={analytics.thisMonthOrders}
          label="New enrollments"
          icon={<Users size={24} />}
          color="indigo"
          growth={growthRate}
          data={orders.slice(-15).map((_, i) => ({ v: Math.sin(i) * 10 + 20 }))}
        />
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
                <th className="p-4">Coupon</th>
                <th className="p-4">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">No {filter !== 'all' ? filter : ''} orders found.</td>
                </tr>
              ) : (
                displayOrders.map((o) => (
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
                      {o.couponCode ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-100">
                          <Ticket size={10} />
                          {o.couponCode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">None</span>
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
