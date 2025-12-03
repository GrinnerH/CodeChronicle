import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import { Note } from '../types';

interface CodeEditorProps {
  content: string;
  language: string;
  notes: Note[];
  isReadOnly?: boolean;
  onChange: (value: string | undefined) => void;
  onAddNote: (startLine: number, endLine: number) => void;
  onScroll: (scrollTop: number) => void;
  onSelectionChange: (range: { startLine: number; endLine: number } | null) => void;
  onLineCountChange: (count: number) => void;
  editorRef: React.MutableRefObject<any>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  content, 
  language, 
  notes, 
  isReadOnly = false,
  onChange, 
  onAddNote,
  onScroll,
  onSelectionChange,
  onLineCountChange,
  editorRef 
}) => {
  const decorationsRef = useRef<string[]>([]);
  const monaco = useMonaco();

  // Disable Monaco diagnostics to remove red underlines
  useEffect(() => {
    if (!monaco) return;
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  }, [monaco]);

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Report initial line count
    onLineCountChange(editor.getModel()?.getLineCount() || 0);

    editor.onDidScrollChange((e) => {
      onScroll(e.scrollTop);
    });

    editor.onDidChangeModelContent(() => {
        onLineCountChange(editor.getModel()?.getLineCount() || 0);
    });

    // Listen for selection changes
    editor.onDidChangeCursorSelection((e) => {
        const selection = e.selection;
        if (selection && !selection.isEmpty()) {
            onSelectionChange({
                startLine: selection.startLineNumber,
                endLine: selection.endLineNumber
            });
        } else {
            onSelectionChange(null);
        }
    });

    // Only add interactive features if NOT read only
    if (!isReadOnly) {
        editor.onMouseDown((e) => {
            if (e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
                const lineNumber = e.target.position?.lineNumber;
                if (lineNumber) {
                    editor.setSelection({
                        startLineNumber: lineNumber,
                        startColumn: 1,
                        endLineNumber: lineNumber,
                        endColumn: 1
                    });
                }
            }
        });

        editor.addAction({
            id: 'add-note-action',
            label: 'Add Note to Selection',
            contextMenuGroupId: 'navigation',
            keybindings: [
                monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyK
            ],
            run: (ed) => {
                const selection = ed.getSelection();
                if (selection && !selection.isEmpty()) {
                    onAddNote(selection.startLineNumber, selection.endLineNumber);
                } else {
                    const pos = ed.getPosition();
                    if (pos) {
                        onAddNote(pos.lineNumber, pos.lineNumber);
                    }
                }
            }
        });
    }
  };

  useEffect(() => {
    if (!editorRef.current || !monaco) return;

    const newDecorations = notes.map(note => ({
      range: new monaco.Range(note.startLine, 1, note.endLine, 1),
      options: {
        isWholeLine: true,
        className: 'myLineDecoration',
        linesDecorationsClassName: 'myLineGutterDecoration',
      }
    }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

  }, [notes, monaco]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .myLineGutterDecoration {
        background: #58a6ff;
        width: 4px !important;
        margin-left: 5px;
        border-radius: 2px;
      }
      .myLineDecoration {
        background: rgba(88, 166, 255, 0.1);
        border-top: 1px solid rgba(88, 166, 255, 0.05);
        border-bottom: 1px solid rgba(88, 166, 255, 0.05);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="h-full w-full relative bg-[#0d1117]">
      <Editor
        height="100%"
        theme="vs-dark"
        path={language}
        defaultLanguage={language}
        defaultValue={content}
        value={content}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly: isReadOnly,
          domReadOnly: isReadOnly,
          quickSuggestions: false,
          lightbulb: { enabled: false },
          hover: { enabled: false },
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          lineHeight: 24,
          scrollBeyondLastLine: false,
          folding: true,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          padding: { top: 16, bottom: 16 },
          contextmenu: !isReadOnly,
          scrollbar: {
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12,
            useShadows: false,
            vertical: 'visible',
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
};
