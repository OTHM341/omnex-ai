import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = message.trim()

    if (!trimmedMessage || disabled) return

    onSend(trimmedMessage)
    setMessage('')
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="border-t border-white/[0.07] bg-[#080b14]/90 px-4 py-5">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-3 shadow-xl shadow-black/10 transition focus-within:border-violet-500/40">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message OMNEX AI..."
            rows={2}
            disabled={disabled}
            aria-label="Write your message"
            className="max-h-40 min-h-14 w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                title="File attachments coming soon"
                aria-label="Attach a file"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-60"
              >
                <Paperclip size={16} />
              </button>

              <span className="text-[11px] text-slate-500">
                Shift + Enter for a new line
              </span>
            </div>

            <button
              type="submit"
              disabled={!message.trim() || disabled}
              aria-label="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-600">
          OMNEX AI can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  )
}