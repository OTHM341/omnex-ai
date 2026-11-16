import { useState } from 'react'

import Sidebar from './Sidebar'
import Header from './Header'

import Dashboard from '../../pages/Dashboard'
import Chat from '../../pages/Chat'
import HistoryPage from '../../pages/History'
import Assistants, {
  type AssistantType,
} from '../../pages/Assistants'

import {
  MessageSquare,
  History,
  Settings,
  Sparkles,
} from 'lucide-react'

export default function MainLayout() {
  const [activePage, setActivePage] = useState('Dashboard')

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null)

  const [selectedAssistantType, setSelectedAssistantType] =
    useState<AssistantType>('GENERAL')

  const [startNewConversation, setStartNewConversation] =
    useState(false)

  const [chatInstanceKey, setChatInstanceKey] = useState(0)

  const pageDescriptions: Record<string, string> = {
    Dashboard: 'Overview of your workspace.',
    'AI Chat': 'Chat with your intelligent AI assistants.',
    Assistants: 'Discover and manage your AI assistants.',
    History: 'Access your previous conversations.',
    Settings: 'Customize your workspace experience.',
  }

  const handleNavigate = (page: string) => {
    if (page === 'AI Chat') {
      setSelectedConversationId(null)
      setSelectedAssistantType('GENERAL')
      setStartNewConversation(false)
      setChatInstanceKey((previous) => previous + 1)
    }

    setActivePage(page)
  }

  const handleUseAssistant = (assistantType: AssistantType) => {
    setSelectedConversationId(null)
    setSelectedAssistantType(assistantType)
    setStartNewConversation(true)
    setChatInstanceKey((previous) => previous + 1)
    setActivePage('AI Chat')
  }

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setStartNewConversation(false)
    setChatInstanceKey((previous) => previous + 1)
    setActivePage('AI Chat')
  }

  const handleConversationOpened = () => {
    setSelectedConversationId(null)
    setStartNewConversation(false)
  }

  const renderContent = () => {
    if (activePage === 'Dashboard') {
      return <Dashboard onNavigate={handleNavigate} />
    }

    if (activePage === 'AI Chat') {
      return (
        <Chat
          key={chatInstanceKey}
          initialConversationId={selectedConversationId}
          initialAssistantType={selectedAssistantType}
          startNewConversation={startNewConversation}
          onConversationOpened={handleConversationOpened}
        />
      )
    }

    if (activePage === 'Assistants') {
      return (
        <Assistants
          onUseAssistant={handleUseAssistant}
        />
      )
    }

    if (activePage === 'History') {
      return (
        <HistoryPage
          onOpenConversation={handleOpenConversation}
        />
      )
    }

    const icons: Record<string, typeof MessageSquare> = {
      History: History,
      Settings: Settings,
    }

    const Icon = icons[activePage] ?? Sparkles

    return (
      <div className="placeholder-page">
        <div className="placeholder-icon">
          <Icon size={30} />
        </div>

        <h2>{activePage}</h2>

        <p>
          {pageDescriptions[activePage] ??
            'Explore more features in OMNEX AI.'}
        </p>

        <span className="coming-soon">Coming soon</span>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      <main className="main-area">
        <Header title={activePage} />

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="page-eyebrow">
                WORKSPACE / OVERVIEW
              </p>

              <h1>
                {activePage === 'Dashboard'
                  ? 'Welcome to OMNEX AI'
                  : activePage}
              </h1>

              <p>{pageDescriptions[activePage]}</p>
            </div>

            <div className="online-status">
              <span />
              All systems operational
            </div>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  )
}