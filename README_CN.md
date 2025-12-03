# CodeChronicle (代码编年史) 📜

CodeChronicle 是一个现代化的、本地优先的代码笔记与标注工具。它专为开发者、技术博主和教育工作者设计，提供了一个左侧代码、右侧笔记的沉浸式界面，帮助你为复杂的代码库构建清晰的叙事逻辑。

## ✨ 核心功能

- **双模式支持**:
  - **演示模式 (Demo Mode)**: 直接在浏览器体验，数据存储在本地缓存中。
  - **本地工作区模式 (Local Workspace Mode)**: 通过 File System Access API 打开电脑上的真实文件夹。代码修改直接写入硬盘，笔记自动保存在项目根目录的 `.code-chronicle.json` 文件中。

- **双栏沉浸式界面**:
  - **左侧**: 包含 VS Code 风格的文件资源管理器和基于 Monaco Editor 的代码编辑器（支持语法高亮）。
  - **右侧**: 基于块（Block）的笔记区域，支持 Markdown 实时渲染。

- **智能上下文关联**:
  - 选中代码任意行即可添加笔记。
  - 笔记卡片与代码行在视觉上严格对齐。
  - **双向无延迟同步滚动**: 滚动代码区，笔记会自动跟随；滚动笔记区，代码也会自动定位。彻底消除“果冻效应”。

- **GitHub 集成**:
  - 支持通过 GitHub API 直接克隆公共仓库（输入 `owner/repo` 格式，如 `facebook/react`）。
  - 支持文件懒加载，优化大型仓库的浏览体验。

- **强大的导出功能**:
  - **博客导出 (Export HTML)**: 一键将当前代码文件和所有笔记导出为一个独立的 HTML 文件。导出的文件是一个微型单页应用，保留了完整的主题配色、语法高亮、折叠交互和同步滚动功能。非常适合直接上传到服务器作为技术博客文章。
  - **源码导出 (Export Src)**: 生成 ZIP 压缩包，将您的笔记作为注释（Comment）自动插入到源代码文件对应的位置中。

- **访客/管理员模式**:
  - **管理员模式**: 拥有所有权限（Git 克隆、编辑代码、增删笔记）。
  - **访客模式**: 纯阅读界面，隐藏编辑控件，适合公开演示或部署展示。

## 🚀 快速开始

### 环境要求
- Node.js (v16 或更高版本)
- npm 或 yarn

### 本地部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/code-chronicle.git
   cd code-chronicle
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动本地服务器**
   ```bash
   npm run dev
   ```
   在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 部署到生产环境

构建静态文件：

```bash
npm run build
```

构建生成的 `build` 目录包含所有静态资源，可以部署到 Nginx、Vercel、Netlify 或任何静态网站托管服务上。

## 💾 关于数据存储

CodeChronicle 支持两种存储方式：

1.  **本地工作区模式 (推荐)**:
    - 点击 "Open Local" 打开电脑文件夹。
    - 代码修改会**直接保存到您的硬盘文件**中。
    - 笔记数据保存在该文件夹根目录下的 `.code-chronicle.json` 文件中。这样即使您移动项目文件夹，笔记也不会丢失。

2.  **演示模式**:
    - 如果不打开本地文件夹，所有数据存储在浏览器的 **LocalStorage** 中。
    - **警告**: 清除浏览器缓存会导致演示模式下的笔记丢失。

## 🛠 技术栈

- **核心框架**: React 18, TypeScript
- **编辑器内核**: @monaco-editor/react
- **样式与动画**: Tailwind CSS, Framer Motion
- **图标库**: Lucide React
- **工具库**: Sonner (通知提示), Marked (Markdown 解析), Highlight.js (导出高亮), JSZip (源码打包)

## 📄 开源协议

MIT