import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, FolderOpen, Command, Plus, Search, X, GitBranch, Download, User, Shield, Eye, HardDrive, FileCode } from 'lucide-react';

interface TopBarProps {
  isReadOnly: boolean;
  workspaceName: string | null;
  onOpenWorkspace: () => void;
  onGitClone: (url: string) => void;
  onExport: () => void;
  onExportSource: () => void;
  onToggleMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  isReadOnly, 
  workspaceName,
  onOpenWorkspace, 
  onGitClone, 
  onExport,
  onExportSource,
  onToggleMode 
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [showGitInput, setShowGitInput] = useState(false);

  const handleGitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl) {
      onGitClone(repoUrl);
      setShowGitInput(false);
      setRepoUrl('');
    }
  };

  return (
    <div className="h-14 bg-ide-bg border-b border-ide-border flex items-center justify-between px-4 shadow-md z-30 relative select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <motion.div 
            whileHover={{ rotate: 15 }}
            className="bg-blue-600/10 border border-blue-500/20 p-1.5 rounded-lg"
        >
          <Command size={18} className="text-blue-500" />
        </motion.div>
        <div className="flex flex-col justify-center">
          <h1 className="font-semibold text-gray-200 text-sm tracking-tight">CodeChronicle</h1>
          <div className="flex items-center gap-1.5">
            {workspaceName ? (
                <>
                    <HardDrive size={10} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium truncate max-w-[150px]">{workspaceName}</span>
                </>
            ) : (
                <span className="text-[10px] text-gray-500 font-medium">Demo Workspace</span>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher (Simulates Login/Deploy) */}
      <motion.button
        onClick={onToggleMode}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          isReadOnly 
            ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white' 
            : 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        {isReadOnly ? <Eye size={12} /> : <Shield size={12} />}
        <span>{isReadOnly ? 'Visitor Mode' : 'Admin Mode'}</span>
      </motion.button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isReadOnly && (
            <>
                {showGitInput ? (
                <motion.form 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleGitSubmit} 
                    className="flex items-center bg-ide-sidebar rounded-md px-2 py-1 border border-blue-500/50 shadow-lg"
                >
                    <Github size={14} className="text-gray-400 mr-2" />
                    <input 
                    type="text" 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="owner/repo"
                    className="bg-transparent border-none focus:outline-none text-xs text-gray-200 placeholder-gray-600 w-48 font-mono h-7"
                    autoFocus
                    />
                    <button 
                    type="submit" 
                    className="ml-1 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded transition-colors"
                    >
                    <Plus size={12} />
                    </button>
                    <button 
                    type="button" 
                    onClick={() => setShowGitInput(false)} 
                    className="ml-1 text-gray-500 hover:text-gray-300 p-1 rounded transition-colors"
                    >
                    <X size={12} />
                    </button>
                </motion.form>
                ) : (
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGitInput(true)}
                    className="group flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-all duration-200"
                    title="Clone Repository"
                >
                    <GitBranch size={14} className="group-hover:text-blue-400 transition-colors" />
                    <span>Clone</span>
                </motion.button>
                )}

                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenWorkspace}
                    className="group flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-all duration-200"
                    title="Open Local Workspace Folder"
                >
                <FolderOpen size={14} className="group-hover:text-emerald-400 transition-colors" />
                <span>Open Local</span>
                </motion.button>

                <div className="w-px h-4 bg-gray-700 mx-1"></div>
            </>
        )}
        
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExport}
            className="group flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-all duration-200"
            title="Export to Blog HTML"
        >
          <Download size={14} className="group-hover:text-purple-400 transition-colors" />
          <span>Export</span>
        </motion.button>

        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExportSource}
            className="group flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-all duration-200"
            title="Export Source with Notes as ZIP"
        >
          <FileCode size={14} className="group-hover:text-yellow-400 transition-colors" />
          <span>Export Src</span>
        </motion.button>
      </div>
    </div>
  );
};