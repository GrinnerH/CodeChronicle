import { FileNode, FileType } from "../types";

const GITHUB_API_BASE = "https://api.github.com/repos";

// Helper to convert GitHub API response to our FileNode structure
const mapGitHubNode = (node: any, parentId: string | null = null): FileNode => {
  return {
    id: node.sha,
    name: node.name,
    type: node.type === 'dir' ? FileType.FOLDER : FileType.FILE,
    path: node.path,
    parentId,
    children: node.type === 'dir' ? [] : undefined,
    isOpen: false,
    content: undefined, // Content is fetched lazily for files
    downloadUrl: node.download_url
  };
};

export const fetchRepoContents = async (owner: string, repo: string, path: string = ''): Promise<FileNode[]> => {
  try {
    const url = `${GITHUB_API_BASE}/${owner}/${repo}/contents/${path}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
         throw new Error("Repository not found. Please check the URL and visibility.");
      }
      
      if (response.status === 403) {
         throw new Error("GitHub API rate limit exceeded. Please try again later.");
      }

      // Try to parse detailed error message from GitHub JSON body
      let details = response.statusText;
      try {
         const json = await response.json();
         if (json.message) details = json.message;
      } catch (e) {
         // Fallback to status text if JSON parse fails
      }

      throw new Error(`GitHub API Error ${response.status}: ${details}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map((item: any) => mapGitHubNode(item));
    } else {
      // Single file case, shouldn't happen for directory fetch but good to handle
      return [mapGitHubNode(data)];
    }
  } catch (error: any) {
    console.error("Failed to fetch repo contents:", error);
    throw error;
  }
};

export const fetchFileContent = async (downloadUrl: string): Promise<string> => {
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        return await response.text();
    } catch (e) {
        console.error("Fetch content error:", e);
        throw e;
    }
};