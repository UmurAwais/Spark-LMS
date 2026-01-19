import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { 
  DollarSign, 
  Users, 
  BookOpen, 
  TrendingUp, 
  ShoppingCart,
  ArrowUpRight,
  Calendar,
  Award,
  LayoutDashboard,
  ChevronDown,
  Image,
  X
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { apiFetch, config } from "../config";
import { AdminDashboardSkeleton } from "../components/SkeletonLoaders";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    students: 0,
    courses: 0,
    orders: 0,
    thisMonth: 0,
    lastMonth: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  
  // Graph State
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 28d, 90d, 365d, all
  const [chartData, setChartData] = useState([]);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showProTip, setShowProTip] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await apiFetch('/api/orders', {
          headers: { "x-admin-token": localStorage.getItem("admin_token") }
        });
        const data = await res.json();
        
        if (data.ok && data.orders) {
          setAllOrders(data.orders);
          
          let totalRevenue = 0;
          let uniqueStudents = new Set();
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          let thisMonthCount = 0;
          let lastMonthCount = 0;
          
          data.orders.forEach((order) => {
            // Robust amount parsing
            let amount = 0;
            if (order.amount) {
              const amountStr = String(order.amount);
              // Remove non-numeric chars except decimal point if needed (though we use integers here)
              const cleanAmount = amountStr.replace(/[^0-9]/g, '');
              amount = parseInt(cleanAmount) || 0;
            }
            
            totalRevenue += amount;
            
            if (order.email) uniqueStudents.add(order.email);

            // Count orders by month
            const orderDate = new Date(order.createdAt);
            if (!isNaN(orderDate.getTime())) {
              if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                thisMonthCount++;
              }
              if (orderDate.getMonth() === currentMonth - 1 && orderDate.getFullYear() === currentYear) {
                lastMonthCount++;
              }
            }
          });

          setMetrics({
            revenue: totalRevenue,
            students: uniqueStudents.size,
            courses: 12, // You can fetch this from courses API
            orders: data.orders.length,
            thisMonth: thisMonthCount,
            lastMonth: lastMonthCount
          });

          // Get recent 5 orders
          const sortedOrders = [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRecentOrders(sortedOrders.slice(0, 5));
        }
      } catch (e) {
        console.error("Error fetching metrics:", e);
      }
    }
    
    // Initial fetch
    fetchMetrics();

    // Poll every 5 seconds
    const intervalId = setInterval(fetchMetrics, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Update chart data when timeRange or allOrders changes
  useEffect(() => {
    // Always generate chart data, even if orders is empty (it will just show 0s)
    const data = getChartData(allOrders, timeRange);
    setChartData(data);
  }, [allOrders, timeRange]);

  // Pro Tips array - randomly selected on each page load
  const proTips = [
    {
      icon: Award,
      title: "Boost Enrollment",
      message: "Students who watch preview lectures are 3x more likely to enroll. Make sure to add engaging preview content!",
      action: "Update Courses",
      link: "/admin/courses"
    },
    {
      icon: Users,
      title: "Engage Your Students",
      message: "Regular communication increases course completion rates by 40%. Send updates and encouragement to your students!",
      action: "View Users",
      link: "/admin/users"
    },
    {
      icon: TrendingUp,
      title: "Optimize Pricing",
      message: "Courses priced between Rs. 5,000-15,000 have the highest conversion rates. Consider your target audience when pricing.",
      action: "Manage Courses",
      link: "/admin/courses"
    },
    {
      icon: BookOpen,
      title: "Quality Content",
      message: "Courses with 10+ lectures and 2+ hours of content receive 60% more positive reviews. Quality over quantity!",
      action: "Add Content",
      link: "/admin/drive"
    },
    {
      icon: Award,
      title: "Student Success",
      message: "Providing downloadable resources increases student satisfaction by 35%. Add PDFs, worksheets, and templates!",
      action: "Upload Resources",
      link: "/admin/drive"
    },
    {
      icon: TrendingUp,
      title: "Marketing Tip",
      message: "Courses with clear learning outcomes in descriptions convert 50% better. Be specific about what students will learn!",
      action: "Edit Courses",
      link: "/admin/courses"
    }
  ];

  // Select a random tip on component mount
  const [currentTip] = useState(() => proTips[Math.floor(Math.random() * proTips.length)]);

  function getChartData(orders, range) {
    const now = new Date();
    let startDate = new Date();
    
    // Determine start date based on range
    switch(range) {
      case '7d': startDate.setDate(now.getDate() - 6); break;
      case '28d': startDate.setDate(now.getDate() - 27); break;
      case '90d': startDate.setDate(now.getDate() - 89); break;
      case '365d': startDate.setDate(now.getDate() - 364); break;
      case 'all': 
        if (orders.length > 0) {
          const validDates = orders
            .map(o => new Date(o.createdAt))
            .filter(d => !isNaN(d.getTime()));
          
          if (validDates.length > 0) {
            const earliest = new Date(Math.min(...validDates));
            startDate = earliest;
          } else {
            startDate.setDate(now.getDate() - 30);
          }
        } else {
          startDate.setDate(now.getDate() - 30);
        }
        break;
      default: startDate.setDate(now.getDate() - 6);
    }
    
    // Reset hours to start of day
    startDate.setHours(0,0,0,0);
    now.setHours(23,59,59,999);

    const dataMap = new Map();
    
    // Initialize map with all dates in range
    const currentDate = new Date(startDate);
    // Safety check to prevent infinite loop if dates are messed up
    const maxIterations = 365 * 5; 
    let iterations = 0;
    
    while (currentDate <= now && iterations < maxIterations) {
        const dateKey = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dataMap.set(dateKey, 0);
        currentDate.setDate(currentDate.getDate() + 1);
        iterations++;
    }

    // Fill with data
    orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (!isNaN(orderDate.getTime()) && orderDate >= startDate && orderDate <= now) {
            const dateKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
             // Parse amount
            let amount = 0;
            if (order.amount) {
              const amountStr = String(order.amount);
              const cleanAmount = amountStr.replace(/[^0-9]/g, '');
              amount = parseInt(cleanAmount) || 0;
            }
            
            if (dataMap.has(dateKey)) {
                dataMap.set(dateKey, dataMap.get(dateKey) + amount);
            }
        }
    });

    return Array.from(dataMap).map(([date, amount]) => ({ date, amount }));
  }

  const growthRate = metrics.lastMonth > 0 
    ? ((metrics.thisMonth - metrics.lastMonth) / metrics.lastMonth * 100).toFixed(1)
    : 0;

  const timeRangeLabels = {
    '7d': 'Last 7 days',
    '28d': 'Last 28 days',
    '90d': 'Last 90 days',
    '365d': 'Last 365 days',
    'all': 'Lifetime'
  };



  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <LayoutDashboard className="text-[#0d9c06]" />
          Dashboard Overview
        </h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your courses.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold">
            Rs. {metrics.revenue.toLocaleString()}
          </p>
          <p className="text-xs mt-2 opacity-80">Lifetime earnings</p>
        </div>

        {/* Total Students */}
        <div className="bg-linear-to-br from-[#5022C3] to-[#3d1a99] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <Users size={24} />
            </div>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Students</h3>
          <p className="text-3xl font-bold">
            {metrics.students}
          </p>
          <p className="text-xs mt-2 opacity-80">Unique enrollments</p>
        </div>

        {/* Total Courses */}
        <div className="bg-linear-to-br from-[#f4c150] to-[#d4a840] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <BookOpen size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Active Courses</h3>
          <p className="text-3xl font-bold">{metrics.courses}</p>
          <p className="text-xs mt-2 opacity-80">Published courses</p>
        </div>

        {/* This Month */}
        <div className="bg-linear-to-br from-[#1c1d1f] to-[#2d2e30] text-white rounded-md shadow-lg p-6 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm">
              <ShoppingCart size={24} />
            </div>
            {growthRate >= 0 ? (
              <ArrowUpRight size={20} className="text-green-400" />
            ) : (
              <ArrowUpRight size={20} className="text-red-400 rotate-90" />
            )}
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">This Month</h3>
          <p className="text-3xl font-bold">{metrics.thisMonth}</p>
          <p className={`text-xs mt-2 flex items-center gap-1 ${growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate)}% from last month
          </p>
        </div>
      </div>

      {/* Pro Tip Section - Udemy Style */}
      {showProTip && (
        <div className="bg-linear-to-br from-[#0d9c06]/10 to-[#0d9c06]/5 border border-[#0d9c06]/30 rounded-md p-6 mb-8 relative">
          {/* Close Button */}
          <button
            onClick={() => setShowProTip(false)}
            className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-md transition-colors cursor-pointer"
            title="Dismiss tip"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div className="p-3 bg-[#0d9c06] rounded-md shrink-0">
              <currentTip.icon size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{currentTip.title}</h3>
              <p className="text-gray-700 text-sm mb-4">
                {currentTip.message}
              </p>
              <Link 
                to={currentTip.link}
                className="inline-block bg-[#0d9c06] text-white px-4 py-2 rounded-md font-medium hover:bg-[#0b7e05] transition-colors text-sm cursor-pointer"
              >
                {currentTip.action}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Graph Section */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Revenue Analytics</h2>
            <p className="text-sm text-gray-500">Track your earnings over time</p>
          </div>
          
          {/* Time Range Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowTimeMenu(!showTimeMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {timeRangeLabels[timeRange]}
              <ChevronDown size={16} className={`transition-transform ${showTimeMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showTimeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                {Object.entries(timeRangeLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeRange(key);
                      setShowTimeMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      timeRange === key ? 'text-[#0d9c06] font-medium bg-green-50' : 'text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9c06" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0d9c06" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => `Rs.${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }}
                formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#0d9c06" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            <Link 
              to="/admin/orders" 
              className="text-sm text-[#0d9c06] hover:underline font-semibold cursor-pointer"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No orders yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs uppercase text-gray-500 font-semibold">
                    <th className="p-4 text-left">Student</th>
                    <th className="p-4 text-left">Course</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Payment SS</th>
                    <th className="p-4 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {order.firstName} {order.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{order.email}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {order.courseTitle || 'N/A'}
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-900">
                        {order.amount ? (String(order.amount).includes('Rs.') ? order.amount : `Rs. ${parseInt(order.amount).toLocaleString()}`) : 'Rs. 0'}
                      </td>
                      <td className="p-4">
                        {order.paymentScreenshot ? (
                          <button
                            onClick={async () => {
                              // Construct proper URL for screenshot
                              let url = order.paymentScreenshot;
                              
                              // Get the current API URL (wait for detection to complete)
                              const { API_URL_PROMISE } = await import('../config');
                              const apiUrl = await API_URL_PROMISE;
                              
                              // If it's already a full URL (http/https), use as is
                              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                // If it starts with /uploads, prepend API URL
                                if (url.startsWith('/uploads')) {
                                  url = `${apiUrl}${url}`;
                                } else if (url.startsWith('uploads')) {
                                  // Handle case without leading slash
                                  url = `${apiUrl}/${url}`;
                                } else {
                                  // Fallback: prepend API URL
                                  url = `${apiUrl}/${url}`;
                                }
                              }
                              
                              console.log('Constructed Screenshot URL:', url);
                              setSelectedScreenshot(url);
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
                      <td className="p-4 text-sm text-gray-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/admin/courses" 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-[#0d9c06] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0d9c06]/10 rounded-md group-hover:bg-[#0d9c06]/20 transition-colors">
                    <BookOpen size={18} className="text-[#0d9c06]" />
                  </div>
                  <span className="font-medium text-gray-700">Add New Course</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-[#0d9c06]" />
              </Link>

              <Link 
                to="/admin/drive" 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-[#5022C3] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#5022C3]/10 rounded-md group-hover:bg-[#5022C3]/20 transition-colors">
                    <Calendar size={18} className="text-[#5022C3]" />
                  </div>
                  <span className="font-medium text-gray-700">Manage Resources</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-[#5022C3]" />
              </Link>

              <Link 
                to="/admin/users" 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-[#f4c150] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f4c150]/10 rounded-md group-hover:bg-[#f4c150]/20 transition-colors">
                    <Users size={18} className="text-[#f4c150]" />
                  </div>
                  <span className="font-medium text-gray-700">View Users</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-[#f4c150]" />
              </Link>
            </div>
          </div>
        </div>
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
                <img
                  src={selectedScreenshot}
                  alt="Payment Screenshot"
                  className="max-w-full h-auto rounded-md shadow-lg"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />
              </div>
              
              {/* Download/Open Link */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <a
                  href={selectedScreenshot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9c06] hover:bg-[#0b7e05] text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  <ArrowUpRight size={16} />
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
