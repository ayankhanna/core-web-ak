import { useState, useRef, useEffect } from 'react'
import { MdAttachFile, MdLanguage, MdLightbulb, MdArrowUpward, MdHeadset } from 'react-icons/md'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)

    // Simulated response - replace with actual API call
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'This is a placeholder chat interface. Connect your AI service here.',
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-[#212121] text-gray-800 dark:text-gray-100 font-sans overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 pt-8 pb-40 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
              <div className="bg-white dark:bg-[#2f2f2f] p-4 rounded-full shadow-sm mb-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-full" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Chat interface placeholder. Start a conversation!
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`group w-full text-gray-800 dark:text-gray-100 pb-4`}
            >
              <div className="flex gap-4 mx-auto m-auto">
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0 text-xs overflow-hidden">
                    <div className="w-6 h-6 bg-black dark:bg-white rounded-full" />
                  </div>
                )}

                <div className="relative flex-1 overflow-hidden">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-[#f4f4f4] dark:bg-[#2f2f2f] px-5 py-2.5 rounded-[24px] max-w-[80%] whitespace-pre-wrap text-[15px]">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none leading-7 text-[15px]">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                <div className="w-6 h-6 bg-black dark:bg-white rounded-full" />
              </div>
              <div className="flex items-center gap-1 h-8">
                <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-[#212121] dark:via-[#212121] pb-6 pt-10">
        <div className="max-w-4xl mx-auto px-8">
          <div className="relative bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[26px] px-4 py-3 flex items-end gap-2">
            {/* Left Actions */}
            <button className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors mb-1">
              <MdAttachFile size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors mb-1">
              <MdLanguage size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors mb-1">
              <MdLightbulb size={20} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="flex-1 max-h-[200px] py-3 bg-transparent border-0 focus:ring-0 outline-none resize-none overflow-y-auto text-[15px] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
              rows={1}
            />

            {/* Right Actions */}
            {input.trim() ? (
              <button
                onClick={() => handleSubmit()}
                className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full mb-1 transition-all"
              >
                <MdArrowUpward size={20} />
              </button>
            ) : (
              <button className="p-2 text-gray-900 dark:text-white bg-transparent rounded-full mb-1">
                <MdHeadset size={24} />
              </button>
            )}
          </div>
          <div className="text-center text-xs text-gray-400 mt-2">
            AI can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  )
}

