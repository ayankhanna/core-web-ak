import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { getThreadEmails, sendEmail } from '@/lib/api-client'
import type { Email, EmailDetail as EmailDetailType } from '@/lib/api-client'
import { MdArrowBack, MdSend, MdAttachFile } from 'react-icons/md'
import EmailBodyRenderer from './EmailBodyRenderer'

interface EmailDetailProps {
  email: Email
  userId: string
  onClose: () => void
}

export default function EmailDetail({ email, userId, onClose }: EmailDetailProps) {
  const [threadEmails, setThreadEmails] = useState<EmailDetailType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Reply state
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Resizer state
  const [rightPanelWidth, setRightPanelWidth] = useState(420)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages load or change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadEmails])

  // Handle resize
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = containerRect.right - e.clientX
      // Constrain between 300px and 600px
      setRightPanelWidth(Math.max(300, Math.min(600, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    let mounted = true

    const fetchThreadDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch all emails in the thread
        const response = await getThreadEmails(userId, email.thread_id || email.external_id)
        if (mounted) {
          setThreadEmails(response.emails || [])
        }
      } catch (err: any) {
        if (mounted) {
          console.error('Error fetching thread details:', err)
          setError('Failed to load conversation')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchThreadDetails()

    return () => {
      mounted = false
    }
  }, [email.external_id, email.thread_id, userId])

  const handleSendReply = async () => {
    if (!replyBody.trim()) return
    
    setSending(true)
    try {
      const latestMsg = threadEmails.length > 0 ? threadEmails[threadEmails.length - 1] : email
      // Clean sender for reply TO
      const replyTo = latestMsg.from.match(/<([^>]+)>/)?.[1] || latestMsg.from
      
      await sendEmail(userId, {
        to: replyTo,
        subject: latestMsg.subject.startsWith('Re:') ? latestMsg.subject : `Re: ${latestMsg.subject}`,
        body: replyBody,
        thread_id: email.thread_id
      })
      
      setReplyBody('')
      
      // Refresh the thread to show the new message
      const refreshThread = async () => {
        try {
          const response = await getThreadEmails(userId, email.thread_id || email.external_id)
          setThreadEmails(response.emails || [])
        } catch (err) {
          console.error('Failed to refresh thread:', err)
        }
      }
      await refreshThread()
    } catch (err: any) {
      console.error('Failed to send reply:', err)
      alert('Failed to send reply. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const getSenderName = (from: string) => {
    const match = from.match(/^"?(.*?)"?\s*<.*>$/)
    return match ? match[1] : from.split('<')[0].trim() || from
  }

  const getEmailAddress = (from: string) => {
    const match = from.match(/<([^>]+)>/)
    return match ? match[1] : from
  }


  // Determine if message is from current user (sent by me)
  // Simple logic: if the message has 'SENT' label, it was sent by the user
  const isFromCurrentUser = (msg: EmailDetailType) => {
    const hasSentLabel = msg.labels?.includes('SENT') || msg.labels?.includes('Sent')
    return hasSentLabel
  }

  // Get user's email from any sent message in the thread
  const getUserEmail = () => {
    // Find a message with SENT label - that's from the user
    const sentMessage = threadEmails.find(msg => 
      msg.labels?.includes('SENT') || msg.labels?.includes('Sent')
    )
    
    if (sentMessage) {
      return getEmailAddress(sentMessage.from).toLowerCase()
    }
    
    // Fallback: user is the recipient of the first received message
    const receivedMessage = threadEmails.find(msg => 
      !msg.labels?.includes('SENT') && !msg.labels?.includes('Sent')
    )
    
    if (receivedMessage) {
      return getEmailAddress(receivedMessage.to).toLowerCase()
    }
    
    // Last fallback
    return threadEmails.length > 0 
      ? getEmailAddress(threadEmails[0].to).toLowerCase()
      : getEmailAddress(email.to).toLowerCase()
  }

  // Get the other person in conversation
  const getOtherPerson = () => {
    const userEmail = getUserEmail().toLowerCase().trim()
    
    if (threadEmails.length > 0) {
      // Find first message from someone who isn't the user
      for (const msg of threadEmails) {
        const msgFromEmail = getEmailAddress(msg.from).toLowerCase().trim()
        if (msgFromEmail !== userEmail) {
          return getSenderName(msg.from)
        }
      }
      // If all messages are from user, get the recipient from first message
      const firstMsgTo = getEmailAddress(threadEmails[0].to).toLowerCase().trim()
      if (firstMsgTo !== userEmail) {
        return getSenderName(threadEmails[0].to)
      }
      // Last resort - check other recipients
      for (const msg of threadEmails) {
        const msgToEmail = getEmailAddress(msg.to).toLowerCase().trim()
        if (msgToEmail !== userEmail) {
          return getSenderName(msg.to)
        }
      }
    }
    
    // Fallback to initial email
    const initialFromEmail = getEmailAddress(email.from).toLowerCase().trim()
    if (initialFromEmail !== userEmail) {
      return getSenderName(email.from)
    }
    return getSenderName(email.to)
  }

  const getOtherPersonInitial = () => {
    return getOtherPerson().charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500 bg-[var(--bg-primary)]">
        <p>{error}</p>
        <button onClick={onClose} className="ml-4 underline">Go Back</button>
      </div>
    )
  }

  const latestEmail = threadEmails.length > 0 ? threadEmails[threadEmails.length - 1] : email

  return (
    <div 
      className="h-full flex flex-col bg-[var(--bg-primary)]"
      style={{ 
        userSelect: isResizing ? 'none' : 'auto',
        cursor: isResizing ? 'col-resize' : 'auto'
      }}
    >
      {/* Header - Back Button, Avatar, Name & Subject */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex-shrink-0 shadow-sm">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"
          title="Back"
        >
          <MdArrowBack size={22} />
        </button>
        
        {/* Avatar & Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-base font-semibold shadow-sm flex-shrink-0">
            {getOtherPersonInitial()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[var(--text-primary)] truncate">
              {getOtherPerson()}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] truncate">
              {latestEmail.subject}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden max-w-full">
        
        {/* Left: Messages Area - Chat Bubbles */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 bg-[var(--bg-secondary)]/20">
          <div className="space-y-4 pr-4 max-w-full">
            {threadEmails.map((msg, index) => {
              const isFromUser = isFromCurrentUser(msg)
              const showDateDivider = index === 0 || 
                (msg.received_at && threadEmails[index - 1]?.received_at && 
                 format(new Date(msg.received_at), 'yyyy-MM-dd') !== 
                 format(new Date(threadEmails[index - 1].received_at!), 'yyyy-MM-dd'))

              return (
                <div key={msg.external_id}>
                  {/* Date Divider */}
                  {showDateDivider && msg.received_at && (
                    <div className="flex items-center justify-center my-6">
                      <div className="px-4 py-1.5 bg-[var(--bg-secondary)] rounded-full text-xs text-[var(--text-tertiary)] font-medium">
                        {format(new Date(msg.received_at), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {/* Avatar for received messages */}
                    {!isFromUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm flex-shrink-0">
                        {getOtherPersonInitial()}
                      </div>
                    )}

                    <div className={`flex flex-col ${isFromUser ? 'items-end' : 'items-start'} max-w-[70%] min-w-0`}>
                      {/* Message Bubble */}
                      <div
                        className={`
                          px-4 py-3 rounded-2xl shadow-sm break-words overflow-hidden
                          ${isFromUser 
                            ? 'bg-blue-600 text-white rounded-br-md' 
                            : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-bl-md'
                          }
                        `}
                      >
                        <EmailBodyRenderer 
                          body={msg.body || msg.snippet || ''} 
                          isFromCurrentUser={isFromUser}
                        />

                        {/* Attachments */}
                        {msg.has_attachments && msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.attachments.map((att: any, i: number) => (
                              <div 
                                key={i} 
                                className={`
                                  px-3 py-2 rounded-lg text-xs flex items-center gap-2
                                  ${isFromUser 
                                    ? 'bg-blue-500/30 text-white' 
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                                  }
                                `}
                              >
                                <MdAttachFile size={14} />
                                <span className="truncate">{att.filename || 'Unnamed File'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-[var(--text-tertiary)] mt-1 px-1">
                        {msg.received_at && format(new Date(msg.received_at), 'h:mm a')}
                      </div>
                    </div>

                    {/* Empty space for sent messages to balance layout */}
                    {isFromUser && <div className="w-8 flex-shrink-0" />}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Draggable Divider */}
        <div 
          className={`
            w-1 bg-[var(--border-color)] hover:bg-blue-500 cursor-col-resize transition-colors relative group
            ${isResizing ? 'bg-blue-500' : ''}
          `}
          onMouseDown={() => setIsResizing(true)}
        >
          {/* Visual indicator */}
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/10 transition-colors" />
        </div>

        {/* Right: Reply Panel */}
        <div 
          className="flex flex-col bg-[var(--bg-primary)]"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Reply to {getOtherPerson()}
            </h3>
            
            <div className="flex-1 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              {/* Textarea */}
              <textarea
                className="flex-1 w-full p-4 bg-transparent border-none resize-none focus:ring-0 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                placeholder="Write your reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleSendReply()
                  }
                }}
              />
              
              {/* Footer Actions */}
              <div className="p-3 flex items-center justify-between bg-[var(--bg-secondary)]/20 border-t border-[var(--border-color)] rounded-b-2xl">
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
            
            <p className="text-xs text-[var(--text-tertiary)] mt-3 text-center">
              Press ⌘ + Enter to send
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
