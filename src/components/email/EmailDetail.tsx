import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { fetchEmails, syncEmails, getEmailDetails, sendEmail } from '@/lib/api-client'
import type { Email, EmailDetail as EmailDetailType } from '@/lib/api-client'
import { MdArrowBack, MdSend, MdAttachFile, MdFormatBold, MdFormatItalic, MdFormatListBulleted } from 'react-icons/md'

interface EmailDetailProps {
  email: Email
  userId: string
  onClose: () => void
}

export default function EmailDetail({ email, userId, onClose }: EmailDetailProps) {
  const [detail, setDetail] = useState<EmailDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Reply state
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [replySuccess, setReplySuccess] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getEmailDetails(userId, email.external_id)
        if (mounted) {
          setDetail(response.email)
        }
      } catch (err: any) {
        if (mounted) {
          console.error('Error fetching email details:', err)
          setError('Failed to load email content')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchDetails()

    return () => {
      mounted = false
    }
  }, [email.external_id, userId])

  const handleSendReply = async () => {
    if (!replyBody.trim()) return
    
    setSending(true)
    try {
      // Clean sender for reply TO
      const replyTo = email.from.match(/<([^>]+)>/)?.[1] || email.from
      
      await sendEmail(userId, {
        to: replyTo,
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        body: replyBody,
        thread_id: email.thread_id
      })
      
      setReplyBody('')
      setReplySuccess(true)
      setTimeout(() => setReplySuccess(false), 3000)
    } catch (err: any) {
      console.error('Failed to send reply:', err)
      alert('Failed to send reply. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const getSenderName = (from: string) => {
    const match = from.match(/^"?(.*?)"?\s*<.*>$/)
    return match ? match[1] : from
  }

  const getSenderEmail = (from: string) => {
    const match = from.match(/<([^>]+)>/)
    return match ? match[1] : from
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        <p>{error}</p>
        <button onClick={onClose} className="ml-4 underline">Go Back</button>
      </div>
    )
  }

  const displayEmail = detail || email

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header - Back Button & Subject */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex-shrink-0">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"
          title="Back"
        >
          <MdArrowBack size={22} />
        </button>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">
            {displayEmail.subject}
          </h1>
        </div>
        
        <div className="text-sm text-[var(--text-tertiary)] whitespace-nowrap">
          {displayEmail.received_at && format(new Date(displayEmail.received_at), 'MMM d, h:mm a')}
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Message Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-[var(--border-color)]">
          
          {/* Sender Info */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-medium shadow-sm">
              {getSenderName(displayEmail.from).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-semibold text-[var(--text-primary)]">
                {getSenderName(displayEmail.from)}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                {getSenderEmail(displayEmail.from)}
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="prose dark:prose-invert max-w-none text-[var(--text-primary)]">
            {detail?.body_html ? (
               <div 
                 dangerouslySetInnerHTML={{ __html: detail.body_html }} 
                 className="email-content"
                 style={{ fontFamily: 'inherit' }}
               />
            ) : (
              <div className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                {detail?.body_plain || displayEmail.snippet}
              </div>
            )}
          </div>
          
          {/* Attachments */}
          {detail?.has_attachments && (
            <div className="mt-10 pt-6 border-t border-[var(--border-color)]">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                <MdAttachFile /> Attachments ({detail.attachment_count || 0})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {detail.attachments?.map((att: any, i: number) => (
                  <div key={i} className="p-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)]/50 text-sm text-[var(--text-primary)] truncate">
                    {att.filename || 'Unnamed File'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Reply Box (Fixed Width) */}
        <div className="w-[400px] flex flex-col bg-[var(--bg-secondary)]/30 border-l border-[var(--border-color)]">
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Reply to {getSenderName(displayEmail.from)}
            </h3>
            
            <div className="flex-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              {/* Toolbar */}
              <div className="flex items-center gap-2 p-2 border-b border-[var(--border-color)]">
                <button className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <MdFormatBold size={18} />
                </button>
                <button className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <MdFormatItalic size={18} />
                </button>
                <button className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <MdFormatListBulleted size={18} />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                className="flex-1 w-full p-4 bg-transparent border-none resize-none focus:ring-0 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                placeholder="Write your reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              
              {/* Footer Actions */}
              <div className="p-3 flex items-center justify-between bg-[var(--bg-secondary)]/20 rounded-b-xl">
                <button className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  <MdAttachFile size={20} />
                </button>
                
                <button 
                  onClick={handleSendReply}
                  disabled={!replyBody.trim() || sending}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all
                    ${!replyBody.trim() || sending 
                      ? 'bg-blue-400 cursor-not-allowed opacity-50' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }
                  `}
                >
                  {sending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      Send <MdSend size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {replySuccess && (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-lg text-center animate-fade-in">
                Reply sent successfully!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
