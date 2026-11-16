import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  History,
  Settings,
  Sparkles,
  Plus,
  PanelLeftClose,
} from 'lucide-react'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'AI Chat', icon: MessageSquare },
  { label: 'Assistants', icon: Bot },
  { label: 'History', icon: History },
]

export default function Sidebar({
  activePage,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Sparkles size={22} />
        </div>

        <span>
          OMNEX<span className="brand-accent"> AI</span>
        </span>

        <button
          className="icon-button sidebar-collapse"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <button
        className="new-chat-button"
        onClick={() => onNavigate('AI Chat')}
      >
        <Plus size={18} />
        <span>New conversation</span>
      </button>

      <div className="nav-section">
        <p className="nav-label">MAIN MENU</p>

        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activePage === label ? 'active' : ''}`}
            onClick={() => onNavigate(label)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="nav-section">
          <p className="nav-label">PREFERENCES</p>

          <button
            className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`}
            onClick={() => onNavigate('Settings')}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>
        </div>

        <div className="upgrade-card">
          <div className="upgrade-icon">
            <Sparkles size={18} />
          </div>

          <strong>Explore OMNEX AI</strong>

          <p>
            Discover a smarter way to work with artificial intelligence.
          </p>

          <button onClick={() => onNavigate('Assistants')}>
            Explore assistants
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar">OM</div>

          <div className="user-info">
            <strong>Othmane</strong>
            <span>Free plan</span>
          </div>

          <button
            className="icon-button"
            aria-label="Profile settings"
            onClick={() => onNavigate('Settings')}
          >
            <Settings size={17} />
          </button>
        </div>
      </div>
    </aside>
  )
}