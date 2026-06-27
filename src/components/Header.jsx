import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { ChatContext } from '../context/ChatContext';
import { Sun, Moon, ShoppingBag, Search, User, MessageSquare } from 'lucide-react';

export default function Header() {
  const {
    theme,
    toggleTheme,
    view,
    setView,
    searchQuery,
    setSearchQuery,
    setSelectedProductId,
    currentUser,
    setIsAuthModalOpen,
    logout,
    loadUserListings
  } = useContext(ShopContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const {
    conversations,
    selectConversation,
    setIsChatOpen
  } = useContext(ChatContext);

  const unreadCount = currentUser
    ? conversations.filter(conv =>
        conv.lastMessage &&
        conv.lastMessage.isRead === false &&
        Number(conv.lastMessage.senderId) !== Number(currentUser.id)
      ).length
    : 0;

  const handleLogoClick = () => {
    setView('storefront');
    setSelectedProductId(null);
    window.history.pushState(null, '', '/');
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo */}
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <ShoppingBag size={24} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))' }} />
          Chợ Tốt
          <span className="logo-dot"></span>
        </div>

        {/* Global Search Bar (Only display in Storefront Catalog view) */}
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search posts by title, location, category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Clear product detailed view if user starts searching
              setSelectedProductId(null);
              // Ensure we are in storefront catalog
              setView('storefront');
            }}
          />
        </div>

        {/* Actions panel */}
        <div className="header-actions">
          {/* Light / Dark Mode Toggle */}
          <button
            className="theme-switch"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Sign In / Sign Up Trigger OR Profile controls */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Messages Toggle & Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsMessagesOpen(!isMessagesOpen)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--clr-bg-app)',
                    border: '1px solid var(--clr-border)',
                    color: 'var(--clr-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: 0
                  }}
                  title="Messages"
                >
                  <MessageSquare size={20} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: 'var(--clr-danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 0 2px var(--clr-bg-card)'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isMessagesOpen && (
                  <>
                    <div
                      onClick={() => setIsMessagesOpen(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998
                      }}
                    />
                    <div
                      className="anim-scale-in"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        background: 'var(--clr-bg-card)',
                        border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '0.5rem 0',
                        width: '320px',
                        maxHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 999,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: '0.5rem 1rem',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          color: 'var(--clr-text-primary)',
                          borderBottom: '1px solid var(--clr-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>Chats</span>
                        {unreadCount > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', fontWeight: 500 }}>
                            {unreadCount} unread
                          </span>
                        )}
                      </div>

                      {/* Conversations List */}
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {conversations.length === 0 ? (
                          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--clr-text-secondary)', fontSize: '0.8rem' }}>
                            No messages yet.
                          </div>
                        ) : (
                          conversations.slice(0, 6).map((conv) => {
                            const partnerName = conv.partner?.name || `User #${conv.partner?.id}`;
                            const lastMsgText = conv.lastMessage?.content || 'No messages yet';
                            const isUnread = conv.lastMessage && 
                                             conv.lastMessage.isRead === false && 
                                             Number(conv.lastMessage.senderId) !== Number(currentUser.id);
                            const timeStr = conv.lastMessage
                              ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '';

                            return (
                              <div
                                key={conv.id}
                                onClick={() => {
                                  setIsMessagesOpen(false);
                                  selectConversation(conv.id);
                                  setIsChatOpen(true);
                                }}
                                style={{
                                  padding: '0.75rem 1rem',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--clr-border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  transition: 'background var(--transition-fast)'
                                }}
                                className="dropdown-item"
                              >
                                {/* Mini Avatar */}
                                <div
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    flexShrink: 0
                                  }}
                                >
                                  {partnerName.charAt(0).toUpperCase()}
                                </div>

                                {/* Content preview */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: isUnread ? 800 : 600, fontSize: '0.8rem', color: 'var(--clr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {partnerName}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', flexShrink: 0 }}>
                                      {timeStr}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: isUnread ? 'var(--clr-text-primary)' : 'var(--clr-text-secondary)', fontWeight: isUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                                    {lastMsgText}
                                  </span>
                                </div>

                                {/* Unread blue dot */}
                                {isUnread && (
                                  <div
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      background: 'var(--clr-primary)',
                                      flexShrink: 0
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Avatar Toggle & Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  title={`Logged in as ${currentUser.name} (${currentUser.email})`}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: '1px solid var(--clr-border)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: 0
                  }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </button>

                {isDropdownOpen && (
                  <>
                    {/* Invisible backdrop to close dropdown on click outside */}
                    <div
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998
                      }}
                    />
                    <div
                      className="anim-scale-in"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        background: 'var(--clr-bg-card)',
                        border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '0.5rem 0',
                        minWidth: '180px',
                        zIndex: 999,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--clr-border)', marginBottom: '0.25rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--clr-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser.email}
                        </div>
                      </div>
                      
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--clr-text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          width: '100%'
                        }}
                        className="dropdown-item"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          loadUserListings(currentUser.id);
                        }}
                      >
                        My Listings
                      </button>

                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--clr-text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          width: '100%'
                        }}
                        className="dropdown-item"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setView('my-offers');
                          setSelectedProductId(null);
                          window.history.pushState({ view: 'my-offers' }, '', '/my-offers');
                        }}
                      >
                        My Offers
                      </button>
                      
                      {currentUser.role === 'ADMIN' && (
                        <button
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            color: 'var(--clr-text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            width: '100%'
                          }}
                          className="dropdown-item"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setView('admin');
                          }}
                        >
                          Admin Panel
                        </button>
                      )}
                      
                      <div style={{ height: '1px', background: 'var(--clr-border)', margin: '0.25rem 0' }}></div>
                      
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--clr-danger)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          width: '100%',
                          fontWeight: 600
                        }}
                        className="dropdown-item"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={() => setIsAuthModalOpen(true)}
              title="Sign In or Sign Up"
            >
              <User size={15} />
              Sign In
            </button>
          )}

          {/* Switch View Trigger (Only visible to authenticated Administrators) */}

        </div>
      </div>
    </header>
  );
}
