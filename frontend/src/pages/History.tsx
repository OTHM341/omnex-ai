import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MessageSquare,
  Search,
  Trash2,
  ArrowUpRight,
  Clock3,
  RefreshCw,
  History as HistoryIcon,
  AlertCircle,
  X,
} from 'lucide-react'
import { api } from '../services/api'

interface ConversationSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  lastMessage: string
}

interface HistoryProps {
  onOpenConversation: (id: string) => void
}

const formatDate = (date: string) => {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) return 'Unknown date'

  return value.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const normalizeText = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export default function History({ onOpenConversation }: HistoryProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await api.get<ConversationSummary[]>('/conversations')
      setConversations(response.data)
    } catch (err) {
      console.error('History loading error:', err)
      setError('Unable to load conversation history. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  const filteredConversations = useMemo(() => {
    const query = normalizeText(search)

    if (!query) return conversations

    return conversations.filter((conversation) => {
      const title = normalizeText(conversation.title)
      const lastMessage = normalizeText(conversation.lastMessage)

      return title.includes(query) || lastMessage.includes(query)
    })
  }, [conversations, search])

  const handleDelete = async (conversation: ConversationSummary) => {
    const confirmed = window.confirm(
      `Delete "${conversation.title}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(conversation.id)
    setError('')

    try {
      await api.delete(`/conversations/${conversation.id}`)

      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id),
      )
    } catch (err) {
      console.error('Conversation deletion error:', err)
      setError('Could not delete this conversation. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const clearSearch = () => {
    setSearch('')
  }

  return (
    <section className="flex flex-col gap-6">

      {/* History Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-violet-300">
            <HistoryIcon size={17} />

            <span className="text-xs font-semibold uppercase tracking-wider">
              Your activity
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            Conversation History
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Access and manage your previous AI conversations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadConversations()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={isLoading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Search and Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or message..."
            aria-label="Search conversations"
            className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-10 pr-10 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-violet-500/50"
          />

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500">
          {search
            ? `${filteredConversations.length} of ${conversations.length} conversations`
            : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex min-h-[250px] items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-[#101625] text-sm text-slate-400">
          <RefreshCw size={18} className="animate-spin text-violet-400" />
          Loading conversations...
        </div>
      ) : filteredConversations.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#101625] px-5 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
            {search ? <Search size={27} /> : <MessageSquare size={27} />}
          </div>

          <h3 className="text-lg font-semibold text-white">
            {search
              ? 'No matching conversations'
              : 'No conversations yet'}
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            {search
              ? 'Try another search term to find your conversation.'
              : 'Your conversations with OMNEX AI will appear here.'}
          </p>

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* Conversation List */
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101625]">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-200">
              All conversations
            </h3>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {filteredConversations.map((conversation) => (
              <article
                key={conversation.id}
                className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.025] sm:flex-row sm:items-center"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/10 text-violet-300">
                  <MessageSquare size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-slate-100">
                    {conversation.title || 'Untitled conversation'}
                  </h4>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {conversation.lastMessage || 'No messages yet'}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock3 size={12} />
                    <span>{formatDate(conversation.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenConversation(conversation.id)}
                    className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20 hover:text-white"
                  >
                    Open
                    <ArrowUpRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(conversation)}
                    disabled={deletingId === conversation.id}
                    aria-label={`Delete ${conversation.title}`}
                    title="Delete conversation"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deletingId === conversation.id ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}