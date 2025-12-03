import { FileNode, FileType } from "./types";

export const SAMPLE_FILE_TREE: FileNode[] = [
  {
    id: 'root-1',
    name: 'src',
    type: FileType.FOLDER,
    isOpen: true,
    parentId: null,
    children: [
      {
        id: 'file-1',
        name: 'app.js',
        type: FileType.FILE,
        language: 'javascript',
        parentId: 'root-1',
        content: `// Main Application Entry
import React from 'react';

function App() {
  const [count, setCount] = React.useState(0);

  // Initialize the data
  React.useEffect(() => {
    console.log("App mounted");
  }, []);

  return (
    <div className="container">
      <h1>Hello World</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default App;`
      },
      {
        id: 'file-2',
        name: 'utils.py',
        type: FileType.FILE,
        language: 'python',
        parentId: 'root-1',
        content: `import math

def calculate_circle_area(radius):
    """Calculates the area of a circle"""
    if radius < 0:
        raise ValueError("Radius cannot be negative")
    
    return math.pi * (radius ** 2)

def main():
    r = 5
    print(f"Area: {calculate_circle_area(r)}")

if __name__ == "__main__":
    main()`
      }
    ]
  },
  {
    id: 'root-2',
    name: 'package.json',
    type: FileType.FILE,
    language: 'json',
    parentId: null,
    content: `{
  "name": "demo-project",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "react": "^18.2.0"
  }
}`
  }
];

export const MOCK_NOTES = [
  {
    id: 'note-1',
    fileId: 'file-1',
    startLine: 5,
    endLine: 5,
    content: '## State Management\nUsing `useState` hook to manage the counter state locally.',
    isExpanded: true,
    createdAt: Date.now()
  },
  {
    id: 'note-2',
    fileId: 'file-1',
    startLine: 8,
    endLine: 10,
    content: '## Side Effects\nUsing `useEffect` with an empty dependency array to run this logic only once on mount.',
    isExpanded: false,
    createdAt: Date.now() + 100
  }
];
