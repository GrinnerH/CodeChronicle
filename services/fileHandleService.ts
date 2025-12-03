import { FileNode, FileType, Note } from "../types";

const NOTES_CONFIG_FILE = '.code-chronicle.json';

// Helper to determine language from extension
const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return 'javascript';
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'py': return 'python';
    case 'json': return 'json';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
};

/**
 * Recursively reads a directory handle and builds a FileNode tree.
 * @param dirHandle The directory handle to read
 * @param parentPath The relative path so far (e.g., "src/components")
 */
export const readDirectoryRecursive = async (
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string = ''
): Promise<FileNode[]> => {
  const nodes: FileNode[] = [];

  for await (const entry of dirHandle.values()) {
    // Skip hidden files/folders (like .git, .DS_Store)
    if (entry.name.startsWith('.') && entry.name !== NOTES_CONFIG_FILE) {
      continue;
    }

    // Skip the config file itself from the tree view
    if (entry.name === NOTES_CONFIG_FILE) {
        continue;
    }

    const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    
    if (entry.kind === 'file') {
      nodes.push({
        id: currentPath, // Use path as ID for reliable note mapping
        name: entry.name,
        type: FileType.FILE,
        language: getLanguageFromFilename(entry.name),
        handle: entry as FileSystemFileHandle,
        path: currentPath
      });
    } else if (entry.kind === 'directory') {
      const children = await readDirectoryRecursive(entry as FileSystemDirectoryHandle, currentPath);
      nodes.push({
        id: currentPath,
        name: entry.name,
        type: FileType.FOLDER,
        children: children,
        isOpen: false,
        handle: entry as FileSystemDirectoryHandle,
        path: currentPath
      });
    }
  }

  // Sort: Folders first, then files
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === FileType.FOLDER ? -1 : 1;
  });
};

/**
 * Reads the content of a file handle
 */
export const readFileText = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  const file = await fileHandle.getFile();
  return await file.text();
};

/**
 * Writes content to a file handle
 */
export const writeFileText = async (fileHandle: FileSystemFileHandle, content: string) => {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};

/**
 * Loads notes from the .code-chronicle.json file in the root
 */
export const loadNotesFromConfig = async (rootHandle: FileSystemDirectoryHandle): Promise<Note[]> => {
  try {
    const fileHandle = await rootHandle.getFileHandle(NOTES_CONFIG_FILE);
    const text = await readFileText(fileHandle);
    return JSON.parse(text);
  } catch (error) {
    // File doesn't exist or error reading, return empty
    return [];
  }
};

/**
 * Saves notes to the .code-chronicle.json file in the root
 */
export const saveNotesToConfig = async (rootHandle: FileSystemDirectoryHandle, notes: Note[]) => {
  try {
    const fileHandle = await rootHandle.getFileHandle(NOTES_CONFIG_FILE, { create: true });
    await writeFileText(fileHandle, JSON.stringify(notes, null, 2));
  } catch (error) {
    console.error("Failed to save notes config:", error);
    throw error;
  }
};
