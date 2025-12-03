# CodeChronicle 📜

CodeChronicle is a modern, local-first code annotation tool designed for developers, technical writers, and educators. It provides a seamless interface to read code and write context-aware notes side-by-side, creating a rich narrative for your codebase.

![CodeChronicle Screenshot](https://via.placeholder.com/800x450?text=CodeChronicle+Preview)

## ✨ Features

- **Dual Modes**:
  - **Demo Mode**: Try the app instantly in your browser with sample data (saved to LocalStorage).
  - **Local Workspace Mode**: Open real folders on your hard drive using the File System Access API. Edits to code are saved to disk, and notes are persisted in a `.code-chronicle.json` file in your project root.

- **Split-View Interface**:
  - **Left**: VS Code-style file explorer and Monaco Editor with full syntax highlighting.
  - **Right**: A block-based note-taking area that supports Markdown.

- **Smart Context Linking**:
  - Select any code range to create a note.
  - Notes are visually linked to specific lines of code.
  - **Bidirectional Scroll Sync**: Scrolling the code moves the notes; scrolling the notes moves the code. No lag, no misalignment.

- **GitHub Integration**:
  - Clone public repositories directly via the GitHub API (e.g., input `facebook/react`).
  - Lazy loading of file contents for performance.

- **Export Options**:
  - **Export as Blog (HTML)**: One-click export to a standalone, interactive HTML file. It preserves the split view, syntax highlighting, and scroll sync logic. Perfect for embedding in blogs.
  - **Export Source (ZIP)**: Generates a ZIP file where your notes are injected as comments directly into the source code files.

- **Visitor/Admin Modes**:
  - **Admin Mode**: Full edit permissions (Clone, Import, Edit Code, Add Notes).
  - **Visitor Mode**: Read-only interface suitable for presentation or public deployment.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/code-chronicle.git
   cd code-chronicle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

To create a static build for deployment:

```bash
npm run build
```

The artifacts will be in the `build` folder, ready to be served by Nginx, Vercel, or Netlify.

## 💾 Data Persistence

CodeChronicle supports two methods of data persistence:

1.  **Local Workspace Mode (Recommended)**:
    - Click "Open Local" to select a folder on your computer.
    - Code edits are **saved directly to your files** (Ctrl+S or Auto-save).
    - Notes are saved to a hidden `.code-chronicle.json` file in the root of your opened folder. This ensures your notes travel with your project.

2.  **Demo Mode**:
    - If you don't open a local folder, data is stored in your browser's **LocalStorage**.
    - **Warning**: Clearing your browser cache will delete work done in Demo Mode.

## 🛠 Tech Stack

- **Core**: React 18, TypeScript
- **Editor**: @monaco-editor/react
- **Styling**: Tailwind CSS, Framer Motion (for smooth animations)
- **Icons**: Lucide React
- **Utils**: Sonner (Toast notifications), Marked (Markdown parsing), Highlight.js (Export syntax highlighting), JSZip (Source export)

## 📄 License

MIT