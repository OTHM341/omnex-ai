import { useState } from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className={`flex w-full gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isUser
            ? 'bg-blue-500/15 text-blue-300'
            : 'bg-violet-500/15 text-violet-300'
        }`}
      >
        {isUser ? <User size={17} /> : <Bot size={18} />}
      </div>

      <div
        className={`flex max-w-[80%] flex-col gap-2 ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-300">
            {isUser ? 'You' : 'OMNEX AI'}
          </span>
          <span>·</span>
          <span>{message.timestamp}</span>
        </div>

        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-7 ${
            isUser
              ? 'rounded-tr-sm bg-violet-600/20 text-slate-100'
              : 'rounded-tl-sm border border-white/[0.07] bg-slate-900/80 text-slate-200'
          }`}
        >
          {message.content}
        </div>

        {!isUser && (
          <button
            type="button"
            onClick={copyMessage}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            aria-label="Copy assistant message"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}