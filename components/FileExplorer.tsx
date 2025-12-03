import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, FileJson, FileText, Image as ImageIcon, Box, LayoutGrid } from 'lucide-react';
import { FileNode, FileType } from '../types';
import { clsx } from 'clsx';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onToggleFolder: (folderId: string) => void;
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch(ext) {
    case 'js':
    case 'jsx':
      return <FileCode size={14} className="text-yellow-400" />;
    case 'ts':
    case 'tsx':
      return <FileCode size={14} className="text-blue-400" />;
    case 'py':
      return <FileCode size={14} className="text-emerald-400" />; 
    case 'css':
    case 'scss':
      return <FileCode size={14} className="text-sky-300" />;
    case 'html':
      return <FileCode size={14} className="text-orange-400" />;
    case 'json':
      return <FileJson size={14} className="text-yellow-200" />;
    case 'md':
      return <FileText size={14} className="text-gray-300" />;
    case 'png':
    case 'jpg':
    case 'svg':
      return <ImageIcon size={14} className="text-pink-400" />;
    default:
      return <FileText size={14} className="text-gray-500" />;
  }
};

const FileTreeItem: React.FC<{ 
  node: FileNode; 
  depth: number; 
  activeFileId: string | null;
  onSelect: (file: FileNode) => void;
  onToggle: (id: string) => void;
}> = ({ node, depth, activeFileId, onSelect, onToggle }) => {
  
  const isSelected = activeFileId === node.id;
  const isFolder = node.type === FileType.FOLDER;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      onToggle(node.id);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <motion.div 
        whileHover={{ x: 2 }}
        className={clsx(
            "flex items-center py-1 cursor-pointer select-none transition-colors duration-150 group relative",
            isSelected ? 'bg-[#1f2428] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2428]/50'
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={handleClick}
      >
        {/* Active Marker */}
        {isSelected && (
          <motion.div 
            layoutId="active-marker"
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-ide-accent" 
          />
        )}

        <span className="mr-1.5 transition-transform duration-200 opacity-70 group-hover:opacity-100 flex-shrink-0">
          {isFolder ? (
            node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-[14px] inline-block"></span>
          )}
        </span>
        
        <span className="mr-2 flex-shrink-0">
          {isFolder ? (
            node.isOpen 
              ? <FolderOpen size={15} className="text-blue-400" /> 
              : <Folder size={15} className="text-blue-400/80" />
          ) : (
            getFileIcon(node.name)
          )}
        </span>
        
        <span className={clsx("truncate text-[13px] leading-tight", isSelected ? 'opacity-100' : 'opacity-80')}>
          {node.name}
        </span>
      </motion.div>

      <AnimatePresence>
        {isFolder && node.isOpen && node.children && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden border-l border-gray-700/20 ml-[18px]"
            >
            {node.children.map(child => (
                <div key={child.id} className="-ml-[18px]">
                    <FileTreeItem 
                        node={child} 
                        depth={depth + 1} 
                        activeFileId={activeFileId}
                        onSelect={onSelect}
                        onToggle={onToggle}
                    />
                </div>
            ))}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFileId, onFileSelect, onToggleFolder }) => {
  return (
    <div className="h-full bg-ide-sidebar flex flex-col select-none border-r border-ide-border">
      <div className="px-4 py-3 bg-ide-bg/50 backdrop-blur-sm border-b border-ide-border flex items-center justify-between sticky top-0 z-10">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid size={12} /> Explorer
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-ide-border hover:scrollbar-thumb-gray-600">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 p-6 text-center opacity-50">
             <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-3">
                <Folder size={20} className="text-gray-500" />
             </div>
             <p className="text-gray-400 text-sm">No workspace</p>
          </div>
        ) : (
          files.map(node => (
            <FileTreeItem 
              key={node.id} 
              node={node} 
              depth={0} 
              activeFileId={activeFileId}
              onSelect={onFileSelect}
              onToggle={onToggleFolder}
            />
          ))
        )}
      </div>
    </div>
  );
};