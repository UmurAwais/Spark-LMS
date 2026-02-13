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
  X,
  Trash2
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

const MetricCard = ({ title, value, label, icon, color, growth, data }) => {
  const colors = {
    green: { bg: "bg-[#0d9c06]/10", icon: "bg-[#0d9c06]", text: "text-[#0d9c06]", border: "border-[#0d9c06]/20", chart: "#0d9c06" },
    blue: { bg: "bg-[#5022C3]/10", icon: "bg-[#5022C3]", text: "text-[#5022C3]", border: "border-[#5022C3]/20", chart: "#5022C3" },
    amber: { bg: "bg-[#f4c150]/10", icon: "bg-[#f4c150]", text: "text-[#f4c150]", border: "border-[#f4c150]/20", chart: "#f4c150" },
    indigo: { bg: "bg-[#1c1d1f]/10", icon: "bg-[#1c1d1f]", text: "text-[#1c1d1f]", border: "border-[#1c1d1f]/20", chart: "#1c1d1f" }
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
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">{title}</h3>
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

  const fetchMetrics = async () => {
    try {
      const res = await apiFetch('/api/orders', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();

      // Fetch courses count
      let courseCount = 0;
      try {
        const courseRes = await apiFetch('/api/courses');
        const courseData = await courseRes.json();
        if (Array.isArray(courseData)) {
          courseCount = courseData.length;
        } else if (courseData.courses && Array.isArray(courseData.courses)) {
          courseCount = courseData.courses.length;
        }
      } catch (e) {
        console.error("Error fetching courses:", e);
      }
      
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
          
          if (order.status === 'Approved') {
            totalRevenue += amount;
          }
          
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
          courses: courseCount, 
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
  };

  useEffect(() => {
    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 5000);
    return () => clearInterval(intervalId);
  }, []);

  async function handleDeleteOrder(id) {
    if (!window.confirm("🗑️ Are you sure you want to delete this order?")) return;

    try {
      const res = await apiFetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();

      if (data.ok) {
        fetchMetrics();
      } else {
        alert("Failed to delete order: " + data.message);
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Error deleting order");
    }
  }

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
        if (!isNaN(orderDate.getTime()) && orderDate >= startDate && orderDate <= now && order.status === 'Approved') {
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
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative">
        <MetricCard
          title="Total Revenue"
          value={`Rs. ${metrics.revenue.toLocaleString()}`}
          label="Lifetime earnings"
          icon={<DollarSign size={24} />}
          color="green"
          data={chartData.slice(-7)}
        />
        <MetricCard
          title="Total Students"
          value={metrics.students}
          label="Unique enrollments"
          icon={<Users size={24} />}
          color="blue"
        />
        <MetricCard
          title="Active Courses"
          value={metrics.courses}
          label="Published courses"
          icon={<BookOpen size={24} />}
          color="amber"
        />
        <MetricCard
          title="Orders This Month"
          value={metrics.thisMonth}
          label="From all sources"
          icon={<ShoppingCart size={24} />}
          color="indigo"
          growth={growthRate}
          data={chartData.slice(-30)}
        />
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
                    <th className="p-4 text-left">Action</th>
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
                            onClick={() => {
                              // Directly use the stored URL (Firebase Storage URL)
                              console.log('Opening Screenshot:', order.paymentScreenshot);
                              setSelectedScreenshot(order.paymentScreenshot);
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
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteOrder(order._id || order.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer group"
                          title="Delete Order"
                        >
                          <Trash2 size={16} />
                        </button>
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
                {(() => {
                  const imageUrl = selectedScreenshot.startsWith('http') 
                    ? selectedScreenshot 
                    : `${config.apiUrl}${selectedScreenshot}`;
                  
                  return (
                    <img
                      src={imageUrl}
                      alt="Payment Screenshot"
                      className="max-w-full h-auto rounded-md shadow-lg"
                      onError={(e) => {
                        console.error('Failed to load image:', imageUrl);
                        e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                      }}
                    />
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
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
