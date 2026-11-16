import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Bot,
  Zap,
  Clock3,
  ArrowUpRight,
  Sparkles,
  Code2,
  PenLine,
  BrainCircuit,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

import { api } from '../services/api'

interface DashboardProps {
  onNavigate?: (page: string) => void
}

interface ConversationSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  lastMessage: string
}

interface ApiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface ConversationResponse {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ApiMessage[]
}

interface Activity {
  title: string
  time: string
  type: string
}

const assistants = [
  {
    name: 'AI Chat',
    description: 'A versatile assistant for all your questions.',
    icon: Sparkles,
    color: 'purple',
    tag: 'GENERAL',
  },
  {
    name: 'Code Assistant',
    description: 'Develop, debug, and optimize your code.',
    icon: Code2,
    color: 'blue',
    tag: 'DEVELOPMENT',
  },
  {
    name: 'Writing Assistant',
    description: 'Write, edit, and improve your content.',
    icon: PenLine,
    color: 'pink',
    tag: 'WRITING',
  },
  {
    name: 'Research Assistant',
    description: 'Organize your ideas and analyze information.',
    icon: BrainCircuit,
    color: 'green',
    tag: 'RESEARCH',
  },
]

const formatRelativeDate = (date: string) => {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) return 'Unknown date'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const activityDate = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  )

  const difference = Math.round(
    (today.getTime() - activityDate.getTime()) / 86400000,
  )

  if (difference === 0) {
    return `Today, ${value.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  if (difference === 1) {
    return `Yesterday, ${value.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  return value.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [requestCount, setRequestCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await api.get<ConversationSummary[]>('/conversations')

      const sortedConversations = [...response.data].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
      )

      setConversations(sortedConversations)

      // Count actual user messages across saved conversations.
      const conversationDetails = await Promise.allSettled(
        sortedConversations.map((conversation) =>
          api.get<ConversationResponse>(
            `/conversations/${conversation.id}`,
          ),
        ),
      )

      let totalRequests = 0

      conversationDetails.forEach((result) => {
        if (result.status === 'fulfilled') {
          totalRequests += result.value.data.messages.filter(
            (message) => message.role.toLowerCase() === 'user',
          ).length
        }
      })

      setRequestCount(totalRequests)
    } catch (err) {
      console.error('Dashboard loading error:', err)
      setError('Unable to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const stats = [
    {
      label: 'Conversations',
      value: isLoading ? '—' : String(conversations.length),
      change: 'Total saved conversations',
      icon: MessageSquare,
    },
    {
      label: 'AI Assistants',
      value: String(assistants.length).padStart(2, '0'),
      change: 'Available assistants',
      icon: Bot,
    },
    {
      label: 'Requests Processed',
      value: isLoading ? '—' : String(requestCount),
      change: 'User messages processed',
      icon: Zap,
    },
    {
      label: 'Time Saved',
      value: '—',
      change: 'Usage insights coming soon',
      icon: Clock3,
    },
  ]

  const activities: Activity[] = conversations.slice(0, 4).map(
    (conversation) => ({
      title: conversation.title || 'Untitled conversation',
      time: formatRelativeDate(conversation.updatedAt),
      type: 'AI Chat',
    }),
  )

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <motion.section
        className="welcome-banner"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <div className="welcome-badge">
            <Sparkles size={14} />
            YOUR AI WORKSPACE
          </div>

          <h2>
            Imagine. Create. <span>Innovate.</span>
          </h2>

          <p>
            Bring your AI tools together and turn your ideas
            into meaningful results.
          </p>

          <button
            className="primary-button"
            onClick={() => onNavigate?.('AI Chat')}
          >
            <Sparkles size={17} />
            Explore OMNEX AI
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="welcome-decoration">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="orb-center">
            <BrainCircuit size={54} />
          </div>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
        </div>
      </motion.section>

      {/* Dashboard Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={17} />
            {error}
          </span>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="flex items-center gap-2 text-xs font-semibold hover:text-white"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon

          return (
            <motion.article
              className="stat-card"
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="stat-top">
                <div className={`stat-icon stat-icon-${index}`}>
                  <Icon size={19} />
                </div>

                <ArrowUpRight size={16} className="muted-icon" />
              </div>

              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
              <span>{stat.change}</span>
            </motion.article>
          )
        })}
      </section>

      {/* AI Assistants */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>Your AI Assistants</h2>
            <p>Intelligent tools for every need.</p>
          </div>

          <button
            className="text-button"
            onClick={() => onNavigate?.('Assistants')}
          >
            View all <ChevronRight size={16} />
          </button>
        </div>

        <div className="assistants-grid">
          {assistants.map((assistant, index) => {
            const Icon = assistant.icon

            return (
              <motion.article
                className="assistant-card"
                key={assistant.name}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="assistant-card-top">
                  <div className={`assistant-icon ${assistant.color}`}>
                    <Icon size={23} />
                  </div>

                  <span className="assistant-tag">
                    {assistant.tag}
                  </span>
                </div>

                <h3>{assistant.name}</h3>
                <p>{assistant.description}</p>

                <button
                  className="assistant-action"
                  onClick={() => onNavigate?.('AI Chat')}
                >
                  Use assistant <ArrowUpRight size={16} />
                </button>
              </motion.article>
            )
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="section-block activity-section">
        <div className="section-heading">
          <div>
            <h2>Recent Activity</h2>
            <p>A quick overview of your latest interactions.</p>
          </div>

          <button
            className="text-button"
            onClick={() => onNavigate?.('History')}
          >
            View history <ChevronRight size={16} />
          </button>
        </div>

        <div className="activity-card">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-slate-400">
              <RefreshCw size={16} className="animate-spin" />
              Loading recent activity...
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity, index) => (
              <div
                className="activity-row"
                key={`${activity.title}-${index}`}
              >
                <div className="activity-icon">
                  <MessageSquare size={18} />
                </div>

                <div className="activity-details">
                  <strong>{activity.title}</strong>
                  <span>{activity.type}</span>
                </div>

                <span className="activity-time">
                  {activity.time}
                </span>

                <ChevronRight size={17} className="muted-icon" />
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              No recent conversations yet. Start your first AI conversation.
            </div>
          )}

          <button
            className="activity-add"
            onClick={() => onNavigate?.('AI Chat')}
          >
            <Plus size={16} /> New conversation
          </button>
        </div>
      </section>
    </div>
  )
}