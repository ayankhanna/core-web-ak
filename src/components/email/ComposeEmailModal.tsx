import { useState } from 'react'
import { MdClose, MdSend, MdAttachFile, MdFormatBold, MdFormatItalic } from 'react-icons/md'
import { sendEmail } from '@/lib/api-client'

interface ComposeEmailModalProps {
  userId: string
  onClose: () => void
  onSuccess?: () => void
}

export default function ComposeEmailModal({ userId, onClose, onSuccess }: ComposeEmailModalProps) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showCcBcc, setShowCcBcc] = useState(false)

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in recipient, subject, and message')
      return
    }

    setSending(true)
    try {
      await sendEmail(userId, {
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        ...(cc.trim() ? { cc: cc.split(',').map(e => e.trim()) } : {}),
        ...(bcc.trim() ? { bcc: bcc.split(',').map(e => e.trim()) } : {})
      })
      
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Failed to send email:', error)
      alert(`Failed to send email: ${error.message || 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-[var(--bg-primary)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            New Message
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Compose Fields */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-4">
            {/* To Field */}
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <label className="text-sm font-medium text-[var(--text-tertiary)] w-12">
                To
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                autoFocus
              />
              <button
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {showCcBcc ? 'Hide' : 'Cc/Bcc'}
              </button>
            </div>

            {/* Cc/Bcc Fields */}
            {showCcBcc && (
              <>
                <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                  <label className="text-sm font-medium text-[var(--text-tertiary)] w-12">
                    Cc
                  </label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc1@example.com, cc2@example.com"
                    className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                  />
                </div>

                <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                  <label className="text-sm font-medium text-[var(--text-tertiary)] w-12">
                    Bcc
                  </label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc1@example.com, bcc2@example.com"
                    className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                  />
                </div>
              </>
            )}

            {/* Subject Field */}
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <label className="text-sm font-medium text-[var(--text-tertiary)] w-12">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
              />
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-2 py-2 border-b border-[var(--border-color)]">
              <button className="p-2 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] transition-colors" title="Bold">
                <MdFormatBold size={18} />
              </button>
              <button className="p-2 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] transition-colors" title="Italic">
                <MdFormatItalic size={18} />
              </button>
              <div className="flex-1" />
              <button className="p-2 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] transition-colors" title="Attach file">
                <MdAttachFile size={18} />
              </button>
            </div>

            {/* Message Body */}
            <div className="min-h-[300px]">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                className="w-full h-full min-h-[300px] bg-transparent border-none outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            Press ⌘ + Enter to send
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all shadow-lg
                ${sending || !to.trim() || !subject.trim() || !body.trim()
                  ? 'bg-blue-400 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                }
              `}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <MdSend size={18} />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

