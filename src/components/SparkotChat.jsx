import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Maximize2, Minimize2, MessageSquare, Loader2, Sparkles, User, RefreshCw, Trash2 } from 'lucide-react';
import { apiFetch } from '../config';

export default function SparkotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('sparkot_messages');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'assistant', 
        content: "Hello! I'm **Sparkot**, your Spark LMS AI assistant. I have access to your live dashboard data. How can I help you manage your platform today?",
        time: new Date().toISOString()
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Save messages to local storage
  useEffect(() => {
    localStorage.setItem('sparkot_messages', JSON.stringify(messages));
  }, [messages]);

  // Fetch live stats for AI context
  useEffect(() => {
    if (isOpen) {
      fetchLMSStats();
    }
  }, [isOpen]);

  const fetchLMSStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const res = await apiFetch('/api/orders', {
        headers: { "x-admin-token": token }
      });
      const data = await res.json();
      
      if (data.ok && data.orders) {
        const pending = data.orders.filter(o => o.status === 'Pending').length;
        const approved = data.orders.filter(o => o.status === 'Approved').length;
        const canceled = data.orders.filter(o => o.status === 'Canceled' || o.status === 'Rejected').length;
        const total = data.orders.length;
        const revenue = data.orders
          .filter(o => o.status === 'Approved')
          .reduce((sum, o) => {
            const amt = parseInt(String(o.amount || 0).replace(/[^0-9]/g, '') || 0);
            return sum + amt;
          }, 0);
        
        // Also fetch user count for more context
        let studentCount = 0;
        try {
          const userRes = await apiFetch('/api/admin/users', { headers: { "x-admin-token": token } });
          const userData = await userRes.json();
          if (userData.ok) studentCount = userData.users.length;
        } catch (e) {}

        setStats({ 
          pending, 
          approved, 
          canceled, 
          total, 
          revenue: revenue.toLocaleString(),
          students: studentCount,
          lastSync: new Date().toLocaleTimeString()
        });
      }
    } catch (e) {
      console.error("Sparkot failed to fetch context:", e);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      role: 'user', 
      content: input,
      time: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I can't find your admin session. Please try logging in again to use Sparkot.",
        isError: true,
        time: new Date().toISOString()
      }]);
      setIsLoading(false);
      return;
    }

    try {
      // Create a rich context for the AI
      const systemContext = {
        role: 'system',
        content: `You are Sparkot, the intelligent administrator assistant for Spark Trainings LMS. 
        CONTEXT DATA (Real-time):
        - Total Orders: ${stats?.total || 'Unknown'}
        - Pending Orders: ${stats?.pending || '0'} (High Priority)
        - Approved/Paid Orders: ${stats?.approved || '0'}
        - Canceled/Rejected Orders: ${stats?.canceled || '0'}
        - Total Revenue Generated: Rs. ${stats?.revenue || '0'}
        - Total Enrolled Students: ${stats?.students || '0'}
        - Current Time: ${new Date().toLocaleString()}
        - Dashboard Sync: ${stats?.lastSync || 'Just now'}

        INSTRUCTIONS:
        1. Always provide accurate numbers from the CONTEXT DATA above.
        2. If asked about "pending" or "cancelled" or "revenue", use these specific numbers.
        3. Be professional, concise, and helpful. 
        4. Use bold text (**text**) for emphasis on important metrics.
        5. If data is unavailable, mention you are synchronizing with the server.
        6. If the user asks about the live site, tell them to use the live site for live data.7. If the user asks about the CEO of Spark Trainings, tell them Sajid Ali is the CEO of Spark Trainings.`
      };

      // Keep only the last 10 messages for context, and prepend the system context
      const contextMessages = [
        systemContext,
        ...messages.concat(userMessage).slice(-10).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];

      const response = await apiFetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ messages: contextMessages })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error (${response.status})`);
      }

      const data = await response.json();
      
      if (data.ok) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.data,
          time: new Date().toISOString()
        }]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I'm sorry, I'm having trouble connecting: **${err.message}**. Please make sure the backend is running and you are not on the live site.`,
        isError: true,
        time: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      const initialMessage = { 
        role: 'assistant', 
        content: "Chat cleared. I'm ready for your new questions!",
        time: new Date().toISOString()
      };
      setMessages([initialMessage]);
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple markdown-ish bolding helper
  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => (
      <p key={i} className="mb-2 last:mb-0">
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white rounded-full shadow-[0_8px_25px_rgba(13,156,6,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50 group"
        title="Chat with Sparkot"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
        </span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed right-4 bottom-4 md:right-6 md:bottom-6 w-[calc(100vw-2rem)] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 z-50 overflow-hidden ${
        isMinimized ? 'h-16' : 'h-[500px] sm:h-[600px] max-h-[85vh]'
      }`}
      ref={chatRef}
    >
      {/* Header */}
      <div className="p-4 bg-linear-to-r from-[#1c1d1f] to-[#2d2f31] text-white flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Bot size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Sparkot Chat</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">AI Support Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
            title="Clear History"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors text-gray-400 hover:text-red-400"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="flex justify-center mb-6">
              <div className="bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                <Sparkles size={12} className="text-yellow-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Powered by Spark Intelligence</span>
              </div>
            </div>

            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'assistant' 
                    ? 'bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                
                <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'assistant' 
                      ? 'bg-white text-gray-800 border-tl-none ring-1 ring-gray-100' 
                      : 'bg-[#0d9c06] text-white border-tr-none'
                  }`}>
                    {renderContent(msg.content)}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1.5 font-medium flex items-center gap-1">
                    {formatTime(msg.time)}
                    {msg.isError && <span className="text-red-400 ml-1">Error</span>}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-gray-400" />
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                  <Loader2 size={16} className="text-green-500 animate-spin" />
                  <span className="text-xs text-gray-400 font-medium">Sparkot is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about the LMS..."
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9c06]/30 focus:border-[#0d9c06] transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1.5 p-2 bg-[#0d9c06] text-white rounded-lg hover:bg-[#0b7e05] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 cursor-pointer shadow-md"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">
              Sparkot uses AI and may occasionally provide inaccurate info.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
