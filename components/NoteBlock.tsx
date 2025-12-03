import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronDown, ChevronUp, Edit2, Check, X, StickyNote } from 'lucide-react';
import { Note } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface NoteBlockProps {
  note: Note;
  isReadOnly?: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onLayoutAnimationComplete?: () => void;
  style?: React.CSSProperties;
}

export const NoteBlock: React.FC<NoteBlockProps> = ({ 
  note, 
  isReadOnly = false,
  onUpdate, 
  onDelete, 
  onToggleExpand,
  onLayoutAnimationComplete,
  style 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing, localContent]);

  const handleSave = () => {
    onUpdate(note.id, localContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalContent(note.content);
    setIsEditing(false);
  };

  const headerTitle = note.content.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled Note';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onLayoutAnimationComplete={onLayoutAnimationComplete}
      id={`note-${note.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={twMerge(
        clsx(
          "absolute right-0 bg-white rounded-xl overflow-visible group border transition-shadow duration-300",
          note.isExpanded 
            ? "z-20 shadow-card-hover border-blue-100 ring-1 ring-blue-500/10" 
            : "z-10 shadow-card hover:shadow-lg border-transparent opacity-90 hover:opacity-100"
        )
      )}
      style={style}
    >
      {/* Static Visual Pointer (Beak) */}
      <div className={clsx(
          "absolute top-5 -left-1.5 w-3 h-3 transform rotate-45 border-l border-b transition-colors duration-300",
          note.isExpanded 
            ? "bg-white border-blue-100" 
            : "bg-white border-transparent shadow-sm"
      )} />

      {/* Visual Anchor Indicator Strip */}
      <motion.div 
        layout
        className={clsx(
            "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors duration-300",
            note.isExpanded ? 'bg-blue-500' : 'bg-slate-200 group-hover:bg-blue-300'
        )} 
      />

      {/* Header */}
      <motion.div 
        layout="position"
        className={clsx(
            "flex items-center justify-between pl-4 pr-3 py-2.5 select-none border-b transition-colors cursor-pointer",
            note.isExpanded ? 'bg-white border-slate-50' : 'bg-slate-50/50 border-transparent hover:bg-white'
        )}
        onClick={() => onToggleExpand(note.id)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
           {/* Line Badge */}
          <div className={clsx(
            "flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight shadow-sm border transition-colors flex-shrink-0",
            note.isExpanded 
                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                : 'bg-white text-slate-500 border-slate-200'
          )}>
            L{note.startLine}
            {note.endLine !== note.startLine && `-${note.endLine}`}
          </div>
          
          <span className="text-[12px] font-medium text-slate-700 truncate ml-1 flex-1">
             {headerTitle}
          </span>
        </div>

        {/* Controls */}
        <div className={clsx(
            "flex items-center gap-1 transition-opacity duration-200 flex-shrink-0 pl-2",
            // Always show chevron, hide edit actions if ReadOnly
            (isHovered || note.isExpanded || isEditing || isReadOnly) ? 'opacity-100' : 'opacity-0'
        )}>
            {!isReadOnly && (
                <>
                {isEditing ? (
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
                        className="p-1.5 hover:bg-white hover:text-emerald-600 hover:shadow-sm rounded-md transition-all text-gray-500"
                        title="Save (Cmd+Enter)"
                    >
                        <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                        className="p-1.5 hover:bg-white hover:text-red-500 hover:shadow-sm rounded-md transition-all text-gray-500"
                        title="Cancel (Esc)"
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                    </div>
                ) : (
                    <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                    
                    <div className="w-px h-3 bg-gray-200 mx-1.5" />
                    </>
                )}
                </>
            )}

            <button className="p-1 text-slate-400 hover:text-slate-600">
                {note.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
        </div>
      </motion.div>

      {/* Content Area */}
      <AnimatePresence>
        {note.isExpanded && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-white"
            >
                {isEditing && !isReadOnly ? (
                <div className="p-4 pt-2">
                    <textarea
                        ref={textareaRef}
                        className="w-full text-sm text-slate-700 leading-relaxed focus:outline-none min-h-[120px] resize-none placeholder-slate-300 font-sans bg-transparent"
                        value={localContent}
                        onChange={(e) => setLocalContent(e.target.value)}
                        placeholder="Write your note in Markdown..."
                        autoFocus
                        onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSave();
                        }
                        if (e.key === 'Escape') {
                            handleCancel();
                        }
                        }}
                    />
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">Markdown supported</span>
                        <span className="text-[10px] text-slate-300">⌘ + Enter to save</span>
                    </div>
                </div>
                ) : (
                <div 
                    className={clsx(
                        "prose prose-sm prose-slate max-w-none p-4 text-slate-600 transition-colors min-h-[60px]",
                        !isReadOnly && "cursor-text hover:bg-slate-50/30"
                    )}
                    onClick={() => !isReadOnly && setIsEditing(true)}
                >
                    {note.content ? (
                    <ReactMarkdown 
                        components={{
                        code({node, className, children, ...props}) {
                            return <code className={`${className} bg-slate-100 text-slate-700 rounded px-1 py-0.5 text-xs font-mono border border-slate-200`} {...props}>{children}</code>
                        }
                        }}
                    >
                        {note.content}
                    </ReactMarkdown>
                    ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-300 gap-2 select-none">
                        <StickyNote size={24} className="opacity-30" />
                        <span className="text-xs font-medium opacity-60">Empty note</span>
                    </div>
                    )}
                </div>
                )}
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};