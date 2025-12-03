import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, Command } from 'lucide-react';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/Editor';
import { NoteArea } from './components/NoteArea';
import { TopBar } from './components/TopBar';
import { FileNode, Note, FileType } from './types';
import { SAMPLE_FILE_TREE, MOCK_NOTES } from './constants';
import { fetchRepoContents, fetchFileContent } from './services/githubService';
import { readDirectoryRecursive, loadNotesFromConfig, saveNotesToConfig, readFileText, writeFileText } from './services/fileHandleService';
import JSZip from 'jszip';

// --- Local Storage Hook for Demo Persistence ---
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

function App() {
  // --- Mode State ---
  // true = Using File System Access API (Real Disk)
  // false = Using LocalStorage (Demo Mode)
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  // --- Data State ---
  // We manage 'files' and 'notes' differently based on mode
  const [files, setFiles] = useState<FileNode[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // LocalStorage backups (Used only when !isLocalMode)
  const [lsFiles, setLsFiles] = useLocalStorage<FileNode[]>('cc-files', SAMPLE_FILE_TREE);
  const [lsNotes, setLsNotes] = useLocalStorage<Note[]>('cc-notes', MOCK_NOTES);

  // Initialize data based on mode
  useEffect(() => {
    if (!isLocalMode) {
      setFiles(lsFiles);
      setNotes(lsNotes);
    }
  }, [isLocalMode]); 

  // --- Selection State ---
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [selection, setSelection] = useState<{startLine: number, endLine: number} | null>(null);
  const [lineCount, setLineCount] = useState(0);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Refs
  const editorRef = useRef<any>(null);
  const noteAreaRef = useRef<HTMLDivElement>(null);
  
  // Scroll Sync Locks
  const isSyncingFromEditor = useRef(false);
  const isSyncingFromNotes = useRef(false);

  // Debounce saving notes to disk
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Persistence Logic ---

  // 1. Sync React State -> LocalStorage (Demo Mode Only)
  useEffect(() => {
    if (!isLocalMode) {
      setLsFiles(files);
    }
  }, [files, isLocalMode]);

  useEffect(() => {
    if (!isLocalMode) {
      setLsNotes(notes);
    }
  }, [notes, isLocalMode]);

  // 2. Sync React State -> Disk (Local Mode Only)
  useEffect(() => {
    if (isLocalMode && rootHandle) {
      // Debounce the save operation to avoid writing to disk on every keystroke
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        saveNotesToConfig(rootHandle, notes).catch(err => {
             console.error("Failed to auto-save notes:", err);
             toast.error("Failed to save notes to disk");
        });
      }, 1000); // 1s debounce
    }
  }, [notes, isLocalMode, rootHandle]);
  
  // --- Derived State ---
  const activeFile = (() => {
    const findFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.id === activeFileId) return node;
        if (node.children) {
          const found = findFile(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFile(files);
  })();

  const activeNotes = notes.filter(n => n.fileId === activeFileId);
  const codeHeight = lineCount * 24 + 32; 

  // --- Handlers ---

  const handleToggleMode = () => {
    setIsReadOnly(!isReadOnly);
    toast.info(isReadOnly ? "Switched to Admin Mode" : "Switched to Visitor Mode");
  };

  const handleOpenWorkspace = async () => {
    try {
        // Check for API support
        if (!('showDirectoryPicker' in window)) {
            toast.error("Your browser does not support the File System Access API. Please use Chrome or Edge.");
            return;
        }

        const handle = await (window as any).showDirectoryPicker();
        
        const loadWorkspace = async () => {
             const nodes = await readDirectoryRecursive(handle);
             const loadedNotes = await loadNotesFromConfig(handle);
             
             setRootHandle(handle);
             setFiles(nodes);
             setNotes(loadedNotes);
             setWorkspaceName(handle.name);
             setIsLocalMode(true);
             setActiveFileId(''); // Reset selection
             return handle.name;
        };

        toast.promise(
            loadWorkspace(),
            {
                loading: 'Opening workspace...',
                success: (name: string) => `Opened workspace: ${name}`,
                error: 'Failed to open workspace'
            }
        );

    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error(err);
            toast.error("Failed to open folder");
        }
    }
  };

  const handleFileSelect = async (file: FileNode) => {
    setActiveFileId(file.id);

    // 1. Local Mode: Read from Disk
    if (isLocalMode && file.handle && file.type === FileType.FILE) {
        if (!file.content) { // If content not loaded in memory yet
            try {
                const content = await readFileText(file.handle as FileSystemFileHandle);
                // Update memory cache
                const updateContent = (nodes: FileNode[]): FileNode[] => {
                    return nodes.map(n => {
                        if (n.id === file.id) return { ...n, content };
                        if (n.children) return { ...n, children: updateContent(n.children) };
                        return n;
                    });
                };
                setFiles(prev => updateContent(prev));
            } catch (err) {
                toast.error("Failed to read file from disk");
            }
        }
    }

    // 2. GitHub Mode: Lazy Load
    else if (!isLocalMode && file.type === FileType.FILE && typeof file.content === 'undefined' && file.downloadUrl) {
        const toastId = toast.loading(`Loading ${file.name}...`);
        try {
            const content = await fetchFileContent(file.downloadUrl);
            const updateNode = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.id === file.id) return { ...node, content };
                    if (node.children) return { ...node, children: updateNode(node.children) };
                    return node;
                });
            };
            setFiles(updateNode(files));
            toast.dismiss(toastId);
        } catch (error: any) {
            toast.error(`Failed to load file: ${error.message}`, { id: toastId });
        }
    }
  };

  const handleToggleFolder = (folderId: string) => {
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === folderId) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setFiles(toggleNode(files));
  };

  const handleCodeChange = async (value: string | undefined) => {
    if (isReadOnly || !activeFile || value === undefined) return;
    
    // Update state first for UI responsiveness
    const updateFileContent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
            if (node.id === activeFileId) {
                return { ...node, content: value };
            }
            if (node.children) {
                return { ...node, children: updateFileContent(node.children) };
            }
            return node;
        });
    };
    setFiles(updateFileContent(files));

    if (isLocalMode && activeFile.handle && activeFile.type === FileType.FILE) {
         try {
             await writeFileText(activeFile.handle as FileSystemFileHandle, value);
         } catch (e) {
             console.error("Failed to write file");
         }
    }
  };

  const handleAddNote = (startLine: number, endLine: number) => {
    if (isReadOnly || !activeFileId) return;
    
    const existing = notes.find(n => n.fileId === activeFileId && n.startLine === startLine);
    if (existing) {
      handleToggleExpand(existing.id);
      // Removed toast.info to reduce noise as requested
      return;
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      fileId: activeFileId, // In Local Mode, this is the relative path
      startLine: startLine,
      endLine: endLine,
      content: '',
      isExpanded: true,
      createdAt: Date.now()
    };
    setNotes([...notes, newNote]);
    setSelection(null); 
    // Removed toast.success("New note created")
  };

  const handleUpdateNote = (id: string, content: string) => {
    if (isReadOnly) return;
    setNotes(notes.map(n => n.id === id ? { ...n, content } : n));
    // Removed toast.success("Note saved")
  };

  const handleDeleteNote = (id: string) => {
    if (isReadOnly) return;
    setNotes(notes.filter(n => n.id !== id));
    toast.error("Note deleted");
  };

  const handleToggleExpand = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n));
  };

  const handleGitClone = async (repoString: string) => {
    if (isReadOnly) return;
    
    // Force Demo Mode for Git Clone
    if (isLocalMode) {
        setIsLocalMode(false);
        setWorkspaceName(null);
        setRootHandle(null);
    }

    const promise = async () => {
        const cleanStr = repoString.trim().replace(/\/$/, '').replace(/\.git$/, '');
        const gitUrlRegex = /(?:github\.com\/|^)([^\/]+)\/([^\/]+)$/;
        const match = cleanStr.match(gitUrlRegex);

        if (!match) throw new Error("Invalid format. Use 'owner/repo'");
        
        const owner = match[1];
        const repo = match[2];

        const fetchedFiles = await fetchRepoContents(owner, repo);
        const rootFolder: FileNode = {
          id: `repo-${owner}-${repo}`,
          name: repo,
          type: FileType.FOLDER,
          isOpen: true,
          children: fetchedFiles
        };
        setFiles([rootFolder]);
        setActiveFileId('');
        return `${owner}/${repo}`;
    };

    toast.promise(promise(), {
        loading: 'Cloning repository...',
        success: (repo: string) => `Successfully cloned ${repo}`,
        error: (err: any) => `Failed: ${err.message}`
    });
  };

  // --- Export Logic ---

  // Helper: Get comment syntax
  const getCommentSyntax = (filename: string): { start: string, end: string } => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'html': case 'xml': case 'svg':
            return { start: '<!--', end: '-->' };
        case 'css':
            return { start: '/*', end: '*/' };
        case 'py': case 'sh': case 'yaml': case 'yml': case 'dockerfile':
            return { start: '#', end: '' };
        default: // js, ts, java, c, cpp, etc.
            return { start: '//', end: '' };
    }
  };

  // Helper: Inject notes into code
  const injectNotesIntoCode = (content: string, fileNotes: Note[], filename: string): string => {
    if (fileNotes.length === 0) return content;
    
    const lines = content.split('\n');
    const { start, end } = getCommentSyntax(filename);
    const sortedNotes = [...fileNotes].sort((a, b) => b.startLine - a.startLine); // Bottom-up to not mess up indices if we were splicing, but here we rebuild

    // Map: Line Index -> Array of Comment Lines
    const injections: Record<number, string[]> = {};

    sortedNotes.forEach(note => {
        const lineIdx = note.startLine - 1; // 0-based
        if (!injections[lineIdx]) injections[lineIdx] = [];
        
        const noteLines = note.content.split('\n');
        const formattedNote = noteLines.map(nl => 
            `${start} [NOTE] ${nl}${end ? ' ' + end : ''}`
        );
        // Add a small divider or header
        injections[lineIdx].push(`${start} ------------------ NOTE (L${note.startLine}) ------------------ ${end}`);
        injections[lineIdx].push(...formattedNote);
        injections[lineIdx].push(`${start} ----------------------------------------------------------- ${end}`);
    });

    // Rebuild content
    const resultLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (injections[i]) {
            resultLines.push(...injections[i]);
        }
        resultLines.push(lines[i]);
    }

    return resultLines.join('\n');
  };

  const handleExportSource = async () => {
    const zip = new JSZip();
    const folderName = workspaceName || "code-chronicle-export";
    const rootFolder = zip.folder(folderName);
    if (!rootFolder) return;

    const processNode = async (node: FileNode, currentZipFolder: JSZip) => {
        if (node.type === FileType.FOLDER) {
            const newFolder = currentZipFolder.folder(node.name);
            if (newFolder && node.children) {
                for (const child of node.children) {
                    await processNode(child, newFolder);
                }
            }
        } else {
            // It's a file
            let content = node.content;
            
            // If content is missing, fetch it
            if (typeof content === 'undefined') {
                if (isLocalMode && node.handle) {
                    try {
                         content = await readFileText(node.handle as FileSystemFileHandle);
                    } catch (e) {
                         console.error(`Failed to read local file ${node.name}`, e);
                         content = '';
                    }
                } else if (node.downloadUrl) {
                    try {
                        content = await fetchFileContent(node.downloadUrl);
                    } catch (e) {
                        console.error(`Failed to fetch remote file ${node.name}`, e);
                        content = '';
                    }
                } else {
                    content = '';
                }
            }

            // Inject notes
            const fileNotes = notes.filter(n => n.fileId === node.id);
            const injectedContent = injectNotesIntoCode(content || '', fileNotes, node.name);
            
            currentZipFolder.file(node.name, injectedContent);
        }
    };

    const promise = async () => {
        for (const node of files) {
            await processNode(node, rootFolder);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}-annotated.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    toast.promise(promise(), {
        loading: 'Generating ZIP with annotated source code...',
        success: 'Export successful!',
        error: 'Failed to export'
    });
  };

  // --- Export Logic (HTML) ---
  const handleExport = () => {
    if (!activeFile || !activeFile.content) {
        toast.error("No file content to export");
        return;
    }
    const notesData = JSON.stringify(activeNotes.map(n => ({ ...n, isExpanded: true })));
    const fileContentJson = JSON.stringify(activeFile.content);
    const language = activeFile.language || 'plaintext';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${activeFile.name} - Code Notes</title>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
                    colors: { ide: { bg: '#0d1117', border: '#30363d' } }
                }
            }
        }
    </script>
    <style>
        body { background-color: #0d1117; overflow: hidden; height: 100vh; color: #c9d1d9; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        #code-rows { display: flex; flex-direction: column; padding: 16px 0; min-height: 100%; }
        .code-row { display: flex; height: 24px; font-family: 'JetBrains Mono', monospace; font-size: 14px; position: relative; }
        .code-row.has-note .code-bg-highlight { background-color: rgba(88, 166, 255, 0.1); position: absolute; inset: 0; pointer-events: none; border-top: 1px solid rgba(88, 166, 255, 0.05); border-bottom: 1px solid rgba(88, 166, 255, 0.05); }
        .code-row.has-note .gutter-marker { width: 4px; background-color: #58a6ff; position: absolute; left: 0; top: 0; bottom: 0; z-index: 10; }
        .line-number { width: 50px; flex-shrink: 0; text-align: right; padding-right: 16px; color: #6e7681; z-index: 1; }
        .code-text { color: #e6edf3; white-space: pre; padding-left: 8px; z-index: 1; }
        .hljs { background: transparent; padding: 0; color: #e6edf3; }
        #note-pane { background-color: #f8fafc; }
        .dot-pattern { background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 24px 24px; }
        .note-card { position: absolute; left: 20px; right: 20px; background: white; border-radius: 0.75rem; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .note-card.expanded { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #dbeafe; z-index: 10; }
        .note-card.collapsed { opacity: 0.9; z-index: 1; cursor: pointer; }
        .anchor-strip { position: absolute; left: 0; top: 12px; bottom: 12px; width: 4px; border-radius: 0 99px 99px 0; transition: background 0.3s; }
        .note-card.expanded .anchor-strip { background: #3b82f6; }
        .note-card.collapsed .anchor-strip { background: #cbd5e1; }
        .beak { position: absolute; top: 20px; left: -6px; width: 12px; height: 12px; background: white; transform: rotate(45deg); border-left: 1px solid transparent; border-bottom: 1px solid transparent; }
        .note-card.expanded .beak { border-color: #dbeafe; }
        .note-header { display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 1rem; border-bottom: 1px solid transparent; user-select: none; cursor: pointer; }
        .note-card.expanded .note-header { border-bottom-color: #f8fafc; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
    </style>
</head>
<body class="flex h-screen w-screen overflow-hidden text-slate-800">
    <div id="code-pane" class="w-1/2 h-full overflow-y-auto bg-ide-bg border-r border-ide-border relative"><div id="code-rows"></div></div>
    <div id="note-pane" class="w-1/2 h-full overflow-y-auto relative no-scrollbar">
        <div class="absolute inset-0 pointer-events-none dot-pattern" style="opacity: 0.5;"></div>
        <div id="notes-container" class="min-h-full relative pb-96 w-full"></div>
    </div>
    <script>
        const notes = ${notesData};
        const rawCode = ${fileContentJson};
        const codeRowsContainer = document.getElementById('code-rows');
        const tempCode = document.createElement('code'); tempCode.className = 'language-${language}'; tempCode.textContent = rawCode;
        hljs.highlightElement(tempCode);
        const lines = rawCode.split('\\n');
        let htmlBuffer = '';
        lines.forEach((line, i) => {
            const num = i + 1;
            const isDecorated = notes.some(n => num >= n.startLine && num <= n.endLine);
            const hl = hljs.highlight(line || ' ', { language: '${language}' }).value;
            htmlBuffer += \`<div class="code-row \${isDecorated ? 'has-note' : ''}"><div class="code-bg-highlight"></div><div class="gutter-marker"></div><div class="line-number">\${num}</div><div class="code-text">\${hl}</div></div>\`;
        });
        codeRowsContainer.innerHTML = htmlBuffer;
        const notesContainer = document.getElementById('notes-container');
        function renderNotes() {
            notesContainer.innerHTML = '';
            const sorted = [...notes].sort((a,b) => a.startLine - b.startLine);
            let lastBottom = -1;
            sorted.forEach(note => {
                let top = (note.startLine - 1) * 24 + 16;
                if (top < lastBottom + 20) top = lastBottom + 20;
                const card = document.createElement('div');
                card.className = 'note-card ' + (note.isExpanded ? 'expanded' : 'collapsed');
                card.style.top = top + 'px';
                card.onclick = (e) => { if(e.target.closest('.note-header')) { note.isExpanded = !note.isExpanded; renderNotes(); }};
                
                const title = note.content.split('\\n')[0].replace(/^#+\\s*/, '') || 'Untitled Note';

                card.innerHTML = \`<div class="beak"></div><div class="anchor-strip"></div><div class="note-header"><div><span class="font-mono font-bold text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded mr-2">L\${note.startLine}</span><span class="text-xs font-medium text-slate-600 truncate flex-1">\${title}</span></div></div><div style="height:\${note.isExpanded?'auto':'0px'};overflow:hidden"><div class="p-4 prose prose-sm">\${marked.parse(note.content)}</div></div>\`;
                notesContainer.appendChild(card);
                lastBottom = top + card.offsetHeight;
            });
            notesContainer.style.height = (lastBottom + 300) + 'px';
        }
        const codePane = document.getElementById('code-pane'); const notePane = document.getElementById('note-pane');
        let syncCode = false, syncNote = false;
        codePane.onscroll = () => { if(!syncNote) { syncCode = true; notePane.scrollTop = codePane.scrollTop; } else syncNote = false; };
        notePane.onscroll = () => { if(!syncCode) { syncNote = true; codePane.scrollTop = notePane.scrollTop; } else syncCode = false; };
        renderNotes();
    </script>
</body>
</html>`;
    const url = URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' }));
    const a = document.createElement('a'); a.href = url; a.download = `${activeFile.name}-blog-export.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // --- Scroll Sync ---
  const handleEditorScroll = (top: number) => {
    if (isSyncingFromNotes.current) { isSyncingFromNotes.current = false; return; }
    isSyncingFromEditor.current = true;
    if (noteAreaRef.current) noteAreaRef.current.scrollTop = top;
  };

  const handleNoteAreaScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingFromEditor.current) { isSyncingFromEditor.current = false; return; }
    isSyncingFromNotes.current = true;
    if (editorRef.current) editorRef.current.setScrollTop(e.currentTarget.scrollTop);
  };

  // --- Effects ---
  useEffect(() => {
    if (editorRef.current) editorRef.current.setScrollTop(0);
    if (noteAreaRef.current) noteAreaRef.current.scrollTop = 0;
    setSelection(null);
    if (editorRef.current?.getModel()) setLineCount(editorRef.current.getModel().getLineCount());
  }, [activeFileId]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117] text-slate-300">
      <Toaster richColors position="bottom-center" theme="dark" />
      <TopBar 
        isReadOnly={isReadOnly}
        workspaceName={workspaceName}
        onOpenWorkspace={handleOpenWorkspace} 
        onGitClone={handleGitClone} 
        onExport={handleExport}
        onExportSource={handleExportSource}
        onToggleMode={handleToggleMode}
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-[20%] min-w-[200px] bg-[#161b22]">
          <FileExplorer 
            files={files} 
            activeFileId={activeFileId} 
            onFileSelect={handleFileSelect} 
            onToggleFolder={handleToggleFolder}
          />
        </div>
        <div className="w-[40%] bg-[#0d1117] relative border-r border-[#30363d] group">
          {activeFile ? (
            <>
                <CodeEditor 
                  editorRef={editorRef}
                  content={activeFile.content || ''} 
                  language={activeFile.language || 'javascript'} 
                  notes={activeNotes}
                  isReadOnly={isReadOnly}
                  onChange={handleCodeChange}
                  onAddNote={handleAddNote}
                  onScroll={handleEditorScroll}
                  onSelectionChange={setSelection}
                  onLineCountChange={setLineCount}
                />
                <AnimatePresence>
                    {selection && !isReadOnly && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-8 right-8 z-50">
                            <button onClick={() => handleAddNote(selection.startLine, selection.endLine)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg font-medium text-sm">
                                <MessageSquarePlus size={18} /> Annotate
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
               <Command size={48} className="opacity-20" />
               <p>{isLocalMode ? 'Select a file to start editing' : 'Open a workspace or select a demo file'}</p>
            </div>
          )}
        </div>
        <div ref={noteAreaRef} onScroll={handleNoteAreaScroll} className="w-[40%] bg-slate-50 overflow-y-auto relative no-scrollbar">
          <div className="min-h-full relative pb-96">
            <NoteArea 
              notes={activeNotes} 
              isReadOnly={isReadOnly}
              editorLineHeight={24}
              minHeight={codeHeight}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;