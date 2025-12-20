import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Search, Mail, Phone, BookOpen, MessageSquare, RefreshCw, Eye, Trash2, X, Download, ChevronDown } from "lucide-react";
import { apiFetch } from "../config";
import { useNotifications } from "../context/NotificationContext";
import { AdminLoader } from "../components/SkeletonLoaders";

export default function AdminContacts() {
  const { addNotification } = useNotifications();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 5000);
    return () => clearInterval(interval);
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

  async function fetchContacts() {
    try {
      const res = await apiFetch('/api/contacts', {
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });
      const data = await res.json();
      
      if (data.ok && data.contacts) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal(contact) {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!contactToDelete) return;

    try {
      const res = await apiFetch(`/api/contacts/${contactToDelete.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": localStorage.getItem("admin_token") }
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        addNotification({
          type: 'success',
          title: 'Deleted',
          message: 'Contact submission deleted successfully'
        });
        fetchContacts();
        setShowDeleteModal(false);
        setContactToDelete(null);
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to delete contact'
        });
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete contact submission'
      });
    }
  }

  function openDetailModal(contact) {
    setSelectedContact(contact);
    setShowDetailModal(true);
  }

  // Export functions
  function exportToCSV() {
    const headers = ['Name', 'Phone', 'Course Interest', 'Message', 'Date'];
    const csvData = filteredContacts.map(contact => [
      contact.name || 'N/A',
      contact.phone || 'N/A',
      contact.course || 'N/A',
      (contact.message || 'N/A').replace(/"/g, '""'), // Escape quotes
      contact.createdAt ? new Date(contact.createdAt).toLocaleString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'contacts.csv', 'text/csv');
    
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `${filteredContacts.length} contacts exported to CSV`
    });
    setShowExportMenu(false);
  }

  function exportToJSON() {
    const jsonData = filteredContacts.map(contact => ({
      name: contact.name || 'N/A',
      phone: contact.phone || 'N/A',
      courseInterest: contact.course || 'N/A',
      message: contact.message || 'N/A',
      submittedOn: contact.createdAt ? new Date(contact.createdAt).toLocaleString() : 'N/A'
    }));

    const jsonContent = JSON.stringify(jsonData, null, 2);
    downloadFile(jsonContent, 'contacts.json', 'application/json');
    
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `${filteredContacts.length} contacts exported to JSON`
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

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="relative min-h-screen">
          <AdminLoader />
          <div className="opacity-50 pointer-events-none">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Mail className="text-[#0d9c06]" />
                  Contact Form Submissions
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  View and manage contact form submissions from your website
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden h-96" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Mail className="text-[#0d9c06]" />
            Contact Form Submissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and manage contact form submissions from your website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Total: <span className="font-bold text-[#0d9c06]">{contacts.length}</span>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone, course, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
          />
        </div>
        <button
          onClick={fetchContacts}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
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

      {/* Contacts Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Course Interest</th>
                <th className="p-4">Message Preview</th>
                <th className="p-4">Date</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    {searchTerm ? "No contacts found matching your search." : "No contact submissions yet."}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{contact.name || "N/A"}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone size={14} className="text-gray-400" />
                        {contact.phone || "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#daffd8] text-[#0d9c06]">
                        <BookOpen size={12} />
                        {contact.course || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {contact.message ? contact.message.substring(0, 50) + "..." : "N/A"}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      <button
                        onClick={() => openDetailModal(contact)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(contact)}
                        className="p-1.5 text-red-600 hover:bg-[#ffd8d8] rounded-md transition-colors cursor-pointer"
                        title="Delete"
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

      {/* Detail Modal */}
      {showDetailModal && selectedContact && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare size={24} />
                Contact Submission Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-md transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Full Name
                </label>
                <p className="text-gray-900 font-medium">{selectedContact.name || "N/A"}</p>
              </div>

              {/* Phone */}
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Phone Number
                </label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Phone size={16} className="text-[#0d9c06]" />
                  {selectedContact.phone || "N/A"}
                </p>
              </div>

              {/* Course */}
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Course Interest
                </label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <BookOpen size={16} className="text-[#0d9c06]" />
                  {selectedContact.course || "N/A"}
                </p>
              </div>

              {/* Message */}
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Message
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedContact.message || "No message provided"}
                </p>
              </div>

              {/* Date */}
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Submitted On
                </label>
                <p className="text-gray-900 font-medium">
                  {selectedContact.createdAt
                    ? new Date(selectedContact.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  openDeleteModal(selectedContact);
                  setShowDetailModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-linear-to-r from-red-50 to-orange-50">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900">Delete Contact Submission?</h2>
              <p className="text-center text-gray-600 mt-2">
                This action cannot be undone. The contact submission will be permanently deleted.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50">
              <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <span className="text-sm font-semibold text-gray-900">{contactToDelete.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                    <span className="text-sm font-semibold text-gray-900">{contactToDelete.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Course:</span>
                    <span className="text-sm font-semibold text-gray-900">{contactToDelete.course}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setContactToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
