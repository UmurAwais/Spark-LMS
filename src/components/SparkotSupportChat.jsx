import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, X, Maximize2, Minimize2, Sparkles, User, Loader2, Trash2, LifeBuoy } from 'lucide-react';
import { apiFetch } from '../config';
import ConfirmModal from './ConfirmModal';

const STORAGE_KEY = 'sparkot_support_messages';

export default function SparkotSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Sparkot support chat load error:', error);
    }

    return [
      {
        role: 'assistant',
        content: "Hi, I'm **Sparkot**. I can help you find courses, register, log in, check resources, understand payments, and navigate the Spark Trainings website. What do you need help with?",
        time: new Date().toISOString(),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Sparkot support chat save error:', error);
    }
  }, [messages]);

  const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, lineIndex) => (
      <p key={lineIndex} className="mb-2 last:mb-0">
        {line.split(/(\*\*.*?\*\*)/).map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIndex} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  const handleSend = async (eOrText) => {
    if (eOrText?.preventDefault) eOrText.preventDefault();

    const textToSend = typeof eOrText === 'string' ? eOrText : input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      time: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const contextMessages = nextMessages.slice(-12).map((message) => ({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content,
      }));

      const response = await apiFetch('/api/support/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: contextMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error (${response.status})`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.message || 'Failed to get response');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.data,
          time: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm having trouble reaching Sparkot right now: **${error.message}**. Please try again in a moment, use the Contact Us page, or email **support@sparktrainings.com** for direct support.`,
          isError: true,
          time: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setIsClearModalOpen(true);
  };

  const executeClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. I'm ready to help you with Spark Trainings.",
        time: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      <div 
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom-right ${
          isOpen ? 'opacity-0 scale-75 pointer-events-none translate-y-4' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full p-[2.5px] bg-linear-to-r from-[#0d9c06] to-[#4ade80] shadow-[0_10px_30px_rgba(13,156,6,0.28)] transition-transform duration-300 hover:scale-105 active:scale-95 group flex"
          title="Chat with Sparkot Support"
        >
          <div className="flex h-12 items-center justify-center gap-2.5 rounded-full bg-white px-5 py-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-[#1a1a1a] group-hover:text-[#0d9c06] transition-colors duration-300 shrink-0">
              <g transform="translate(12, 12)">
                <polygon points="-7,-6 -1.5,0 -7,6 -4,0" />
                <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(120)" />
                <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(240)" />
              </g>
            </svg>
            <span className="text-[17px] font-bold text-[#1a1a1a] tracking-tight pr-1 whitespace-nowrap">Ask AI</span>
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-[#0d9c06]"></span>
          </span>
        </button>
      </div>

      <div
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex w-[calc(100vw-2.5rem)] sm:w-[420px] flex-col overflow-hidden rounded-[28px] sm:rounded-3xl border border-gray-100 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 pointer-events-none translate-y-12'
        } ${isMinimized ? 'h-[72px]' : 'h-[680px] max-h-[80vh] sm:max-h-[85vh]'}`}
      >
        <div className="flex shrink-0 items-center justify-between px-5 sm:px-6 pt-6 pb-2 bg-white">
          <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200/60 shadow-sm">
            <button className="px-5 py-1.5 bg-white rounded-full text-[13px] font-bold text-gray-900 shadow-sm transition-all shadow-black/5">Chat</button>
            <button onClick={clearChat} className="px-5 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">History</button>
          </div>
          <div className="flex items-center gap-4 text-gray-800">
            <button onClick={clearChat} className="hover:text-red-500 transition-colors" title="Clear Chat">
              <Trash2 size={18} strokeWidth={2} />
            </button>
            <button onClick={() => setIsOpen(false)} className="hover:text-red-500 transition-colors" title="Close Workspace">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
                <path d="M22 2v20"></path>
              </svg>
            </button>
          </div>
        </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto bg-white scrollbar-hide px-4 sm:px-6 py-2 flex flex-col">
            {messages.length <= 1 ? (
              <div className="flex flex-col items-center flex-1 justify-center animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-5 mt-2">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" className="text-[#0d9c06]">
                    <g transform="translate(12, 12)">
                      <polygon points="-7,-6 -1.5,0 -7,6 -4,0" />
                      <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(120)" />
                      <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(240)" />
                    </g>
                  </svg>
                </div>
                <h2 className="text-[22px] font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                  Hello 👋
                </h2>
                <p className="text-[15px] font-medium text-gray-700 mb-8">How can I help you today?</p>
                
                <div className="w-full">
                  {[
                    "Browse available courses",
                    "Check my enrollment status",
                    "How do I get my certificate?",
                    "Talk to career support"
                  ].map(prompt => (
                    <button key={prompt} onClick={() => handleSend(prompt)} disabled={isLoading} className="flex w-full items-center gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors text-left group disabled:opacity-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 shrink-0 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform group-hover:text-[#0d9c06]">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                      <span className="text-[15px] font-medium text-gray-800">{prompt}</span>
                    </button>
                  ))}
                </div>

                <div className="w-full flex overflow-x-auto gap-2.5 mt-4 pb-2 scrollbar-hide">
                  {['Courses', 'Workshops', 'Mentorship', 'Account', 'Support'].map((tag, i) => (
                    <button key={tag} onClick={() => handleSend(`Tell me about ${tag}`)} disabled={isLoading} className={`px-4 py-1.5 rounded-full border text-[14px] whitespace-nowrap transition-colors disabled:opacity-50 ${i === 0 ? 'border-[#0d9c06] text-[#0d9c06] bg-[#0d9c06]/10' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-5 pb-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${message.role === 'assistant' ? 'text-[#0d9c06]' : 'border border-gray-200 bg-white text-gray-600'}`}>
                      {message.role === 'assistant' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <g transform="translate(12, 12) scale(0.6)">
                            <polygon points="-7,-6 -1.5,0 -7,6 -4,0" />
                            <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(120)" />
                            <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(240)" />
                          </g>
                        </svg>
                      ) : <User size={18} />}
                    </div>

                    <div className={`flex max-w-[82%] flex-col ${message.role === 'user' ? 'items-end' : ''}`}>
                      <div className={`rounded-2xl p-4 text-[15px] leading-relaxed shadow-sm ${message.role === 'assistant' ? 'border-tl-none border border-gray-100 bg-white text-gray-800' : 'border-tr-none bg-[#0d9c06] text-white'}`}>
                        {renderContent(message.content)}
                      </div>
                      <span className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-gray-400">
                        {formatTime(message.time)}
                        {message.isError && <span className="ml-1 text-red-400">Error</span>}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 animate-in fade-in duration-300">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <g transform="translate(12, 12) scale(0.6)">
                            <polygon points="-7,-6 -1.5,0 -7,6 -4,0" />
                            <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(120)" />
                            <polygon points="-7,-6 -1.5,0 -7,6 -4,0" transform="rotate(240)" />
                          </g>
                        </svg>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-gray-100 bg-white p-4 shadow-sm">
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="shrink-0 bg-white px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
            <div className="relative rounded-[28px] border border-slate-300 bg-white flex flex-col pt-3 pb-2 px-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] focus-within:border-[#0d9c06] focus-within:ring-2 focus-within:ring-[#0d9c06]/10 transition-all duration-300">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Sparkot anything..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none bg-transparent px-1 pb-1 pt-1 text-[15px] text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent disabled:opacity-50 max-h-[120px] min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) handleSend();
                  }
                }}
              />
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); if (input.trim()) handleSend(e); }}
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-400 bg-[#0d9c06] hover:bg-[#0b7e05] text-white disabled:cursor-default cursor-pointer disabled:shadow-none shadow-md shadow-[#0d9c06]/20"
                >
                   <Send size={18} strokeWidth={2.5} className="mr-0.5 mt-0.5" />
                </button>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[12px] font-medium text-gray-500">
              Sparkot can make mistakes. Double-check replies.
            </p>
          </div>
        </>
      )}

      <ConfirmModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={executeClearChat}
        title="Clear Conversation"
        message="Are you sure you want to delete this chat history? This action cannot be undone."
        confirmText="Clear Chat"
      />
    </div>
  </>
  );
}