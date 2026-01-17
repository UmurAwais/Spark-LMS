import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Search, UserPlus, Mail, Trash2, RefreshCw, Ban, CheckCircle, AlertTriangle, X, Users, Loader2, Download, ChevronDown } from "lucide-react";
import { apiFetch } from "../config";
import { useNotifications } from "../context/NotificationContext";


export default function AdminUsers() {
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", displayName: "" });
  const [tempPasswordModal, setTempPasswordModal] = useState({ isOpen: false, email: "", password: "", referenceNumber: "" });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: null, // 'toggle' or 'delete'
    user: null,
    title: "",
    message: "",
    confirmText: "",
    confirmColor: "" // 'red' or 'green'
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showExportMenu && !event.target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  async function fetchUsers() {
    setLoading(true);
    try { 
      const res = await apiFetch('/api/admin/users', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();
      
      if (data.ok && data.users) {
        setUsers(data.users);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to fetch users" });
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setMessage({ type: "error", text: "Failed to fetch users: " + err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const res = await apiFetch('/api/admin/users/create', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify(newUser)
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // Show temporary password modal
        setTempPasswordModal({
          isOpen: true,
          email: data.user.email,
          password: data.user.temporaryPassword,
          referenceNumber: data.user.referenceNumber
        });
        setShowAddModal(false);
        setNewUser({ email: "", displayName: "" });
        fetchUsers(); // Refresh the list
      } else {
        setMessage({ type: "error", text: data.message || "Failed to create user" });
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setMessage({ type: "error", text: "Failed to create user" });
    }
  }

  // Email Modal State
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    recipient: "",
    subject: "",
    body: "",
    loading: false
  });

  async function openEmailModal(user) {
    setMessage({ type: "", text: "" });
    setEmailModal(prev => ({ ...prev, loading: true, isOpen: true, recipient: user.email }));

    try {
      // 1. Fetch the reset link
      const res = await apiFetch('/api/admin/users/reset-password', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({ email: user.email })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // 2. Populate the modal with template
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'User';
        const template = `Hello ${firstName},

We received a request to reset your password for your Spark Trainings account.
You can reset your password by clicking the link below:

${data.resetLink}

If you didn't ask for a password reset, you can ignore this email.

Best regards,
Spark Trainings Team`;

        setEmailModal({
          isOpen: true,
          recipient: user.email,
          subject: "Password Reset Request",
          body: template,
          loading: false
        });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to generate reset link" });
        setEmailModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    } catch (err) {
      console.error("Error generating reset link:", err);
      setMessage({ type: "error", text: "Failed to generate reset link" });
      setEmailModal(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    setEmailModal(prev => ({ ...prev, loading: true }));

    try {
      const res = await apiFetch('/api/admin/send-email', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({
          email: emailModal.recipient,
          subject: emailModal.subject,
          body: emailModal.body
        })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        addNotification({
          type: 'success',
          title: 'Email Sent',
          message: `Password reset email sent to ${emailModal.recipient}`
        });
        setMessage({ type: "success", text: `Email sent to ${emailModal.recipient}` });
        setEmailModal({ isOpen: false, recipient: "", subject: "", body: "", loading: false });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to send email" });
      }
    } catch (err) {
      console.error("Error sending email:", err);
      setMessage({ type: "error", text: "Failed to send email" });
    } finally {
      setEmailModal(prev => ({ ...prev, loading: false }));
    }
  }

  // Open modal for toggle status
  function openToggleStatusModal(user) {
    const isDisabling = !user.disabled;
    setConfirmationModal({
      isOpen: true,
      type: 'toggle',
      user: user,
      title: isDisabling ? "Disable User Account" : "Enable User Account",
      message: isDisabling 
        ? `Are you sure you want to disable ${user.email}? They will no longer be able to sign in.`
        : `Are you sure you want to enable ${user.email}? They will regain access to their account.`,
      confirmText: isDisabling ? "Disable User" : "Enable User",
      confirmColor: isDisabling ? "red" : "green"
    });
  }

  // Open modal for delete
  function openDeleteModal(user) {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      user: user,
      title: "Delete User Account",
      message: `Are you sure you want to PERMANENTLY delete ${user.email}? This action cannot be undone and all user data will be lost.`,
      confirmText: "Delete User",
      confirmColor: "red"
    });
  }

  // Execute the confirmed action
  async function handleConfirmAction() {
    const { type, user } = confirmationModal;
    if (!user) return;

    if (type === 'toggle') {
      await executeToggleStatus(user.uid, user.disabled, user.email);
    } else if (type === 'delete') {
      await executeDeleteUser(user.uid, user.email);
    }
    
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  }

  async function executeToggleStatus(uid, currentStatus, email) {
    try {
      const res = await apiFetch('/api/admin/users/toggle-status', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({ uid, disabled: !currentStatus })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        addNotification({
          type: currentStatus ? 'success' : 'info',
          title: `User ${currentStatus ? 'Enabled' : 'Disabled'}`,
          message: `User ${email} has been ${currentStatus ? 'enabled' : 'disabled'}`
        });
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update user status" });
      }
    } catch (err) {
      console.error("Error updating user status:", err);
      setMessage({ type: "error", text: "Failed to update user status" });
    }
  }




  async function executeDeleteUser(uid, email) {
    try {
      const res = await apiFetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": localStorage.getItem("admin_token")
        }
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        addNotification({
          type: 'success',
          title: 'User Deleted',
          message: `User ${email} has been permanently deleted`
        });
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({ type: "error", text: "Failed to delete user" });
    }
  }

  // Export functions
  function exportToCSV() {
    const headers = ['Name', 'Email', 'Reference Number', 'UID', 'Created', 'Last Sign In', 'Status', 'Email Verified'];
    const csvData = filteredUsers.map(user => [
      user.displayName || 'No name',
      user.email || 'N/A',
      user.referenceNumber || 'Not assigned',
      user.uid || 'N/A',
      user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A',
      user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Never',
      user.disabled ? 'Disabled' : 'Active',
      user.emailVerified ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'users.csv', 'text/csv');
    
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `${filteredUsers.length} users exported to CSV`
    });
    setShowExportMenu(false);
  }

  function exportToJSON() {
    const jsonData = filteredUsers.map(user => ({
      name: user.displayName || 'No name',
      email: user.email || 'N/A',
      referenceNumber: user.referenceNumber || 'Not assigned',
      uid: user.uid || 'N/A',
      created: user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A',
      lastSignIn: user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Never',
      status: user.disabled ? 'Disabled' : 'Active',
      emailVerified: user.emailVerified ? 'Yes' : 'No'
    }));

    const jsonContent = JSON.stringify(jsonData, null, 2);
    downloadFile(jsonContent, 'users.json', 'application/json');
    
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `${filteredUsers.length} users exported to JSON`
    });
    setShowExportMenu(false);
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-[#0d9c06]" /> User Management
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0d9c06] text-white px-4 py-2 rounded-md hover:bg-[#0b8a05] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <UserPlus size={20} /> Add User
        </button>
      </div>

      {message.text && (
    <div className={`p-3 rounded-md text-sm mb-4 ${
      message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
    }`}>
      {message.text}
    </div>
  )}

      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={18} /> Refresh
        </button>
        
        {/* Export Button with Dropdown */}
        <div className="relative export-dropdown">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download size={18} />
            Export
            <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 cursor-pointer transition-colors border-b border-gray-100"
              >
                <Download size={16} className="text-[#0d9c06]" />
                <div>
                  <div className="font-medium text-gray-900">Export as CSV</div>
                  <div className="text-xs text-gray-500">Excel compatible</div>
                </div>
              </button>
              <button
                onClick={exportToJSON}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 cursor-pointer transition-colors"
              >
                <Download size={16} className="text-[#0d9c06]" />
                <div>
                  <div className="font-medium text-gray-900">Export as JSON</div>
                  <div className="text-xs text-gray-500">Developer friendly</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="p-4">User</th>
                <th className="p-4">Reference Number</th>
                <th className="p-4">UID</th>
                <th className="p-4">Created</th>
                <th className="p-4">Last Sign In</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="w-8 h-8 text-[#0d9c06] animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className={`hover:bg-gray-50 transition-colors ${user.disabled ? 'bg-gray-50 opacity-75' : ''}`}>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{user.displayName || "No name"}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="p-4">
                      {user.referenceNumber ? (
                        <code className="text-xs bg-[#daffd8] text-[#0d9c06] px-2 py-1 rounded font-semibold">
                          {user.referenceNumber}
                        </code>
                      ) : (
                        <span className="text-xs text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.uid.substring(0, 12)}...</code>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.disabled
                          ? 'bg-[#ffd8d8] text-[#9c0606]'
                          : user.emailVerified
                            ? 'bg-[#daffd8] text-[#0d9c06]'
                            : 'bg-[#daffd8] text-[#0d9c06]'
                      }`}>
                        {user.disabled ? 'Disabled' : user.emailVerified ? 'Verified' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      <button
                        onClick={() => openEmailModal(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                        title="Send password reset email"
                      >
                        <Mail size={18} />
                      </button>

                      <button
                        onClick={() => openToggleStatusModal(user)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          user.disabled
                            ? 'text-[#0d9c06] hover:bg-[#daffd8]'
                            : 'text-[#9c0606] hover:bg-[#ffd8d8]'
                        }`}
                        title={user.disabled ? "Enable User" : "Disable User"}
                      >
                        {user.disabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                      </button>

                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-1.5 text-red-600 hover:bg-[#ffd8d8] rounded-md transition-colors cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] focus:border-transparent transition-all"
                  placeholder="user@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ email: "", displayName: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0d9c06] text-white px-4 py-2 rounded-md hover:bg-[#0b8a05] font-medium shadow-sm transition-colors cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Mail className="text-[#0d9c06]" size={20} /> Send Reset Email
              </h2>
              <button 
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))} 
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              {emailModal.loading && !emailModal.body ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#0d9c06] animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                      type="email"
                      value={emailModal.recipient}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailModal.subject}
                      onChange={(e) => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={emailModal.body}
                      onChange={(e) => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                      required
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06] font-mono text-sm"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={emailModal.loading}
                      className="flex-1 bg-[#0d9c06] text-white px-4 py-2 rounded-md hover:bg-[#0b8a05] font-medium shadow-sm transition-colors flex justify-center items-center gap-2 cursor-pointer"
                    >
                      {emailModal.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail size={18} />}
                      Send Email
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                confirmationModal.confirmColor === 'red' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {confirmationModal.confirmColor === 'red' ? (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmationModal.title}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {confirmationModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`flex-1 px-4 py-2 text-white rounded-md font-medium shadow-sm transition-colors cursor-pointer ${
                    confirmationModal.confirmColor === 'red'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {confirmationModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Modal */}
      {tempPasswordModal.isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-linear-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900">User Created Successfully!</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Important: Save these credentials</p>
                <p className="text-xs text-amber-700">The temporary password will not be shown again. Make sure to copy it and send it to the user.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempPasswordModal.email}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-800 font-medium"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tempPasswordModal.email);
                        addNotification({ type: 'success', title: 'Copied!', message: 'Email copied to clipboard' });
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Temporary Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempPasswordModal.password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-green-50 border border-green-300 rounded-md text-green-800 font-bold text-lg"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tempPasswordModal.password);
                        addNotification({ type: 'success', title: 'Copied!', message: 'Password copied to clipboard' });
                      }}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-md transition-colors cursor-pointer"
                      title="Copy password"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reference Number</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempPasswordModal.referenceNumber}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-800 font-medium"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tempPasswordModal.referenceNumber);
                        addNotification({ type: 'success', title: 'Copied!', message: 'Reference number copied to clipboard' });
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                      title="Copy reference number"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Next steps:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Send these credentials to the user via email or WhatsApp</li>
                  <li>User must change password on first login</li>
                  <li>Temporary password expires after first use</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setTempPasswordModal({ isOpen: false, email: "", password: "", referenceNumber: "" });
                  addNotification({
                    type: 'success',
                    title: 'User Created',
                    message: `User account created successfully`
                  });
                }}
                className="w-full bg-[#0d9c06] text-white px-4 py-3 rounded-md hover:bg-[#0b7e05] font-medium transition-colors cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
