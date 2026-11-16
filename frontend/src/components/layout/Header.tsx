import { Bell, Search, Command } from 'lucide-react'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>OMNEX AI</span>
        <span className="breadcrumb-separator">/</span>
        <strong>{title}</strong>
      </div>

      <div className="header-actions">
        <div className="search-box">
          <Search size={17} />
          <span>Search...</span>
          <kbd>
            <Command size={11} /> K
          </kbd>
        </div>

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          type="button"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="header-avatar">OM</div>
      </div>
    </header>
  )
}