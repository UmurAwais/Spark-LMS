import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Underline, Type, List, ListOrdered } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false
  });

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const checkActiveFormats = () => {
    if (!editorRef.current) return;

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList')
    });
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
    setTimeout(() => {
      editorRef.current?.focus();
      checkActiveFormats();
    }, 0);
  };

  const applyFontSize = (size) => {
    // First, restore the saved selection
    restoreSelection();
    
    // Get the current selection
    const selection = window.getSelection();
    
    // Check if we have a valid selection
    if (!selection || !selection.rangeCount) {
      alert('Please select some text first');
      editorRef.current?.focus();
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();

    // Only proceed if there's actually text selected
    if (!selectedText) {
      alert('Please select some text first');
      editorRef.current?.focus();
      return;
    }

    try {
      // Create a span element with the font size
      const span = document.createElement('span');
      span.style.fontSize = size;
      
      // Extract the selected content
      const contents = range.extractContents();
      
      // Put the content inside the span
      span.appendChild(contents);
      
      // Insert the span at the selection point
      range.insertNode(span);
      
      // Move cursor after the inserted span
      range.setStartAfter(span);
      range.setEndAfter(span);
      range.collapse(true);
      
      // Update the selection
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Save changes
      handleInput();
    } catch (e) {
      console.error('Font size application error:', e);
      alert('Failed to apply font size. Please try again.');
    }
    
    // Return focus to editor
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const handleSelectionChange = () => {
    if (document.activeElement === editorRef.current) {
      checkActiveFormats();
      saveSelection();
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const fontSizes = [
    { label: '12px - Small', value: '12px' },
    { label: '14px - Normal', value: '14px' },
    { label: '16px - Medium', value: '16px' },
    { label: '18px - Large', value: '18px' },
    { label: '24px - Extra Large', value: '24px' },
    { label: '32px - Huge', value: '32px' }
  ];

  const getButtonClass = (isActive) => {
    return `p-2 rounded transition-colors cursor-pointer flex items-center justify-center min-w-[32px] min-h-[32px] ${
      isActive 
        ? 'bg-green-100 text-[#0d9c06] hover:bg-green-200' 
        : 'hover:bg-gray-200'
    }`;
  };

  return (
    <div className="border-2 border-gray-300 rounded-md overflow-hidden focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('bold');
          }}
          className={getButtonClass(activeFormats.bold)}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} className="shrink-0" />
        </button>
        
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('italic');
          }}
          className={getButtonClass(activeFormats.italic)}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} className="shrink-0" />
        </button>
        
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('underline');
          }}
          className={getButtonClass(activeFormats.underline)}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} className="shrink-0" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('insertUnorderedList');
          }}
          className={getButtonClass(activeFormats.unorderedList)}
          title="Bullet List"
        >
          <List size={16} className="shrink-0" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('insertOrderedList');
          }}
          className={getButtonClass(activeFormats.orderedList)}
          title="Numbered List"
        >
          <ListOrdered size={16} className="shrink-0" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setShowSizeMenu(!showSizeMenu);
            }}
            className="p-2 hover:bg-gray-200 rounded transition-colors cursor-pointer flex items-center gap-1.5"
            title="Text Size"
          >
            <Type size={16} className="shrink-0" />
            <span className="text-xs leading-none">Size</span>
          </button>

          {showSizeMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onMouseDown={() => setShowSizeMenu(false)}
              ></div>
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 min-w-[150px]">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyFontSize(size.value);
                      setShowSizeMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm"
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1"></div>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            if (editorRef.current) {
              editorRef.current.innerHTML = '';
              handleInput();
              editorRef.current.focus();
            }
          }}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer leading-none"
        >
          Clear
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="p-3 min-h-[100px] max-h-[300px] overflow-y-auto focus:outline-none"
        style={{ 
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] ul,
        [contenteditable] ol {
          margin-left: 20px;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        
        [contenteditable] li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
