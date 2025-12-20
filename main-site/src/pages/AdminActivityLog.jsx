import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Search, Filter, Clock, Info, CheckCircle, AlertTriangle, ShoppingCart, Activity } from "lucide-react";
import { apiFetch } from "../config";
import { AdminTableSkeleton } from "../components/SkeletonLoaders";

export default function AdminActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/activity-logs', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || log.type === filterType;

    return matchesSearch && matchesType;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <AlertTriangle className="text-red-500" size={20} />;
      case 'order': return <ShoppingCart className="text-blue-500" size={20} />;
      default: return <Info className="text-gray-500" size={20} />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'order': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminTableSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Activity className="text-[#0d9c06]" />
          Activity Log
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track all system events and user actions</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] bg-white"
          >
            <option value="all">All Events</option>
            <option value="success">Success</option>
            <option value="error">Errors</option>
            <option value="order">Orders</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No activity found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                <div className="mt-1 shrink-0">
                  {getIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {log.title}
                    </p>
                    <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                      <Clock size={14} />
                      {new Date(log.time).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{log.message}</p>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor(log.type)}`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      User: {log.user}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
