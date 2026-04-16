import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel" }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-[90%] max-w-[380px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-7 pb-5">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex shrink-0 h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/50">
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[19px] font-extrabold text-gray-900 tracking-tight">{title}</h3>
              <p className="text-[14.5px] text-gray-500 mt-2 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6 flex items-center gap-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 text-[14px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="flex-1 py-2.5 text-[14px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm shadow-red-500/20 transition-all active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
