import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Shield, UserPlus, Mail, Trash2, RefreshCw, Copy, CheckCircle, X, Clock, AlertCircle } from "lucide-react";
import { apiFetch } from "../config";
import { useNotifications } from "../context/NotificationContext";

export default function AdminRoles() {
  const { addNotification } = useNotifications();
  const [roles, setRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchAvailableRoles();
  }, []);

  async function fetchRoles() {
    try {
      const res = await apiFetch('/api/admin/roles', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();
      
      if (data.ok && data.roles) {
        setRoles(data.roles);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableRoles() {
    try {
      const res = await apiFetch('/api/admin/roles/available', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();
      
      if (data.ok && data.roles) {
        setAvailableRoles(data.roles);
        if (data.roles.length > 0) {
          setSelectedRole(data.roles[0].value);
        }
      }
    } catch (err) {
      console.error("Error fetching available roles:", err);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    
    try {
      const res = await apiFetch('/api/admin/roles/invite', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token")
        },
        body: JSON.stringify({ email: inviteEmail, role: selectedRole })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        addNotification({
          type: 'success',
          title: 'Invitation Created',
          message: `Invitation sent to ${inviteEmail}`
        });
        
        setInviteLink(data.inviteLink);
        setShowInviteModal(false);
        setShowLinkModal(true);
        setInviteEmail("");
        fetchRoles();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to create invitation'
        });
      }
    } catch (err) {
      console.error("Error creating invitation:", err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create invitation'
      });
    }
  }

  async function handleRevoke(roleId, email) {
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        addNotification({
          type: 'success',
          title: 'Access Revoked',
          message: `Access revoked for ${email}`
        });
        fetchRoles();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to revoke access'
        });
      }
    } catch (err) {
      console.error("Error revoking access:", err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to revoke access'
      });
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(inviteLink);
    addNotification({
      type: 'success',
      title: 'Copied!',
      message: 'Invitation link copied to clipboard'
    });
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active', icon: CheckCircle },
      revoked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Revoked', icon: AlertCircle }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="text-[#0d9c06]" />
            Roles & Permissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage admin team members and their access levels
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-[#0d9c06] text-white px-4 py-2 rounded-md hover:bg-[#0b7e05] flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <UserPlus size={20} />
          Invite Team Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="text-sm text-gray-500">Total Team Members</div>
          <div className="text-2xl font-bold text-gray-800">{roles.length}</div>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {roles.filter(r => r.status === 'active').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {roles.filter(r => r.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Invited By</th>
                <th className="p-4">Last Login</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No team members yet. Click "Invite Team Member" to get started.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{role.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">{role.roleDisplay}</div>
                        <div className="text-xs text-gray-500">{role.roleDescription}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(role.status)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {role.invitedBy}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {role.lastLogin ? new Date(role.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4">
                      {role.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevoke(role._id, role.email)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                          title="Revoke access"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus size={24} />
                Invite Team Member
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-md transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
                >
                  {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {selectedRole && availableRoles.find(r => r.value === selectedRole) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {availableRoles.find(r => r.value === selectedRole).description}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0d9c06] text-white px-4 py-2 rounded-md hover:bg-[#0b7e05] font-medium shadow-sm transition-colors cursor-pointer"
                >
                  Create Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-green-800">
                <CheckCircle size={24} />
                Invitation Created!
              </h2>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Copy this invitation link and send it to the team member:
              </p>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <code className="flex-1 text-sm break-all text-gray-800">
                    {inviteLink}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-[#0d9c06] text-white rounded-md hover:bg-[#0b7e05] transition-colors cursor-pointer"
                    title="Copy to clipboard"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ This link expires in 7 days. The recipient will need to set their password to activate their account.
                </p>
              </div>

              <button
                onClick={() => setShowLinkModal(false)}
                className="w-full bg-[#0d9c06] text-white px-4 py-2 rounded-md hover:bg-[#0b7e05] font-medium transition-colors cursor-pointer"
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
