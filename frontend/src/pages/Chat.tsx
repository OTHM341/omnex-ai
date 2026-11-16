import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  ChevronDown,
  Plus,
  LoaderCircle,
  History,
} from 'lucide-react'

import ChatWindow from '../components/chat/ChatWindow'
import ChatInput from '../components/chat/ChatInput'
import type { ChatMessage } from '../components/chat/MessageBubble'
import type { AssistantType } from './Assistants'
import { api } from '../services/api'

interface ApiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface ConversationSummary {
  id: string
  title: string
  assistantType?: AssistantType
  createdAt: string
  updatedAt: string
  lastMessage: string
}

interface ConversationResponse {
  id: string
  title: string
  assistantType?: AssistantType
  createdAt: string
  updatedAt: string
  messages: ApiMessage[]
}

interface ChatProps {
  initialConversationId?: string | null
  initialAssistantType?: AssistantType
  startNewConversation?: boolean
  onConversationOpened?: () => void
}

const assistantNames: Record<AssistantType, string> = {
  GENERAL: 'AI Chat',
  CODE: 'Code Assistant',
  WRITING: 'Writing Assistant',
  RESEARCH: 'Research Assistant',
}

const formatTimestamp = (date: string) =>
  new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

const mapMessages = (messages: ApiMessage[]): ChatMessage[] =>
  messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: formatTimestamp(message.createdAt),
  }))

const normalizeAssistantType = (
  assistantType?: string,
): AssistantType => {
  const allowedTypes: AssistantType[] = [
    'GENERAL',
    'CODE',
    'WRITING',
    'RESEARCH',
  ]

  const normalized = assistantType?.toUpperCase() as AssistantType

  return allowedTypes.includes(normalized)
    ? normalized
    : 'GENERAL'
}

export default function Chat({
  initialConversationId = null,
  initialAssistantType = 'GENERAL',
  startNewConversation = false,
  onConversationOpened,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [model, setModel] = useState('Gemini')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null)

  const [conversations, setConversations] =
    useState<ConversationSummary[]>([])

  const [selectedAssistantType, setSelectedAssistantType] =
    useState<AssistantType>(initialAssistantType)

  const [errorMessage, setErrorMessage] = useState('')

  const initialized = useRef(false)

  const refreshConversations = async () => {
    const response = await api.get<ConversationSummary[]>('/conversations')
    setConversations(response.data)
  }

  const createConversation = async (
    assistantType: AssistantType = selectedAssistantType,
  ) => {
    const response = await api.post<ConversationResponse>(
      '/conversations',
      { assistantType },
    )

    setActiveConversationId(response.data.id)
    setSelectedAssistantType(
      normalizeAssistantType(response.data.assistantType ?? assistantType),
    )
    setMessages([])

    await refreshConversations()

    return response.data
  }

  const openConversation = async (conversationId: string) => {
    const response = await api.get<ConversationResponse>(
      `/conversations/${conversationId}`,
    )

    setActiveConversationId(response.data.id)
    setSelectedAssistantType(
      normalizeAssistantType(response.data.assistantType),
    )
    setMessages(mapMessages(response.data.messages))

    return response.data
  }

  const initializeChat = async () => {
    setIsInitializing(true)
    setErrorMessage('')

    try {
      const response = await api.get<ConversationSummary[]>('/conversations')
      setConversations(response.data)

      if (initialConversationId) {
        await openConversation(initialConversationId)
        onConversationOpened?.()
      } else if (startNewConversation) {
        await createConversation(initialAssistantType)
        onConversationOpened?.()
      } else if (response.data.length > 0) {
        await openConversation(response.data[0].id)
      } else {
        await createConversation(initialAssistantType)
        onConversationOpened?.()
      }
    } catch (error) {
      console.error('Conversation initialization error:', error)

      setErrorMessage(
        'Could not load conversations. Please check that the backend is running.',
      )
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    if (initialized.current) return

    initialized.current = true
    void initializeChat()
  }, [])

  const handleSend = async (content: string) => {
    const message = content.trim()

    if (!message || isLoading || isInitializing) return

    setErrorMessage('')
    setIsLoading(true)

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: formatTimestamp(new Date().toISOString()),
    }

    const assistantMessageId = crypto.randomUUID()

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: formatTimestamp(new Date().toISOString()),
      },
    ])

    try {
      let conversationId = activeConversationId

      if (!conversationId) {
        const newConversation = await createConversation()
        conversationId = newConversation.id
      }

      const response = await fetch(
        `/api/conversations/${conversationId}/messages/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ message }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          errorText || `Server error: ${response.status}`,
        )
      }

      if (!response.body) {
        throw new Error('Streaming is not supported by this response.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let buffer = ''
      let streamError: string | null = null
      let receivedChunk = false

      const processEvent = (rawEvent: string) => {
        const lines = rawEvent.split(/\r?\n/)
        let eventName = 'message'
        const dataLines: string[] = []

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim())
          }
        }

        if (eventName === 'reset') {
          receivedChunk = false

          setMessages((current) =>
            current.map((item) =>
              item.id === assistantMessageId
                ? { ...item, content: '' }
                : item,
            ),
          )

          return
        }

        if (dataLines.length === 0) return

        const data = dataLines.join('\n')

        if (eventName === 'chunk') {
          try {
            const parsed = JSON.parse(data)
            const chunk = parsed.content ?? parsed.text ?? ''

            if (chunk) {
              receivedChunk = true

              setMessages((current) =>
                current.map((item) =>
                  item.id === assistantMessageId
                    ? { ...item, content: item.content + chunk }
                    : item,
                ),
              )
            }
          } catch (error) {
            console.error('Invalid streaming chunk:', error)
          }
        }

        if (eventName === 'error') {
          try {
            const parsed = JSON.parse(data)
            streamError = parsed.message ?? 'Streaming failed.'
          } catch {
            streamError = data || 'Streaming failed.'
          }
        }
      }

      while (true) {
        const { value, done } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() ?? ''

        for (const event of events) {
          processEvent(event)
        }

        if (streamError) {
          await reader.cancel()
          break
        }
      }

      buffer += decoder.decode()

      if (buffer.trim()) {
        processEvent(buffer)
      }

      if (streamError) {
        throw new Error(streamError)
      }

      if (!receivedChunk) {
        throw new Error(
          'Gemini returned an empty response. Please try again.',
        )
      }

      const conversationResponse = await api.get<ConversationResponse>(
        `/conversations/${conversationId}`,
      )

      setMessages(mapMessages(conversationResponse.data.messages))

      setSelectedAssistantType(
        normalizeAssistantType(conversationResponse.data.assistantType),
      )

      try {
        await refreshConversations()
      } catch (refreshError) {
        console.error(
          'Could not refresh conversation history:',
          refreshError,
        )
      }
    } catch (error) {
      console.error('Chat streaming error:', error)

      const errorText =
        error instanceof Error
          ? error.message
          : 'Could not process your message. Please try again.'

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                content: errorText,
              }
            : item,
        ),
      )

      setErrorMessage(errorText)
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = async () => {
    if (isLoading || isInitializing) return

    setIsInitializing(true)
    setErrorMessage('')

    try {
      await createConversation(selectedAssistantType)
    } catch (error) {
      console.error('Could not create a new conversation:', error)

      setErrorMessage(
        'Could not create a new conversation. Please try again.',
      )
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    if (!conversationId || isLoading || isInitializing) return

    setIsInitializing(true)
    setErrorMessage('')

    try {
      await openConversation(conversationId)
    } catch (error) {
      console.error('Could not load conversation:', error)

      setErrorMessage(
        'Could not load this conversation. Please try again.',
      )
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-190px)] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1020]/80">
      {/* Chat Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <Bot size={21} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              {assistantNames[selectedAssistantType]}
            </h2>

            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Gemini · {selectedAssistantType} assistant
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Conversation History */}
          <div className="relative">
            <History
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <select
              value={activeConversationId ?? ''}
              onChange={(event) =>
                void handleSelectConversation(event.target.value)
              }
              disabled={isLoading || isInitializing}
              aria-label="Conversation history"
              className="max-w-[170px] appearance-none rounded-lg border border-white/10 bg-[#111827] py-2 pl-8 pr-3 text-xs font-medium text-slate-300 outline-none focus:border-violet-500/50 disabled:opacity-50"
            >
              <option value="" disabled>
                Conversation history
              </option>

              {conversations.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.title}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selector */}
          <div className="relative">
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              aria-label="Select AI model"
              className="appearance-none rounded-lg border border-white/10 bg-[#111827] py-2 pl-3 pr-8 text-xs font-medium text-slate-300 outline-none focus:border-violet-500/50"
            >
              <option value="Gemini">Gemini · Connected</option>
              <option value="OpenAI" disabled>
                OpenAI · Coming soon
              </option>
              <option value="Claude" disabled>
                Claude · Coming soon
              </option>
            </select>

            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>

          {/* New Chat */}
          <button
            type="button"
            onClick={() => void startNewChat()}
            disabled={isLoading || isInitializing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col">
        {isInitializing ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-violet-300">
            <LoaderCircle size={17} className="animate-spin" />
            Loading conversation...
          </div>
        ) : (
          <ChatWindow
            messages={messages}
            onSuggestion={handleSend}
          />
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="px-5 py-3 text-xs text-red-400"
        >
          {errorMessage}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div
          className="flex items-center gap-2 px-6 py-3 text-xs text-violet-300"
          aria-live="polite"
        >
          <LoaderCircle size={15} className="animate-spin" />
          Gemini is thinking...
        </div>
      )}

      {/* Message Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || isInitializing}
      />
    </section>
  )
}