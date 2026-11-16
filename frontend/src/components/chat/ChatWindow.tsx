import { Bot, Sparkles } from 'lucide-react'
import MessageBubble, {
  type ChatMessage,
} from './MessageBubble'

interface ChatWindowProps {
  messages: ChatMessage[]
  onSuggestion: (suggestion: string) => void
}

const suggestions = [
  'Explain a programming concept',
  'Help me write some code',
  'Improve my productivity',
  'Summarize a document',
]

export default function ChatWindow({
  messages,
  onSuggestion,
}: ChatWindowProps) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-10">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-950/20">
          <Bot size={31} />
        </div>

        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={15} className="text-violet-400" />

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Your AI workspace
          </span>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          What can I help you with?
        </h2>

        <p className="mt-3 max-w-md text-center text-sm leading-6 text-slate-400">
          Ask questions, explore ideas, write code, or get help
          with your next project.
        </p>

        <div className="mt-9 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestion(suggestion)}
              className="rounded-xl border border-white/[0.08] bg-slate-900/60 px-4 py-4 text-left text-sm text-slate-300 transition hover:border-violet-500/30 hover:bg-slate-800/70"
            >
              <span className="text-violet-400">✦</span>
              <span className="ml-2">{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}
      </div>
    </div>
  )
}