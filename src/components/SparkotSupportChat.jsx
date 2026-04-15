import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, X, Maximize2, Minimize2, Sparkles, User, Loader2, Trash2, LifeBuoy } from 'lucide-react';
import { apiFetch } from '../config';

const STORAGE_KEY = 'sparkot_support_messages';

export default function SparkotSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

  const handleSend = async (event) => {
    event?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
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
    if (!window.confirm('Clear Sparkot chat history?')) return;
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. I'm ready to help you with Spark Trainings.",
        time: new Date().toISOString(),
      },
    ]);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white shadow-[0_10px_30px_rgba(13,156,6,0.28)] transition-all duration-300 hover:scale-110 active:scale-95"
        title="Chat with Sparkot Support"
      >
        <Bot size={26} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-green-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[560px] max-h-[85vh]'}`}
    >
      <div className="flex shrink-0 items-center justify-between bg-linear-to-r from-[#111827] to-[#1f2937] p-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2">
            <LifeBuoy size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Sparkot Support</h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Student Help Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={clearChat} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white" title="Clear History">
            <Trash2 size={16} />
          </button>
          <button type="button" onClick={() => setIsMinimized((value) => !value)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white" title={isMinimized ? 'Expand' : 'Minimize'}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400" title="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 p-4">
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-1 shadow-sm">
                <Sparkles size={12} className="text-yellow-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Powered by Spark Intelligence</span>
              </div>
            </div>

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${message.role === 'assistant' ? 'bg-linear-to-br from-[#0d9c06] to-[#0b7e05] text-white' : 'border border-gray-200 bg-white text-gray-600'}`}>
                  {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>

                <div className={`flex max-w-[82%] flex-col ${message.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`rounded-2xl p-3 text-sm shadow-sm ${message.role === 'assistant' ? 'border-tl-none border border-gray-100 bg-white text-gray-800' : 'border-tr-none bg-[#0d9c06] text-white'}`}>
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
              <div className="flex gap-3 animate-pulse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-200">
                  <Bot size={18} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-green-500" />
                  <span className="text-xs font-medium text-gray-400">Sparkot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white p-4">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Sparkot about the site, courses, or support..."
                disabled={isLoading}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm transition-all focus:border-[#0d9c06] focus:outline-none focus:ring-2 focus:ring-[#0d9c06]/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1.5 cursor-pointer rounded-lg bg-[#0d9c06] p-2 text-white shadow-md transition-all hover:bg-[#0b7e05] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="mt-3 text-center text-[10px] font-medium text-gray-400">
              Sparkot guides public site usage and support, but cannot access private account data.
            </p>
          </div>
        </>
      )}
    </div>
  );
}