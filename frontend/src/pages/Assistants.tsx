import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Code2,
  PenLine,
  BrainCircuit,
  Search,
  ArrowUpRight,
  Bot,
  MessageSquare,
} from 'lucide-react'

export type AssistantType =
  | 'GENERAL'
  | 'CODE'
  | 'WRITING'
  | 'RESEARCH'

interface AssistantsProps {
  onUseAssistant: (assistantType: AssistantType) => void
}

const assistants: {
  id: AssistantType
  name: string
  description: string
  category: string
  icon: typeof Sparkles
  color: string
  status: string
}[] = [
  {
    id: 'GENERAL',
    name: 'AI Chat',
    description:
      'A versatile AI assistant for everyday questions, ideas and problem solving.',
    category: 'General',
    icon: Sparkles,
    color: 'purple',
    status: 'Available',
  },
  {
    id: 'CODE',
    name: 'Code Assistant',
    description:
      'Write, debug, explain and optimize code with intelligent development support.',
    category: 'Development',
    icon: Code2,
    color: 'blue',
    status: 'Available',
  },
  {
    id: 'WRITING',
    name: 'Writing Assistant',
    description:
      'Create, rewrite and improve professional content, emails and documents.',
    category: 'Writing',
    icon: PenLine,
    color: 'pink',
    status: 'Available',
  },
  {
    id: 'RESEARCH',
    name: 'Research Assistant',
    description:
      'Explore topics, organize information and structure your research.',
    category: 'Research',
    icon: BrainCircuit,
    color: 'green',
    status: 'Available',
  },
]

const categories = [
  'All',
  'General',
  'Development',
  'Writing',
  'Research',
]

export default function Assistants({
  onUseAssistant,
}: AssistantsProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredAssistants = useMemo(() => {
    const query = search.trim().toLowerCase()

    return assistants.filter((assistant) => {
      const matchesCategory =
        activeCategory === 'All' ||
        assistant.category === activeCategory

      const matchesSearch =
        assistant.name.toLowerCase().includes(query) ||
        assistant.description.toLowerCase().includes(query) ||
        assistant.category.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [search, activeCategory])

  return (
    <div className="assistants-page">
      <motion.section
        className="assistants-intro"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="assistants-intro-icon">
          <Bot size={25} />
        </div>

        <div>
          <h2>Your AI team, ready to help.</h2>
          <p>
            Choose an assistant designed to help you work smarter
            and accomplish more.
          </p>
        </div>
      </motion.section>

      <section className="assistants-toolbar">
        <div className="assistants-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search assistants..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <span className="assistants-count">
          {filteredAssistants.length} assistants
        </span>
      </section>

      <section className="assistant-filters">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`assistant-filter ${
              activeCategory === category ? 'active' : ''
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>

      <section className="assistants-grid">
        {filteredAssistants.map((assistant, index) => {
          const Icon = assistant.icon

          return (
            <motion.article
              className="assistant-card"
              key={assistant.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              whileHover={{ y: -5 }}
            >
              <div className="assistant-card-top">
                <div className={`assistant-icon ${assistant.color}`}>
                  <Icon size={24} />
                </div>

                <span className="assistant-tag">
                  {assistant.category.toUpperCase()}
                </span>
              </div>

              <h3>{assistant.name}</h3>
              <p>{assistant.description}</p>

              <div className="assistant-card-footer">
                <span className="assistant-availability">
                  <span />
                  {assistant.status}
                </span>

                <button
                  type="button"
                  className="assistant-action"
                  onClick={() => onUseAssistant(assistant.id)}
                >
                  Start chatting
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </motion.article>
          )
        })}
      </section>

      {filteredAssistants.length === 0 && (
        <div className="assistants-empty">
          <div>
            <MessageSquare size={25} />
          </div>

          <h3>No assistants found</h3>
          <p>Try another search or choose a different category.</p>

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setActiveCategory('All')
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}