import React, { useMemo } from 'react';
import { NoteBlock } from './NoteBlock';
import { Note } from '../types';
import { StickyNote } from 'lucide-react';

interface NoteAreaProps {
  notes: Note[];
  editorLineHeight: number;
  minHeight: number;
  isReadOnly?: boolean;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export const NoteArea: React.FC<NoteAreaProps> = ({ 
  notes, 
  editorLineHeight, 
  minHeight,
  isReadOnly = false,
  onUpdateNote, 
  onDeleteNote, 
  onToggleExpand,
}) => {
  
  // Layout Algorithm
  const positionedNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => a.startLine - b.startLine);
    
    const positions: { note: Note; top: number }[] = [];
    let lastBottom = -1;
    const GAP = 20; 
    const PADDING_TOP = 16; 

    sorted.forEach(note => {
      // Ideal position is aligned with the code line
      let idealTop = (note.startLine - 1) * editorLineHeight + PADDING_TOP;

      // Stack if overlapping
      if (idealTop < lastBottom + GAP) {
        idealTop = lastBottom + GAP;
      }

      positions.push({ note, top: idealTop });

      // Improved height estimation for layout collision
      const estimatedHeight = note.isExpanded ? 200 : 60; 
      lastBottom = idealTop + estimatedHeight;
    });

    return positions;
  }, [notes, editorLineHeight]);

  return (
    <div 
        className="relative w-full bg-slate-50 dot-pattern"
        style={{ minHeight: `${minHeight}px` }}
    >
        {/* Empty State */}
        {notes.length === 0 && (
          <div className="absolute top-1/3 left-0 right-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none select-none px-6">
            <div className="w-20 h-20 mb-4 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center justify-center transform rotate-3">
                <StickyNote size={28} className="text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-500">
                {isReadOnly ? "No annotations" : "No notes yet"}
            </h3>
            {!isReadOnly && (
                <p className="text-xs text-slate-400 mt-2 text-center leading-relaxed">
                Select code and click the "Annotate" button to start.
                </p>
            )}
          </div>
        )}

        {positionedNotes.map(({ note, top }) => (
          <NoteBlock
            key={note.id}
            note={note}
            isReadOnly={isReadOnly}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onToggleExpand={onToggleExpand}
            style={{ 
              top: `${top}px`,
              width: 'calc(100% - 40px)', 
              left: '20px'
            }}
          />
        ))}
        
        {/* Spacer to ensure last note isn't cut off if it extends beyond minHeight */}
        <div style={{ height: `${Math.max(...positionedNotes.map(p => p.top + 300), 0)}px` }} />
    </div>
  );
};