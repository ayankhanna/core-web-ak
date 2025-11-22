/**
 * Simple rich text editor - just works
 */
import { useRef, useEffect } from 'react'
import { useDarkMode } from '../../contexts/DarkModeContext'

type SimpleEditorProps = {
  initialContent: string
  onChange: (content: string) => void
}

export function SimpleEditor({ initialContent, onChange }: SimpleEditorProps) {
  const { isDarkMode } = useDarkMode()
  const editorRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isInitializedRef = useRef(false)

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent
      isInitializedRef.current = true
    }
  }, [initialContent])

  const handleInput = () => {
    if (!editorRef.current) return
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce save
    timeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    }, 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      document.execCommand('bold', false)
    }

    // Italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault()
      document.execCommand('italic', false)
    }

    // Underline
    if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
      e.preventDefault()
      document.execCommand('underline', false)
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-full outline-none ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
          fontSize: '16px',
          lineHeight: '1.75',
          padding: '0',
        }}
        data-placeholder="Start writing... Use Cmd+B for bold, Cmd+I for italic, Cmd+U for underline"
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] {
          cursor: text;
        }
        [contenteditable] b,
        [contenteditable] strong {
          font-weight: 700;
        }
        [contenteditable] i,
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        [contenteditable] p {
          margin-bottom: 1em;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          margin-left: 2em;
          margin-bottom: 1em;
        }
        [contenteditable] li {
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  )
}
