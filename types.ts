export enum FileType {
  FILE = 'FILE',
  FOLDER = 'FOLDER'
}

export interface FileNode {
  id: string; // In Local Mode, this is the relative path (e.g., "src/App.tsx")
  name: string;
  type: FileType;
  content?: string; // For files
  language?: string; // e.g., 'javascript', 'python'
  children?: FileNode[]; // For folders
  isOpen?: boolean; // UI state for folder
  parentId?: string | null;
  path?: string; // Full path for API calls
  downloadUrl?: string; // URL to fetch raw content (GitHub mode)
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle; // Browser File System Handle (Local Mode)
}

export interface Note {
  id: string;
  fileId: string; // Matches FileNode.id (path)
  startLine: number;
  endLine: number;
  content: string;
  isExpanded: boolean;
  createdAt: number;
}

export interface EditorViewState {
  scrollTop: number;
  lineHeight: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  border: string;
}

export interface ReadOnlyProps {
  isReadOnly?: boolean;
}